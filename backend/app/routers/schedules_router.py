"""
RailSync AI — Schedules, Validation & Human Overrides Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.db_models import BlockPlan, BlockPlanItem
from backend.app.schemas.schemas import BlockPlanSchema, BlockPlanItemSchema, ManualOverrideRequest
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/api/v1/schedules", tags=["Schedules & Overrides"])


@router.get("", response_model=List[BlockPlanSchema])
def list_plans(db: Session = Depends(get_db)):
    """List all generated block plan versions."""
    return db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).all()


@router.get("/latest", response_model=BlockPlanSchema)
def get_latest_plan(db: Session = Depends(get_db)):
    """Retrieve latest block schedule with items."""
    plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No schedules available")
    return plan


@router.get("/{plan_id}", response_model=BlockPlanSchema)
def get_plan_by_id(plan_id: str, db: Session = Depends(get_db)):
    """Retrieve specific block schedule plan by ID."""
    plan = db.query(BlockPlan).filter(BlockPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/{plan_id}/validate")
def validate_schedule(plan_id: str, db: Session = Depends(get_db)):
    """Run independent Sentinel validation on a block schedule."""
    try:
        verdict = validate_plan_schedule(db, plan_id)
        return {"status": "SUCCESS", "validation_verdict": verdict}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/override")
def apply_manual_override(req: ManualOverrideRequest, db: Session = Depends(get_db)):
    """
    Apply human controller manual override to shift a scheduled block slot.
    """
    item = db.query(BlockPlanItem).filter(
        BlockPlanItem.item_id == req.item_id,
        BlockPlanItem.plan_id == req.plan_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Block plan item not found")

    prev_state = {
        "scheduled_start": item.scheduled_start.isoformat(),
        "scheduled_end": item.scheduled_end.isoformat(),
    }

    item.scheduled_start = req.new_start
    item.scheduled_end = req.new_end
    item.duration_minutes = int((req.new_end - req.new_start).total_seconds() // 60)
    db.commit()

    # Re-validate after override
    val_verdict = validate_plan_schedule(db, req.plan_id)

    # Log to audit trail
    log_audit_action(
        db=db,
        action="MANUAL_OVERRIDE",
        actor=req.actor,
        plan_id=req.plan_id,
        previous_state=prev_state,
        new_state={
            "item_id": req.item_id,
            "new_start": req.new_start.isoformat(),
            "new_end": req.new_end.isoformat(),
            "validation_verdict": val_verdict["overall_verdict"],
        },
        justification=req.justification
    )

    return {
        "status": "OVERRIDE_APPLIED",
        "validation_verdict": val_verdict["overall_verdict"],
        "conflicts": val_verdict["conflicts_detected"],
    }


@router.post("/{plan_id}/approve")
def approve_plan(plan_id: str, actor: str = Query("CHIEF_CONTROLLER"), db: Session = Depends(get_db)):
    """Approve a validated block schedule."""
    plan = db.query(BlockPlan).filter(BlockPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan.status = "APPROVED"
    db.commit()

    log_audit_action(
        db=db,
        action="APPROVE_PLAN",
        actor=actor,
        plan_id=plan_id,
        justification="Plan approved for operations by Chief Controller"
    )
    return {"status": "SUCCESS", "plan_id": plan_id, "new_status": "APPROVED"}


@router.post("/{plan_id}/publish")
def publish_plan(plan_id: str, actor: str = Query("CHIEF_CONTROLLER"), db: Session = Depends(get_db)):
    """Publish an approved block schedule to sectional controllers."""
    plan = db.query(BlockPlan).filter(BlockPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan.status = "PUBLISHED"
    db.commit()

    log_audit_action(
        db=db,
        action="PUBLISH_PLAN",
        actor=actor,
        plan_id=plan_id,
        justification="Schedule published to live sectional controllers"
    )
    return {"status": "SUCCESS", "plan_id": plan_id, "new_status": "PUBLISHED"}
