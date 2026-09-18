"""
RailSync AI — Deterministic Greedy Baseline Scheduler
Provides a transparent, non-CP-SAT greedy scheduling baseline for decision-quality benchmarking.
Algorithm:
1. Sort maintenance requests by priority score (descending), deadline (ascending), and duration.
2. For each request, scan eligible candidate windows chronologically on its physical track.
3. Check track occupancy and machinery conflicts with previously scheduled tasks.
4. Schedule at earliest feasible gap or mark unscheduled.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    MaintenanceRequest, CandidateWindow, Resource
)


def run_greedy_baseline_scheduler(db: Session) -> Dict[str, Any]:
    """
    Execute transparent deterministic greedy scheduling baseline.
    Returns metrics and scheduled item assignments.
    """
    requests = db.query(MaintenanceRequest).all()
    windows = db.query(CandidateWindow).all()
    resources = db.query(Resource).all()

    start_time = datetime.now()

    if not requests:
        return {
            "scheduler_name": "DeterministicGreedyBaseline",
            "runtime_seconds": 0.0,
            "scheduled_tasks": 0,
            "unscheduled_tasks": 0,
            "objective_breakdown": {}
        }

    # Group candidate windows by track_id and sort chronologically
    windows_by_track: Dict[str, List[CandidateWindow]] = {}
    for w in windows:
        windows_by_track.setdefault(w.track_id, []).append(w)
    for track_id in windows_by_track:
        windows_by_track[track_id].sort(key=lambda x: x.window_start)

    # Sort requests deterministically:
    # 1. Priority score (descending)
    # 2. Latest deadline (ascending)
    # 3. Duration (ascending)
    sorted_requests = sorted(
        requests,
        key=lambda r: (
            -(r.ai_priority_score or 50.0),
            r.latest_deadline,
            r.duration_minutes
        )
    )

    scheduled_items = []
    scheduled_tasks = set()
    track_occupancies: Dict[str, List[Tuple[datetime, datetime]]] = {}
    machine_occupancies: Dict[str, List[Tuple[datetime, datetime, str]]] = {}

    for req in sorted_requests:
        dur = timedelta(minutes=req.duration_minutes)
        track_id = req.track_id
        sec_id = req.section_id
        cand_wins = windows_by_track.get(track_id, [])

        assigned = False

        for win in cand_wins:
            # Check window containment with earliest start and deadline
            slot_earliest = max(win.window_start, req.earliest_start)
            slot_latest = min(win.window_end, req.latest_deadline)

            if slot_latest - slot_earliest < dur:
                continue

            # Find earliest conflict-free sub-interval in this window
            cur_start = slot_earliest
            while cur_start + dur <= slot_latest:
                cur_end = cur_start + dur

                # Check 1: Track collision with other scheduled tasks
                has_track_collision = False
                for t_s, t_e in track_occupancies.get(track_id, []):
                    if max(cur_start, t_s) < min(cur_end, t_e):
                        has_track_collision = True
                        cur_start = t_e
                        break

                if has_track_collision:
                    continue

                # Check 2: Machinery resource collision
                has_machine_collision = False
                for mach in req.machinery_required or []:
                    for m_s, m_e, m_sec in machine_occupancies.get(mach, []):
                        transit = timedelta(minutes=60 if m_sec != sec_id else 15)
                        buffered_s = m_s - transit
                        buffered_e = m_e + transit
                        if max(cur_start, buffered_s) < min(cur_end, buffered_e):
                            has_machine_collision = True
                            cur_start = m_e + transit
                            break
                    if has_machine_collision:
                        break

                if has_machine_collision:
                    continue

                # Feasible slot found!
                scheduled_items.append({
                    "request_id": req.request_id,
                    "section_id": sec_id,
                    "track_id": track_id,
                    "scheduled_start": cur_start,
                    "scheduled_end": cur_end,
                    "duration_minutes": req.duration_minutes,
                    "machinery": req.machinery_required or [],
                })
                scheduled_tasks.add(req.request_id)
                track_occupancies.setdefault(track_id, []).append((cur_start, cur_end))
                for mach in req.machinery_required or []:
                    machine_occupancies.setdefault(mach, []).append((cur_start, cur_end, sec_id))
                assigned = True
                break

            if assigned:
                break

    duration_s = (datetime.now() - start_time).total_seconds()

    # Calculate metrics
    scheduled_count = len(scheduled_tasks)
    unscheduled_count = len(requests) - scheduled_count
    emergency_count = sum(1 for r in requests if r.request_id in scheduled_tasks and r.severity == "EMERGENCY")
    critical_count = sum(1 for r in requests if r.request_id in scheduled_tasks and r.severity == "CRITICAL")
    total_maint_mins = sum(r.duration_minutes for r in requests if r.request_id in scheduled_tasks)
    weighted_prio = sum(r.ai_priority_score or 50.0 for r in requests if r.request_id in scheduled_tasks)
    weighted_risk = sum(r.ai_risk_score or 0.2 for r in requests if r.request_id in scheduled_tasks)

    objective_breakdown = {
        "total_scheduled_tasks": scheduled_count,
        "total_unscheduled_tasks": unscheduled_count,
        "scheduled_emergency_tasks": emergency_count,
        "scheduled_critical_tasks": critical_count,
        "total_maintenance_hours": round(total_maint_mins / 60.0, 1),
        "total_block_hours": round(total_maint_mins / 60.0, 1),  # Baseline has 0 bundling
        "block_possession_saved_hours": 0.0,
        "block_utilization_pct": 100.0 if scheduled_count > 0 else 0.0,
        "active_bundles_count": 0,
        "cross_department_bundles_count": 0,
        "weighted_priority_captured": round(weighted_prio, 1),
        "weighted_risk_captured": round(weighted_risk, 2),
        "solver_runtime_s": round(duration_s, 4),
    }

    return {
        "scheduler_name": "DeterministicGreedyBaseline",
        "runtime_seconds": round(duration_s, 4),
        "scheduled_tasks": scheduled_count,
        "unscheduled_tasks": unscheduled_count,
        "scheduled_items": scheduled_items,
        "objective_breakdown": objective_breakdown,
    }
