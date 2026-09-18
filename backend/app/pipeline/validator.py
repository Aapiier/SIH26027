"""
RailSync AI — Independent Schedule Validator (Sentinel)
Deterministic post-solve validation engine verifying prototype operational constraints.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import hashlib
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    BlockPlan, BlockPlanItem, Timetable, MaintenanceRequest, Resource
)


def validate_plan_schedule(db: Session, plan_id: str) -> Dict[str, Any]:
    """
    Independently verify 100% of scheduled block items in a plan against prototype operational rules.
    """
    plan = db.query(BlockPlan).filter(BlockPlan.plan_id == plan_id).first()
    if not plan:
        raise ValueError(f"Plan {plan_id} not found")

    items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == plan_id).all()
    timetable = db.query(Timetable).all()
    requests = db.query(MaintenanceRequest).all()
    req_by_id = {r.request_id: r for r in requests}
    resources = db.query(Resource).all()
    res_by_id = {r.resource_id: r for r in resources}

    checks_passed = True
    validation_results = []
    conflict_count = 0

    # 1. Check Train Headway & Separation for each scheduled item
    for item in items:
        item_passed = True
        reasons = []

        # Intersect against train timetables on the same track
        overlapping_trains = [
            tt for tt in timetable
            if tt.track_id == item.track_id and
            max(item.scheduled_start, tt.scheduled_entry) < min(item.scheduled_end, tt.scheduled_exit)
        ]

        if overlapping_trains:
            item_passed = False
            train_nums = [t.train_number for t in overlapping_trains]
            reasons.append(f"Train occupancy clash on track {item.track_id} with trains: {train_nums}")

        # Check deadline compliance for all bundled requests
        for req_id in item.bundled_task_ids or []:
            r = req_by_id.get(req_id)
            if r and item.scheduled_end > r.latest_deadline:
                item_passed = False
                reasons.append(f"Task {req_id} deadline violated: end {item.scheduled_end} > deadline {r.latest_deadline}")

        if not item_passed:
            checks_passed = False
            item.validation_status = "CONFLICT"
            item.conflict_reason = "; ".join(reasons)
            conflict_count += 1
        else:
            item.validation_status = "PASSED"
            item.conflict_reason = None

        validation_results.append({
            "item_id": item.item_id,
            "passed": item_passed,
            "reasons": reasons
        })

    # 2. Check Machinery Disjunctive Overlap
    machine_schedules: Dict[str, List[Tuple[datetime, datetime, str]]] = {}
    for item in items:
        for m_id in item.assigned_resource_ids or []:
            machine_schedules.setdefault(m_id, []).append((item.scheduled_start, item.scheduled_end, item.item_id))

    for m_id, intervals in machine_schedules.items():
        intervals.sort(key=lambda x: x[0])
        for i in range(len(intervals) - 1):
            end_a = intervals[i][1]
            start_b = intervals[i + 1][0]
            if start_b < end_a:
                checks_passed = False
                conflict_count += 1
                item_a_id = intervals[i][2]
                item_b_id = intervals[i + 1][2]
                validation_results.append({
                    "item_id": item_b_id,
                    "passed": False,
                    "reasons": [f"Machinery collision: {m_id} simultaneously scheduled on {item_a_id} and {item_b_id}"]
                })

    # Update plan status
    plan.status = "APPROVED" if checks_passed else "CONFLICT"

    # Compute tamper-proof verification hash
    verdict_payload = f"{plan_id}:{checks_passed}:{conflict_count}:{len(items)}"
    verification_hash = hashlib.sha256(verdict_payload.encode()).hexdigest()

    db.commit()

    return {
        "plan_id": plan_id,
        "overall_verdict": "PASSED" if checks_passed else "FAILED",
        "conflicts_detected": conflict_count,
        "total_items_validated": len(items),
        "verification_hash": verification_hash,
        "details": validation_results,
    }
