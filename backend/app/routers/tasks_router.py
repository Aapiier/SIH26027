"""
RailSync AI — Maintenance Tasks & Prioritization Router
"""

import uuid
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import MaintenanceRequest, Asset, TrackSection, Track, AuditLog
from backend.app.schemas.schemas import MaintenanceRequestSchema, MaintenanceRequestCreateSchema
from backend.app.pipeline.prioritization import run_prioritization_pipeline, _predictor
from backend.app.services.explanation_service import explain_unscheduled_task

router = APIRouter(prefix="/api/v1/tasks", tags=["Maintenance Tasks"])


@router.get("", response_model=List[MaintenanceRequestSchema])
def list_tasks(
    department: Optional[str] = Query(None, description="Filter by department"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """List all maintenance requests with optional filtering."""
    query = db.query(MaintenanceRequest)
    if department:
        query = query.filter(MaintenanceRequest.department == department)
    if severity:
        query = query.filter(MaintenanceRequest.severity == severity)
    if status:
        query = query.filter(MaintenanceRequest.status == status)
    return query.all()


@router.post("", response_model=MaintenanceRequestSchema, status_code=201)
def create_task(payload: MaintenanceRequestCreateSchema, db: Session = Depends(get_db)):
    """
    Manually inject a new maintenance request / defect into the system during live simulation.
    Automatically runs AI ML Risk assessment and G&SR safety prioritization, creates DB entities,
    and logs the action to the audit trail.
    """
    if payload.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="duration_minutes must be greater than 0")
    if payload.latest_deadline < payload.earliest_start:
        raise HTTPException(status_code=400, detail="latest_deadline cannot be earlier than earliest_start")

    # Verify section exists
    section = db.query(TrackSection).filter(TrackSection.section_id == payload.section_id).first()
    if not section:
        raise HTTPException(status_code=400, detail=f"Track section {payload.section_id} not found")

    # Find matching track on section
    track = db.query(Track).filter(Track.track_id == payload.track_id).first()
    if not track:
        # Try common suffix aliases like -DOWN -> -DN, -UP -> -UP-FAST, etc.
        alt_id = payload.track_id.replace("-DOWN", "-DN").replace("-DN", "-DOWN")
        track = db.query(Track).filter(Track.track_id == alt_id).first()
        if not track:
            # Fallback to any track matching section and direction
            dir_filter = "DOWN" if ("DN" in payload.track_id.upper() or "DOWN" in payload.track_id.upper()) else "UP"
            track = db.query(Track).filter(Track.section_id == payload.section_id, Track.direction == dir_filter).first()
            if not track:
                track = db.query(Track).filter(Track.section_id == payload.section_id).first()
            if not track:
                raise HTTPException(status_code=400, detail=f"Track {payload.track_id} not found in section {payload.section_id}")
        payload.track_id = track.track_id

    # Verify or create linked asset
    asset_id = payload.asset_id
    asset_obj = None
    if asset_id:
        asset_obj = db.query(Asset).filter(Asset.asset_id == asset_id).first()

    if not asset_obj:
        # Check if an existing asset exists on this track/department
        asset_obj = db.query(Asset).filter(
            Asset.section_id == payload.section_id,
            Asset.track_id == payload.track_id,
            Asset.department == payload.department
        ).first()

        if not asset_obj:
            # Create a synthetic asset entity to ensure relational and ML feature consistency
            category_map = {
                "ENGINEERING": "TRACK",
                "SIGNAL_TELECOM": "SIGNAL",
                "TRD": "OHE"
            }
            asset_id = f"AST-SIM-{uuid.uuid4().hex[:6].upper()}"
            asset_obj = Asset(
                asset_id=asset_id,
                asset_name=f"Simulated {payload.department} Asset {payload.start_km:.1f}km",
                category=category_map.get(payload.department, "TRACK"),
                department=payload.department,
                section_id=payload.section_id,
                track_id=payload.track_id,
                start_km=payload.start_km,
                end_km=payload.end_km,
                criticality_weight=4 if payload.severity in ("EMERGENCY", "CRITICAL") else 3,
                health_index=45.0 if payload.severity in ("EMERGENCY", "CRITICAL") else 75.0,
                last_inspected_days_ago=30 if payload.severity in ("EMERGENCY", "CRITICAL") else 10
            )
            db.add(asset_obj)
            db.flush()
        else:
            asset_id = asset_obj.asset_id

    req_id = f"REQ-SIM-{uuid.uuid4().hex[:6].upper()}"

    # Prepare ML inference dictionaries
    ast_dict = {
        "asset_id": asset_obj.asset_id,
        "category": asset_obj.category,
        "department": asset_obj.department,
        "criticality_weight": asset_obj.criticality_weight,
        "health_index": asset_obj.health_index,
        "last_inspected_days_ago": asset_obj.last_inspected_days_ago,
    }

    req_dict = {
        "request_id": req_id,
        "department": payload.department,
        "severity": payload.severity,
        "defect_type": payload.defect_type,
        "duration_minutes": payload.duration_minutes,
        "earliest_start": payload.earliest_start,
        "latest_deadline": payload.latest_deadline,
        "speed_restriction_kmph": payload.speed_restriction_kmph or 0,
        "machinery_required": payload.machinery_required or [],
        "power_block_required": payload.power_block_required or False,
    }

    # Run AI Risk Prediction
    ml_risk, attribution = _predictor.predict_risk(req_dict, ast_dict)

    # Determine Priority Score & Urgency Level via Tier 1 + Tier 2
    is_emergency = (
        payload.severity == "EMERGENCY" or 
        payload.defect_type in ("RAIL_FRACTURE_RISK", "POINT_MACHINE_DETECTION_FAILURE", "OHE_CANTILEVER_FLASH_BURN")
    )
    is_critical = (
        payload.severity == "CRITICAL" or 
        payload.defect_type in ("IMR_ULTRASONIC_FLAW", "CONTACT_WIRE_PARTING_RISK", "TRACK_CIRCUIT_INTERMITTENT_DROP")
    )

    if is_emergency:
        priority_score = 98.0
        urgency_level = "CRITICAL_EMERGENCY"
    elif is_critical:
        priority_score = round(max(80.0, 75.0 + (ml_risk * 20.0)), 1)
        urgency_level = "HIGH_PRIORITY"
    else:
        priority_score = round(ml_risk * 75.0, 1)
        urgency_level = "MEDIUM_PRIORITY" if priority_score >= 45.0 else "ROUTINE_SCHEDULE"

    new_task = MaintenanceRequest(
        request_id=req_id,
        department=payload.department,
        source_system=payload.source_system or "MANUAL_SIM",
        asset_id=asset_id,
        section_id=payload.section_id,
        track_id=payload.track_id,
        start_km=payload.start_km,
        end_km=payload.end_km,
        defect_type=payload.defect_type,
        severity=payload.severity,
        duration_minutes=payload.duration_minutes,
        earliest_start=payload.earliest_start,
        latest_deadline=payload.latest_deadline,
        speed_restriction_kmph=payload.speed_restriction_kmph or 0,
        machinery_required=payload.machinery_required or [],
        power_block_required=payload.power_block_required or False,
        elementary_section_id=payload.elementary_section_id,
        status="PENDING",
        scenario_tag=payload.scenario_tag or "MANUAL_SIMULATION",
        ai_priority_score=priority_score,
        ai_risk_score=ml_risk,
        ai_urgency_level=urgency_level,
        unscheduled_reason=None
    )
    db.add(new_task)

    # Cryptographic Audit Log
    h = hashlib.sha256(f"MANUAL_TASK_{req_id}_{payload.defect_type}".encode()).hexdigest()
    audit = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        action="MANUAL_TASK_CREATED",
        actor=payload.actor or "DEMO_OPERATOR",
        plan_id=None,
        justification=f"Manual maintenance request {req_id} ({payload.defect_type}, {payload.severity}) created via live simulation interface.",
        content_hash=h,
        new_state={
            "request_id": req_id,
            "department": payload.department,
            "defect_type": payload.defect_type,
            "severity": payload.severity,
            "duration_minutes": payload.duration_minutes,
            "ai_risk_score": ml_risk,
            "ai_priority_score": priority_score,
            "ai_urgency_level": urgency_level
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/{request_id}", response_model=MaintenanceRequestSchema)
def get_task(request_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single maintenance request."""
    req = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Task not found")
    return req


@router.post("/prioritize")
def run_prioritization(db: Session = Depends(get_db)):
    """Trigger two-tier AI & deterministic prioritization engine."""
    results = run_prioritization_pipeline(db)
    return {"status": "SUCCESS", "prioritized_count": len(results), "tasks": results}


@router.get("/{request_id}/explain")
def explain_task(request_id: str, db: Session = Depends(get_db)):
    """Get diagnostic feasibility explanation for an unscheduled maintenance task."""
    explanation = explain_unscheduled_task(db, request_id)
    return explanation
