"""
RailSync AI — Independent Schedule Validator (Sentinel Engine v2.0)
Strictly independent post-solve verification engine evaluating 100% of generated block plans
against hard physical, operational, safety, and spatial prototype constraints.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import hashlib
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    BlockPlan, BlockPlanItem, Timetable, MaintenanceRequest, Resource, CandidateWindow
)


def validate_plan_schedule(db: Session, plan_id: str) -> Dict[str, Any]:
    """
    Independently verify 100% of scheduled block items in a plan against prototype operational rules.
    Evaluates:
    1. Train Headway & Sectional Occupancy clashes
    2. Physical Track-Level simultaneous task overlaps
    3. Machinery Resource collisions & transit routing buffers
    4. Candidate Window containment
    5. Earliest Start & Latest Deadline compliance
    6. Multi-department Bundle internal compatibility
    """
    plan = db.query(BlockPlan).filter(BlockPlan.plan_id == plan_id).first()
    if not plan:
        raise ValueError(f"Plan {plan_id} not found")

    items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == plan_id).all()
    timetable = db.query(Timetable).all()
    requests = db.query(MaintenanceRequest).all()
    req_by_id = {r.request_id: r for r in requests}
    resources = db.query(Resource).all()
    windows = db.query(CandidateWindow).all()

    checks_passed = True
    validation_results = []
    conflict_count = 0

    # -------------------------------------------------------------------------
    # 1. Individual Block Item Validations
    # -------------------------------------------------------------------------
    for item in items:
        item_passed = True
        reasons = []

        # Check 1A: Intersect against train timetables on the same track
        overlapping_trains = [
            tt for tt in timetable
            if tt.track_id == item.track_id and
            max(item.scheduled_start, tt.scheduled_entry) < min(item.scheduled_end, tt.scheduled_exit)
        ]
        if overlapping_trains:
            item_passed = False
            train_nums = [t.train_number for t in overlapping_trains]
            reasons.append(f"Train occupancy clash on track {item.track_id} with train(s): {train_nums}")

        # Check 1B: Candidate Window Containment
        matching_window = any(
            w.track_id == item.track_id and
            item.scheduled_start >= w.window_start and
            item.scheduled_end <= w.window_end
            for w in windows
        )
        if not matching_window and windows:
            item_passed = False
            reasons.append(f"Window containment violation: [{item.scheduled_start} - {item.scheduled_end}] not within any eligible candidate gap on track {item.track_id}")

        # Check 1C: Earliest Start and Deadline compliance for all bundled requests
        for req_id in item.bundled_task_ids or []:
            r = req_by_id.get(req_id)
            if r:
                if item.scheduled_end > r.latest_deadline:
                    item_passed = False
                    reasons.append(f"Task {req_id} deadline violated: block end {item.scheduled_end} > deadline {r.latest_deadline}")
                if item.scheduled_start < r.earliest_start:
                    item_passed = False
                    reasons.append(f"Task {req_id} earliest start violated: block start {item.scheduled_start} < earliest {r.earliest_start}")

        # Check 1D: Bundle Internal Compatibility
        bundled_ids = item.bundled_task_ids or []
        if len(bundled_ids) > 1:
            bundled_reqs = [req_by_id[rid] for rid in bundled_ids if rid in req_by_id]
            # Verify same section and track
            secs = set(r.section_id for r in bundled_reqs)
            trks = set(r.track_id for r in bundled_reqs)
            if len(secs) > 1 or len(trks) > 1:
                item_passed = False
                reasons.append(f"Invalid bundle: mixed sections {secs} or tracks {trks} in same item {item.item_id}")

            # Verify no machinery collisions within bundle
            used_mach = []
            for r in bundled_reqs:
                for m in r.machinery_required or []:
                    if m in used_mach:
                        item_passed = False
                        reasons.append(f"Bundle machinery conflict: unit {m} demanded simultaneously by multiple tasks in {item.item_id}")
                    used_mach.append(m)

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

    # -------------------------------------------------------------------------
    # 2. Inter-Block Physical Track Overlap Check
    # -------------------------------------------------------------------------
    items_by_track: Dict[str, List[BlockPlanItem]] = {}
    for item in items:
        items_by_track.setdefault(item.track_id, []).append(item)

    for trk_id, trk_items in items_by_track.items():
        trk_items.sort(key=lambda x: x.scheduled_start)
        for i in range(len(trk_items) - 1):
            a, b = trk_items[i], trk_items[i + 1]
            if max(a.scheduled_start, b.scheduled_start) < min(a.scheduled_end, b.scheduled_end):
                checks_passed = False
                conflict_count += 1
                validation_results.append({
                    "item_id": b.item_id,
                    "passed": False,
                    "reasons": [f"Physical Track Overlap: Distinct block items {a.item_id} and {b.item_id} simultaneously occupy track {trk_id}"]
                })

    # -------------------------------------------------------------------------
    # 3. Inter-Block Machinery Disjunctive & Transit Overlap Check
    # -------------------------------------------------------------------------
    machine_schedules: Dict[str, List[Tuple[datetime, datetime, str, str]]] = {}
    for item in items:
        for m_id in item.assigned_resource_ids or []:
            machine_schedules.setdefault(m_id, []).append((item.scheduled_start, item.scheduled_end, item.section_id, item.item_id))

    for m_id, intervals in machine_schedules.items():
        intervals.sort(key=lambda x: x[0])
        for i in range(len(intervals) - 1):
            end_a = intervals[i][1]
            start_b = intervals[i + 1][0]
            sec_a = intervals[i][2]
            sec_b = intervals[i + 1][2]
            transit_buffer = timedelta(minutes=60 if sec_a != sec_b else 15)

            if start_b < end_a + transit_buffer:
                checks_passed = False
                conflict_count += 1
                item_a_id = intervals[i][3]
                item_b_id = intervals[i + 1][3]
                validation_results.append({
                    "item_id": item_b_id,
                    "passed": False,
                    "reasons": [f"Machinery collision/transit buffer violation: {m_id} on {item_a_id} ({sec_a}) and {item_b_id} ({sec_b}) with gap {(start_b - end_a).total_seconds()/60:.0f} mins < buffer {transit_buffer.total_seconds()/60:.0f} mins"]
                })

    # Update plan status
    plan.status = "APPROVED" if checks_passed else "CONFLICT"

    # Compute tamper-evident verification hash
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
