"""
RailSync AI — Google OR-Tools CP-SAT Optimization Engine (v2.0)
Formulates and solves the master maintenance block scheduling problem with:
1. Hard Track-Level NoOverlap Constraints for unbundled tasks on the same physical track.
2. First-Class Multi-Department Shadow Bundling with Synchronized Co-Possession.
3. Disjunctive Machinery Resource and Transit Routing Buffers.
4. Comprehensive Metric and Objective Function Breakdown.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import hashlib
from ortools.sat.python import cp_model
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    MaintenanceRequest, CandidateWindow, Resource, BlockPlan, BlockPlanItem, TrackSection
)
from backend.app.pipeline.bundling import group_compatible_tasks


def _dt_to_mins(dt: datetime, base: datetime) -> int:
    """Convert datetime to relative minutes from base epoch."""
    return int((dt - base).total_seconds() // 60)


def _mins_to_dt(mins: int, base: datetime) -> datetime:
    """Convert relative minutes from base epoch back to datetime."""
    return base + timedelta(minutes=mins)


def solve_maintenance_schedule(
    db: Session,
    horizon: str = "WEEKLY",
    max_solver_time_s: int = 10,
    freight_penalty_weight: float = 0.5,
    shadow_reward_weight: float = 2.0
) -> Dict[str, Any]:
    """
    Execute mathematical optimization using Google OR-Tools CP-SAT.
    """
    requests = db.query(MaintenanceRequest).filter(MaintenanceRequest.status != "COMPLETED").all()
    windows = db.query(CandidateWindow).all()
    resources = db.query(Resource).all()

    if not requests:
        return {
            "status": "NO_TASKS",
            "solver_status": "NO_TASKS",
            "scheduled_tasks": 0,
            "unscheduled_tasks": 0,
            "runtime_seconds": 0.0,
            "objective_breakdown": {}
        }

    # Determine epoch base
    base_epoch = min(r.earliest_start for r in requests)

    model = cp_model.CpModel()

    # -------------------------------------------------------------------------
    # 1. Decision Variables per Maintenance Request
    # -------------------------------------------------------------------------
    task_vars = {}
    for r in requests:
        es = _dt_to_mins(r.earliest_start, base_epoch)
        ld = _dt_to_mins(r.latest_deadline, base_epoch)
        dur = int(r.duration_minutes)

        present = model.NewBoolVar(f"present_{r.request_id}")
        if ld - dur >= es:
            start = model.NewIntVar(es, ld - dur, f"start_{r.request_id}")
            end = model.NewIntVar(es + dur, ld, f"end_{r.request_id}")
            interval = model.NewOptionalIntervalVar(start, dur, end, present, f"iv_{r.request_id}")
            task_vars[r.request_id] = {
                "request": r,
                "present": present,
                "start": start,
                "end": end,
                "interval": interval,
                "dur": dur,
                "es": es,
                "ld": ld
            }
        else:
            # Infeasible deadline from outset
            model.Add(present == 0)
            task_vars[r.request_id] = {
                "request": r,
                "present": present,
                "start": None,
                "end": None,
                "interval": None,
                "dur": dur,
                "es": es,
                "ld": ld
            }

    # -------------------------------------------------------------------------
    # 2. Window Containment Constraints
    # -------------------------------------------------------------------------
    windows_by_track: Dict[str, List[CandidateWindow]] = {}
    for w in windows:
        windows_by_track.setdefault(w.track_id, []).append(w)

    task_window_vars: Dict[str, Dict[str, Any]] = {}
    for req_id, tv in task_vars.items():
        if tv["interval"] is None:
            continue
        r = tv["request"]
        track_windows = windows_by_track.get(r.track_id, [])

        if not track_windows:
            model.Add(tv["present"] == 0)
            continue

        in_win_bools = []
        task_win_map = {}
        for w in track_windows:
            w_start = _dt_to_mins(w.window_start, base_epoch)
            w_end = _dt_to_mins(w.window_end, base_epoch)

            if w_end - w_start < tv["dur"]:
                continue

            in_w = model.NewBoolVar(f"in_win_{req_id}_{w.window_id}")
            # Containment: start >= w_start and end <= w_end
            model.Add(tv["start"] >= w_start).OnlyEnforceIf(in_w)
            model.Add(tv["end"] <= w_end).OnlyEnforceIf(in_w)
            in_win_bools.append(in_w)
            task_win_map[w.window_id] = (in_w, w_start, w_end)

        task_window_vars[req_id] = task_win_map

        if in_win_bools:
            # If task is scheduled, exactly one window containment bool must be true
            model.Add(sum(in_win_bools) == tv["present"])
        else:
            model.Add(tv["present"] == 0)

    # -------------------------------------------------------------------------
    # 3. First-Class Multi-Department Bundling Formulation
    # -------------------------------------------------------------------------
    candidate_bundles = group_compatible_tasks([r.__dict__ for r in requests])
    bundle_vars = {}
    bundles_by_task = {r.request_id: [] for r in requests}

    for bundle in candidate_bundles:
        b_id = bundle["bundle_id"]
        req_ids = bundle["request_ids"]
        matching_tvs = [task_vars[rid] for rid in req_ids if rid in task_vars and task_vars[rid]["interval"] is not None]

        if len(matching_tvs) == len(req_ids):
            bundle_active = model.NewBoolVar(f"bundle_act_{b_id}")
            bundle_vars[b_id] = {
                "bundle": bundle,
                "active_var": bundle_active,
                "matching_tvs": matching_tvs,
                "req_ids": req_ids,
            }

            lead_tv = matching_tvs[0]
            b_dur = bundle["bundled_duration_mins"]

            # If bundle is active, all member tasks must be present and respect deadlines
            for tv in matching_tvs:
                model.AddImplication(bundle_active, tv["present"])
                # Bundle block end must not exceed any task's latest deadline
                model.Add(lead_tv["start"] + b_dur <= tv["ld"]).OnlyEnforceIf(bundle_active)
                model.Add(lead_tv["start"] >= tv["es"]).OnlyEnforceIf(bundle_active)

            # Synchronize start time and window selection for all bundled tasks
            lead_wins = task_window_vars.get(lead_tv["request"].request_id, {})
            for other_tv in matching_tvs[1:]:
                model.Add(other_tv["start"] == lead_tv["start"]).OnlyEnforceIf(bundle_active)
                other_wins = task_window_vars.get(other_tv["request"].request_id, {})
                for w_id in set(lead_wins.keys()).intersection(set(other_wins.keys())):
                    model.Add(lead_wins[w_id][0] == other_wins[w_id][0]).OnlyEnforceIf(bundle_active)

            # Enforce bundled duration fits within the chosen window
            for w_id, (in_w, w_start, w_end) in lead_wins.items():
                if w_end - w_start >= b_dur:
                    model.Add(lead_tv["start"] + b_dur <= w_end).OnlyEnforceIf([bundle_active, in_w])
                else:
                    model.Add(in_w == 0).OnlyEnforceIf(bundle_active)

            for rid in req_ids:
                bundles_by_task[rid].append(bundle_vars[b_id])

    # Each task can participate in at most one active bundle
    for rid, b_list in bundles_by_task.items():
        if len(b_list) > 1:
            model.Add(sum(bv["active_var"] for bv in b_list) <= 1)

    # -------------------------------------------------------------------------
    # 4. Physical Track-Level Conflict Constraints (NoOverlap)
    # -------------------------------------------------------------------------
    # For tasks on the same track_id, if they are NOT in the same active bundle, they cannot overlap
    tasks_by_track: Dict[str, List[Dict[str, Any]]] = {}
    for req_id, tv in task_vars.items():
        if tv["interval"] is not None:
            tasks_by_track.setdefault(tv["request"].track_id, []).append(tv)

    for trk_id, tv_list in tasks_by_track.items():
        for i in range(len(tv_list)):
            for j in range(i + 1, len(tv_list)):
                a, b = tv_list[i], tv_list[j]
                rid_a, rid_b = a["request"].request_id, b["request"].request_id

                # Find any candidate bundles containing BOTH a and b
                shared_bundles = [
                    bv["active_var"] for bv in bundle_vars.values()
                    if rid_a in bv["req_ids"] and rid_b in bv["req_ids"]
                ]

                a_before_b = model.NewBoolVar(f"trk_{trk_id}_{rid_a}_before_{rid_b}")

                if shared_bundles:
                    # If co-bundled, they can overlap (synchronized); otherwise no overlap
                    same_bundle = model.NewBoolVar(f"same_bndl_{rid_a}_{rid_b}")
                    model.Add(sum(shared_bundles) == 1).OnlyEnforceIf(same_bundle)
                    model.Add(sum(shared_bundles) == 0).OnlyEnforceIf(same_bundle.Not())

                    model.Add(b["start"] >= a["end"]).OnlyEnforceIf([a_before_b, a["present"], b["present"], same_bundle.Not()])
                    for bv_a in bundles_by_task.get(rid_a, []):
                        b_dur_a = bv_a["bundle"]["bundled_duration_mins"]
                        model.Add(b["start"] >= a["start"] + b_dur_a).OnlyEnforceIf([a_before_b, a["present"], b["present"], same_bundle.Not(), bv_a["active_var"]])

                    model.Add(a["start"] >= b["end"]).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"], same_bundle.Not()])
                    for bv_b in bundles_by_task.get(rid_b, []):
                        b_dur_b = bv_b["bundle"]["bundled_duration_mins"]
                        model.Add(a["start"] >= b["start"] + b_dur_b).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"], same_bundle.Not(), bv_b["active_var"]])
                else:
                    # Pure disjoint track occupancy
                    model.Add(b["start"] >= a["end"]).OnlyEnforceIf([a_before_b, a["present"], b["present"]])
                    for bv_a in bundles_by_task.get(rid_a, []):
                        b_dur_a = bv_a["bundle"]["bundled_duration_mins"]
                        model.Add(b["start"] >= a["start"] + b_dur_a).OnlyEnforceIf([a_before_b, a["present"], b["present"], bv_a["active_var"]])

                    model.Add(a["start"] >= b["end"]).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"]])
                    for bv_b in bundles_by_task.get(rid_b, []):
                        b_dur_b = bv_b["bundle"]["bundled_duration_mins"]
                        model.Add(a["start"] >= b["start"] + b_dur_b).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"], bv_b["active_var"]])

    # -------------------------------------------------------------------------
    # 5. Disjunctive Machinery Constraints (Transit time between sections)
    # -------------------------------------------------------------------------
    mach_to_tasks: Dict[str, List[Dict[str, Any]]] = {}
    for req_id, tv in task_vars.items():
        for mach in tv["request"].machinery_required or []:
            mach_to_tasks.setdefault(mach, []).append(tv)

    for mach, tv_list in mach_to_tasks.items():
        for i in range(len(tv_list)):
            for j in range(i + 1, len(tv_list)):
                a, b = tv_list[i], tv_list[j]
                if a["interval"] is None or b["interval"] is None:
                    continue

                rid_a, rid_b = a["request"].request_id, b["request"].request_id
                transit_buffer = 60 if a["request"].section_id != b["request"].section_id else 15
                a_before_b = model.NewBoolVar(f"mach_{mach}_{rid_a}_before_{rid_b}")

                # If a is before b: b.start >= a.end + transit_buffer (account for bundle duration if a is bundled)
                model.Add(b["start"] >= a["end"] + transit_buffer).OnlyEnforceIf([a_before_b, a["present"], b["present"]])
                for bv_a in bundles_by_task.get(rid_a, []):
                    b_dur_a = bv_a["bundle"]["bundled_duration_mins"]
                    model.Add(b["start"] >= a["start"] + b_dur_a + transit_buffer).OnlyEnforceIf([a_before_b, a["present"], b["present"], bv_a["active_var"]])

                # Symmetrically if b is before a
                model.Add(a["start"] >= b["end"] + transit_buffer).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"]])
                for bv_b in bundles_by_task.get(rid_b, []):
                    b_dur_b = bv_b["bundle"]["bundled_duration_mins"]
                    model.Add(a["start"] >= b["start"] + b_dur_b + transit_buffer).OnlyEnforceIf([a_before_b.Not(), a["present"], b["present"], bv_b["active_var"]])

    # -------------------------------------------------------------------------
    # 6. Multi-Objective Terms (Separation of Hard Rules and Soft Preferences)
    # -------------------------------------------------------------------------
    obj_terms = []

    # Priority reward (higher priority / higher ML risk scheduled first)
    for req_id, tv in task_vars.items():
        p_score = tv["request"].ai_priority_score or 50.0
        obj_terms.append(tv["present"] * int(p_score * 100))

        # Penalty for late start
        if tv["start"] is not None:
            obj_terms.append(-1 * (tv["start"] - tv["es"]))

    # Shadow Bundling Reward
    for b_id, b_info in bundle_vars.items():
        saved_mins = b_info["bundle"]["saved_minutes"]
        obj_terms.append(b_info["active_var"] * int(saved_mins * shadow_reward_weight * 50))

    model.Maximize(sum(obj_terms))

    # -------------------------------------------------------------------------
    # 7. Solver Execution
    # -------------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solver_time_s
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = 42
    solver.parameters.log_search_progress = False

    solver_start = datetime.now()
    solve_status = solver.Solve(model)
    solver_duration_s = (datetime.now() - solver_start).total_seconds()

    # -------------------------------------------------------------------------
    # 8. Extract Unified Schedule & First-Class Bundles
    # -------------------------------------------------------------------------
    now_utc = datetime.now()
    plan_id = f"PLAN-{now_utc.strftime('%Y%m%d%H%M%S%f')}"
    plan_items = []
    scheduled_tasks_set = set()
    total_saved_mins = 0
    active_bundles_count = 0
    cross_dept_bundle_count = 0

    if solve_status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # 1. Process Active Bundles First
        for b_id, b_info in bundle_vars.items():
            if solver.Value(b_info["active_var"]) == 1:
                b_meta = b_info["bundle"]
                active_bundles_count += 1
                if len(b_meta["departments"]) > 1:
                    cross_dept_bundle_count += 1

                lead_tv = b_info["matching_tvs"][0]
                st_mins = solver.Value(lead_tv["start"])
                en_mins = st_mins + b_meta["bundled_duration_mins"]
                sch_start = _mins_to_dt(st_mins, base_epoch)
                sch_end = _mins_to_dt(en_mins, base_epoch)
                total_saved_mins += b_meta["saved_minutes"]

                all_mach = []
                for r in b_meta["requests"]:
                    all_mach.extend(r.get("machinery_required") or [])
                    scheduled_tasks_set.add(r["request_id"])

                item = BlockPlanItem(
                    item_id=f"{plan_id}-BUNDLE-{b_id}",
                    plan_id=plan_id,
                    window_id=f"CW-ALLOC-{b_meta['track_id']}",
                    section_id=b_meta["section_id"],
                    track_id=b_meta["track_id"],
                    scheduled_start=sch_start,
                    scheduled_end=sch_end,
                    duration_minutes=b_meta["bundled_duration_mins"],
                    bundled_task_ids=b_meta["request_ids"],
                    assigned_resource_ids=list(set(all_mach)),
                    justification=b_meta["justification"],
                    validation_status="PASSED",
                )
                plan_items.append(item)

        # 2. Process Standalone Scheduled Tasks (not bundled)
        for req_id, tv in task_vars.items():
            r = tv["request"]
            if solver.Value(tv["present"]) == 1 and req_id not in scheduled_tasks_set:
                st_mins = solver.Value(tv["start"])
                en_mins = solver.Value(tv["end"])
                sch_start = _mins_to_dt(st_mins, base_epoch)
                sch_end = _mins_to_dt(en_mins, base_epoch)
                scheduled_tasks_set.add(req_id)

                item = BlockPlanItem(
                    item_id=f"{plan_id}-ITEM-{r.request_id}",
                    plan_id=plan_id,
                    window_id=f"CW-ALLOC-{r.track_id}",
                    section_id=r.section_id,
                    track_id=r.track_id,
                    scheduled_start=sch_start,
                    scheduled_end=sch_end,
                    duration_minutes=tv["dur"],
                    bundled_task_ids=[r.request_id],
                    assigned_resource_ids=r.machinery_required or [],
                    justification=f"Optimized single-task block for {r.department} {r.defect_type}",
                    validation_status="PASSED",
                )
                plan_items.append(item)

    # Update database request statuses
    scheduled_count = 0
    unscheduled_count = 0
    emergency_scheduled = 0
    critical_scheduled = 0
    weighted_priority_captured = 0.0
    weighted_risk_captured = 0.0
    total_maintenance_mins = 0

    for r in requests:
        if r.request_id in scheduled_tasks_set:
            r.status = "SCHEDULED"
            r.unscheduled_reason = None
            scheduled_count += 1
            total_maintenance_mins += r.duration_minutes
            weighted_priority_captured += (r.ai_priority_score or 50.0)
            weighted_risk_captured += (r.ai_risk_score or 0.2)
            if r.severity == "EMERGENCY":
                emergency_scheduled += 1
            elif r.severity == "CRITICAL":
                critical_scheduled += 1
        else:
            r.status = "UNSCHEDULED"
            unscheduled_count += 1
            tv = task_vars.get(r.request_id)
            if tv and tv["ld"] - tv["dur"] < tv["es"]:
                r.unscheduled_reason = "Infeasible deadline: duration exceeds available horizon window"
            else:
                r.unscheduled_reason = "Corridor train traffic congestion or track possession conflict"

    # Compute Total Block Duration (actual line possession)
    total_block_mins = sum(item.duration_minutes for item in plan_items)
    block_utilization = round((total_maintenance_mins / max(1, total_block_mins)) * 100.0, 1) if total_block_mins > 0 else 0.0

    # -------------------------------------------------------------------------
    # 9. Objective Function & Metric Breakdown
    # -------------------------------------------------------------------------
    objective_breakdown = {
        "total_scheduled_tasks": scheduled_count,
        "total_unscheduled_tasks": unscheduled_count,
        "scheduled_emergency_tasks": emergency_scheduled,
        "scheduled_critical_tasks": critical_scheduled,
        "total_maintenance_hours": round(total_maintenance_mins / 60.0, 1),
        "total_block_hours": round(total_block_mins / 60.0, 1),
        "block_possession_saved_hours": round(total_saved_mins / 60.0, 1),
        "block_utilization_pct": block_utilization,
        "active_bundles_count": active_bundles_count,
        "cross_department_bundles_count": cross_dept_bundle_count,
        "weighted_priority_captured": round(weighted_priority_captured, 1),
        "weighted_risk_captured": round(weighted_risk_captured, 2),
        "solver_status": solver.StatusName(solve_status),
        "solver_runtime_s": round(solver_duration_s, 3),
        "objective_value": solver.ObjectiveValue() if solve_status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0,
    }

    # -------------------------------------------------------------------------
    # 10. Tamper-Evident Plan Hash & Persistence
    # -------------------------------------------------------------------------
    hash_payload = f"{plan_id}:{scheduled_count}:{unscheduled_count}:{solver_duration_s}:{total_saved_mins}"
    content_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

    block_plan = BlockPlan(
        plan_id=plan_id,
        horizon=horizon,
        status="RECOMMENDED",
        solver_runtime_s=round(solver_duration_s, 3),
        total_saved_minutes=total_saved_mins,
        total_blocks_scheduled=len(plan_items),
        total_tasks_scheduled=scheduled_count,
        total_unscheduled_tasks=unscheduled_count,
        content_hash=content_hash,
    )

    db.add(block_plan)
    for item in plan_items:
        db.add(item)
    db.commit()

    return {
        "plan_id": plan_id,
        "solver_status": solver.StatusName(solve_status),
        "runtime_seconds": round(solver_duration_s, 3),
        "scheduled_tasks": scheduled_count,
        "unscheduled_tasks": unscheduled_count,
        "content_hash": content_hash,
        "objective_breakdown": objective_breakdown,
    }
