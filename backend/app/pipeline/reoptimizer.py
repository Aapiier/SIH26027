"""
RailSync AI — Event-Driven Disruption Reoptimization Engine
Dynamically adjusts schedules when train delays or emergency defects occur, preserving unaffected blocks.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    BlockPlan, BlockPlanItem, Timetable, MaintenanceRequest
)
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.services.audit_service import log_audit_action


def handle_train_delay_disruption(
    db: Session,
    train_number: str,
    section_id: str,
    delay_minutes: int,
    actor: str = "CONTROLLER"
) -> Dict[str, Any]:
    """
    Handle live train delay: shift train timetable, identify collided blocks, reoptimize affected scope.
    """
    # 1. Update train timetable
    tt_entries = db.query(Timetable).filter(
        Timetable.train_number == train_number,
        Timetable.section_id == section_id
    ).all()

    if not tt_entries:
        return {"error": f"No timetable entries found for Train {train_number} on {section_id}"}

    for tt in tt_entries:
        tt.scheduled_entry += timedelta(minutes=delay_minutes)
        tt.scheduled_exit += timedelta(minutes=delay_minutes)

    db.commit()

    # 2. Invalidate collided block plan items
    latest_plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
    collided_items = []
    
    if latest_plan:
        items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == latest_plan.plan_id).all()
        for item in items:
            for tt in tt_entries:
                if item.track_id == tt.track_id:
                    if max(item.scheduled_start, tt.scheduled_entry) < min(item.scheduled_end, tt.scheduled_exit):
                        item.validation_status = "CONFLICT"
                        item.conflict_reason = f"Train {train_number} delayed by {delay_minutes}m collides with scheduled block"
                        collided_items.append(item.item_id)
                        
                        # Reset bundled tasks to PENDING
                        for req_id in item.bundled_task_ids or []:
                            req = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == req_id).first()
                            if req:
                                req.status = "PENDING"
        db.commit()

    # 3. Regenerate candidate windows & re-solve
    extract_candidate_windows(db)
    new_plan_result = solve_maintenance_schedule(db, horizon="WEEKLY_REOPTIMIZED")

    # 4. Independent validation
    validation_verdict = validate_plan_schedule(db, new_plan_result["plan_id"])

    # 5. Cryptographic audit log
    log_audit_action(
        db=db,
        action="DISRUPTION_REOPTIMIZE_TRAIN_DELAY",
        actor=actor,
        plan_id=new_plan_result["plan_id"],
        new_state={
            "delayed_train": train_number,
            "delay_mins": delay_minutes,
            "collided_items": collided_items,
            "new_plan_id": new_plan_result["plan_id"],
        },
        justification=f"Reoptimized schedule following {delay_minutes}m delay of Train {train_number} on {section_id}"
    )

    return {
        "status": "REOPTIMIZATION_COMPLETE",
        "affected_items_count": len(collided_items),
        "new_plan_id": new_plan_result["plan_id"],
        "validation_verdict": validation_verdict["overall_verdict"],
    }
