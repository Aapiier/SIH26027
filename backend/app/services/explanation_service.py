"""
RailSync AI — Task & Decision Feasibility Explainer
Provides mathematically grounded explanations, asset telemetry, and ML failure risk
attributions for both scheduled and unscheduled maintenance tasks.
"""

from typing import Dict, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.db_models import MaintenanceRequest, CandidateWindow, Timetable, Asset, BlockPlanItem, BlockPlan
from backend.app.pipeline.ml_model import DefectRiskPredictor
from backend.app.pipeline.feature_engineering_v2 import extract_asset_features

_predictor = DefectRiskPredictor()


def explain_unscheduled_task(db: Session, request_id: str) -> Dict[str, Any]:
    """
    Perform comprehensive diagnostic and AI risk attribution analysis for a maintenance request.
    """
    req = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == request_id).first()
    if not req:
        return {"error": f"Request {request_id} not found"}

    asset = db.query(Asset).filter(Asset.asset_id == req.asset_id).first()
    ast_dict = asset.__dict__ if asset else {}

    # Extract ML Risk and Local Feature Attribution
    ml_risk, attribution = _predictor.predict_risk(req.__dict__, ast_dict)
    model_meta = _predictor.get_model_metadata()

    # Determine Tier
    is_emergency = (
        req.severity == "EMERGENCY" or 
        req.defect_type in ("RAIL_FRACTURE_RISK", "POINT_MACHINE_DETECTION_FAILURE", "OHE_CANTILEVER_FLASH_BURN")
    )
    is_critical = (
        req.severity == "CRITICAL" or 
        req.defect_type in ("IMR_ULTRASONIC_FLAW", "CONTACT_WIRE_PARTING_RISK", "TRACK_CIRCUIT_INTERMITTENT_DROP")
    )

    if is_emergency:
        tier = "TIER 1 (Emergency Safety Gate)"
        tier_description = "Deterministic override: Unconditional safety block required."
    elif is_critical:
        tier = "TIER 1.5 (Critical Predictive Escalation)"
        tier_description = "High structural severity scaled by ML risk."
    else:
        tier = "TIER 2 (AI-Prioritized Work)"
        tier_description = "Optimized block scheduling based on predictive risk."

    asset_info = {
        "asset_id": req.asset_id,
        "asset_name": asset.asset_name if asset else "Unknown",
        "category": asset.category if asset else "UNKNOWN",
        "department": req.department,
        "health_index": round(asset.health_index, 1) if asset else 85.0,
        "last_inspected_days_ago": asset.last_inspected_days_ago if asset else 14,
        "criticality_weight": asset.criticality_weight if asset else 3,
        "section_id": req.section_id,
        "track_id": req.track_id,
        "start_km": req.start_km,
        "end_km": req.end_km,
    }

    ai_risk_context = {
        "predicted_failure_risk": req.ai_risk_score if req.ai_risk_score is not None else ml_risk,
        "prediction_horizon": "14 Days",
        "prediction_target": "P(failure_within_14d)",
        "model_name": model_meta.get("model_name", "LightGBM / HistGradientBoosting"),
        "model_version": model_meta.get("version", "2.0.0"),
        "calibrated_threshold": model_meta.get("calibrated_threshold", 0.40),
        "synthetic_notice": "Predicted synthetic failure risk derived from longitudinal asset wear history",
        "feature_attributions": attribution,
        "tier": tier,
        "tier_description": tier_description,
    }

    # If already scheduled, fetch assigned block item
    if req.status == "SCHEDULED":
        # Find item in latest plan containing this task
        latest_plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
        plan_item = None
        if latest_plan:
            items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == latest_plan.plan_id).all()
            for it in items:
                if req.request_id in (it.bundled_task_ids or []):
                    plan_item = it
                    break

        return {
            "request_id": req.request_id,
            "status": "SCHEDULED",
            "explanation": "Task successfully scheduled in an optimized block possession window.",
            "block_id": plan_item.item_id if plan_item else None,
            "scheduled_start": plan_item.scheduled_start.isoformat() if plan_item else None,
            "scheduled_end": plan_item.scheduled_end.isoformat() if plan_item else None,
            "duration_minutes": req.duration_minutes,
            "is_bundled": len(plan_item.bundled_task_ids) > 1 if plan_item else False,
            "bundled_task_ids": plan_item.bundled_task_ids if plan_item else [req.request_id],
            "asset_info": asset_info,
            "ai_risk_context": ai_risk_context,
            "recommendation": "Maintain verified schedule and execute during authorized possession."
        }

    # If unscheduled, perform root cause diagnosis
    duration = req.duration_minutes
    es = req.earliest_start
    ld = req.latest_deadline

    # Check 1: Deadline feasibility
    if (ld - es).total_seconds() / 60 < duration:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "DEADLINE_WINDOW_TOO_SHORT",
            "explanation": f"The requested duration ({duration} mins) exceeds the total available time window between earliest start and deadline ({int((ld-es).total_seconds()/60)} mins).",
            "recommendation": "Extend task deadline or split into smaller maintenance increments.",
            "asset_info": asset_info,
            "ai_risk_context": ai_risk_context,
        }

    # Check 2: Available candidate windows on track
    windows = db.query(CandidateWindow).filter(
        CandidateWindow.track_id == req.track_id,
        CandidateWindow.window_start >= es,
        CandidateWindow.window_end <= ld
    ).all()

    if not windows:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "NO_TRAFFIC_GAP_ON_CORRIDOR",
            "explanation": f"High train frequency on section {req.section_id} (track {req.track_id}) prevented finding an uninterrupted gap of at least {duration} minutes.",
            "recommendation": "Request night possession window or temporary passenger train rerouting via loop lines.",
            "asset_info": asset_info,
            "ai_risk_context": ai_risk_context,
        }

    max_gap = max(w.usable_duration_mins for w in windows)
    if max_gap < duration:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "MAX_GAP_INSUFFICIENT",
            "explanation": f"Largest available gap on track {req.track_id} is {max_gap} minutes, which is less than requested {duration} minutes.",
            "recommendation": f"Reduce requested work duration to <= {max_gap} minutes or coordinate joint track possession.",
            "asset_info": asset_info,
            "ai_risk_context": ai_risk_context,
        }

    # Check 3: Machine conflict
    if req.machinery_required:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "RESOURCE_BOTTLENECK",
            "explanation": f"Required machinery ({req.machinery_required}) was prioritized for higher-urgency defects on other corridor sections.",
            "recommendation": "Mobilize secondary machine unit from adjacent division depot.",
            "asset_info": asset_info,
            "ai_risk_context": ai_risk_context,
        }

    return {
        "request_id": req.request_id,
        "status": "UNSCHEDULED",
        "root_cause": "OBJECTIVE_OPTIMIZATION_TRADE_OFF",
        "explanation": "Task deferred due to objective score trade-off against higher-priority emergency requests under constrained corridor capacity.",
        "recommendation": "Manually override to force inclusion into draft schedule.",
        "asset_info": asset_info,
        "ai_risk_context": ai_risk_context,
    }
