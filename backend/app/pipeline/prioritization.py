"""
RailSync AI — Two-Tier Priority & Intelligence Engine (v2.0)
Combines Deterministic G&SR Safety Rules (Tier 1) with Pre-Trained ML Failure Risk Predictions (Tier 2).
"""

from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.app.models.db_models import MaintenanceRequest, Asset
from backend.app.pipeline.ml_model import DefectRiskPredictor

# Global singleton predictor instance loading persisted .joblib artifact
_predictor = DefectRiskPredictor()


def run_prioritization_pipeline(db: Session) -> List[Dict[str, Any]]:
    """
    Execute two-tier prioritization on all PENDING maintenance requests in the database.
    """
    requests = db.query(MaintenanceRequest).all()
    assets = db.query(Asset).all()
    assets_by_id = {a.asset_id: a.__dict__ for a in assets}

    results = []

    for req in requests:
        ast_dict = assets_by_id.get(req.asset_id, {})
        req_dict = {
            "request_id": req.request_id,
            "department": req.department,
            "severity": req.severity,
            "defect_type": req.defect_type,
            "duration_minutes": req.duration_minutes,
            "earliest_start": req.earliest_start,
            "latest_deadline": req.latest_deadline,
            "speed_restriction_kmph": req.speed_restriction_kmph,
            "machinery_required": req.machinery_required,
            "power_block_required": req.power_block_required,
        }

        # ---------------------------------------------------------------------
        # Tier 1: Deterministic Hard Safety Gates (G&SR Safety Rules)
        # ---------------------------------------------------------------------
        is_emergency = (
            req.severity == "EMERGENCY" or 
            req.defect_type in ("RAIL_FRACTURE_RISK", "POINT_MACHINE_DETECTION_FAILURE", "OHE_CANTILEVER_FLASH_BURN")
        )
        is_critical = (
            req.severity == "CRITICAL" or 
            req.defect_type in ("IMR_ULTRASONIC_FLAW", "CONTACT_WIRE_PARTING_RISK", "TRACK_CIRCUIT_INTERMITTENT_DROP")
        )

        ml_risk, attribution = _predictor.predict_risk(req_dict, ast_dict)

        if is_emergency:
            # Deterministic override for emergencies (ML does not downgrade safety)
            priority_score = 98.0
            urgency_level = "CRITICAL_EMERGENCY"
        elif is_critical:
            # Tier 1.5: Critical defects scaled by ML risk [80.0 to 95.0]
            priority_score = round(max(80.0, 75.0 + (ml_risk * 20.0)), 1)
            urgency_level = "HIGH_PRIORITY"
        else:
            # Tier 2: ML-Weighted Priority Score (0 to 75.0)
            priority_score = round(ml_risk * 75.0, 1)
            urgency_level = "MEDIUM_PRIORITY" if priority_score >= 45.0 else "ROUTINE_SCHEDULE"

        # Update DB entity
        req.ai_priority_score = priority_score
        req.ai_risk_score = ml_risk
        req.ai_urgency_level = urgency_level

        results.append({
            "request_id": req.request_id,
            "department": req.department,
            "defect_type": req.defect_type,
            "severity": req.severity,
            "ai_priority_score": priority_score,
            "ai_risk_score": ml_risk,
            "ai_urgency_level": urgency_level,
            "feature_attribution": attribution,
            "model_version": _predictor.version,
        })

    db.commit()
    return results
