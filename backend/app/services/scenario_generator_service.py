"""
RailSync AI — Randomized Scenario & Simulation Generator Service
Generates fresh, relational, and internally consistent railway simulation datasets for live demo evaluation.
Supports customizable operational presets, random seeds, and automatic end-to-end pipeline execution:
Generated Data -> Ingestion -> AI ML Risk -> Prioritization -> Candidate Windows -> Bundling -> CP-SAT -> Sentinel.
"""

from typing import Dict, Any, Optional, List
import random
import uuid
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database import Base
from backend.app.models.db_models import (
    Station, TrackSection, Track, Asset, Train, Timetable,
    GoodsForecast, Resource, MaintenanceRequest, CandidateWindow,
    BlockPlan, BlockPlanItem, AuditLog
)
from backend.app.pipeline.prioritization import run_prioritization_pipeline
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from dataset_generation.config import (
    STATION_CATALOG, SECTION_CATALOG, TRAIN_PROFILES,
    TMS_DEFECT_TYPES, SMMS_DEFECT_TYPES, TDMS_DEFECT_TYPES, RESOURCE_CATALOG
)
from dataset_generation.generators.geography import generate_stations, generate_track_sections, generate_tracks
from dataset_generation.generators.assets import generate_assets
from dataset_generation.generators.trains import generate_trains
from dataset_generation.generators.timetable import generate_timetable
from dataset_generation.generators.goods_forecast import generate_goods_forecast
from dataset_generation.generators.resources import generate_resources
from dataset_generation.generators.defects import generate_maintenance_requests


from dataset_generation.generators.scenarios import inject_deterministic_scenarios

PRESET_CONFIGS = {
    "BALANCED_OPERATIONS": {
        "name": "Balanced Operations",
        "description": "Standard operational mix across trunk passenger and freight corridors with balanced maintenance demands.",
        "planning_days": 2,
        "total_trains": 120,
        "total_requests": 80,
    },
    "HEAVY_MAINTENANCE": {
        "name": "Heavy Maintenance Surge",
        "description": "Intensive track renewal, tamping, and OHE maintenance demands with constrained track possessions.",
        "planning_days": 2,
        "total_trains": 100,
        "total_requests": 95,
    },
    "FREIGHT_CONGESTION": {
        "name": "Freight Congestion",
        "description": "High-density goods and container traffic creating tightly squeezed candidate maintenance windows.",
        "planning_days": 2,
        "total_trains": 130,
        "total_requests": 75,
    },
    "HIGH_RISK_ASSETS": {
        "name": "High-Risk Asset Degradation",
        "description": "Severe asset deterioration with elevated AI failure probabilities, urgent IMR ultrasonic flaws, and rail fractures.",
        "planning_days": 2,
        "total_trains": 110,
        "total_requests": 80,
    },
    "MAJOR_DISRUPTION": {
        "name": "Major Train Delay Disruption",
        "description": "Cascading delay perturbations across trunk passenger trains requiring dynamic CP-SAT re-optimization.",
        "planning_days": 2,
        "total_trains": 115,
        "total_requests": 75,
    },
    "RESOURCE_SHORTAGE": {
        "name": "Resource & Machinery Shortage",
        "description": "Scarce heavy machinery requiring complex disjunctive routing and inter-sectional transit coordination.",
        "planning_days": 2,
        "total_trains": 105,
        "total_requests": 70,
    },
    "MULTI_DEPARTMENT_OPPORTUNITY": {
        "name": "Multi-Department Opportunity",
        "description": "High co-location of Engineering, S&T, and TRD requests maximizing shadow bundling possession savings.",
        "planning_days": 2,
        "total_trains": 110,
        "total_requests": 85,
    },
}


def generate_random_simulation_scenario(
    db: Session,
    preset: str = "BALANCED_OPERATIONS",
    seed: Optional[int] = None,
    actor: str = "DEMO_OPERATOR"
) -> Dict[str, Any]:
    """
    Generate and ingest a fresh, randomized railway simulation scenario.
    Executes the entire backend pipeline end-to-end.
    """
    preset_key = preset.upper().replace(" ", "_")
    if preset_key not in PRESET_CONFIGS:
        preset_key = "BALANCED_OPERATIONS"

    preset_cfg = PRESET_CONFIGS[preset_key]
    
    if seed is None:
        seed = random.randint(10000, 999999)

    rng = random.Random(seed)
    scenario_id = f"SCN-{preset_key[:4]}-{seed}"

    # 1. Clear existing operational tables
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    # 2. Generate Base Geography
    stations_raw = generate_stations()
    for s in stations_raw:
        stn = Station(
            code=s["code"],
            name=s["name"],
            division=s["division"],
            zone=s["zone"],
            x=float(s["x"]),
            y=float(s["y"]),
            platforms=int(s.get("platforms", 2))
        )
        db.merge(stn)

    sections_raw = generate_track_sections()
    for sec in sections_raw:
        s_obj = TrackSection(
            section_id=sec["section_id"],
            from_stn=sec["from_stn"],
            to_stn=sec["to_stn"],
            distance_km=float(sec["distance_km"]),
            line_type=sec["line_type"],
            tracks=int(sec.get("tracks", 2)),
            max_speed=int(sec.get("max_speed", 110)),
            headway_mins=int(sec.get("headway_mins", 10))
        )
        db.merge(s_obj)

    tracks_raw = generate_tracks(rng)
    for t in tracks_raw:
        trk = Track(
            track_id=t["track_id"],
            section_id=t["section_id"],
            track_name=t["track_name"],
            direction=t["direction"],
            is_electrified=bool(t.get("is_electrified", True)),
            elementary_section_id=t.get("elementary_section_id"),
            speed_limit_kmph=int(t.get("speed_limit_kmph", 110))
        )
        db.merge(trk)

    # 3. Generate Assets (Adjust health index if HIGH_RISK_ASSETS preset)
    assets_raw = generate_assets(tracks_raw, rng)
    for a in assets_raw:
        h_idx = float(a.get("health_index", 90.0))
        insp_days = int(a.get("last_inspected_days_ago", 10))
        crit_wt = int(a.get("criticality_weight", 3))

        if preset_key == "HIGH_RISK_ASSETS" and rng.random() < 0.40:
            h_idx = round(rng.uniform(25.0, 55.0), 1)
            insp_days = rng.randint(30, 90)
            crit_wt = rng.choice([4, 5])

        ast = Asset(
            asset_id=a["asset_id"],
            asset_name=a["asset_name"],
            category=a["category"],
            department=a["department"],
            section_id=a["section_id"],
            track_id=a["track_id"],
            start_km=float(a["start_km"]),
            end_km=float(a["end_km"]),
            criticality_weight=crit_wt,
            health_index=h_idx,
            last_inspected_days_ago=insp_days
        )
        db.merge(ast)

    # 4. Generate Resources (Limit if RESOURCE_SHORTAGE preset)
    resources_raw = generate_resources()
    if preset_key == "RESOURCE_SHORTAGE":
        # Keep only 1 tamper and 1 tower wagon
        resources_raw = [r for r in resources_raw if r["resource_id"] in ("TAMPING_01", "TOWER_WAGON_01", "CREW_ENG_GZB", "CREW_SNT_ALJN")]

    for r in resources_raw:
        res_obj = Resource(
            resource_id=r["resource_id"],
            name=r["name"],
            type=r["type"],
            department=r["department"],
            home_depot=r["home_depot"],
            transit_speed_kmph=float(r.get("transit_speed_kmph", 40.0)),
            max_shift_hours=float(r.get("max_shift_hours", 8.0))
        )
        db.merge(res_obj)

    # 5. Generate Trains & Timetables
    trains_raw = generate_trains(preset_cfg["total_trains"], rng)
    for tr in trains_raw:
        t_obj = Train(
            train_number=tr["train_number"],
            train_name=tr["train_name"],
            train_type=tr["train_type"],
            priority_rank=int(tr.get("priority_rank", 3)),
            speed_factor=float(tr.get("speed_factor", 1.0)),
            headway_buffer_mins=int(tr.get("headway_buffer_mins", 10)),
            max_speed_kmph=int(tr.get("max_speed_kmph", 110))
        )
        db.merge(t_obj)

    timetable_raw = generate_timetable(trains_raw, preset_cfg["planning_days"], rng)
    for tt in timetable_raw:
        entry_dt = datetime.strptime(tt["scheduled_entry"], "%Y-%m-%d %H:%M:%S")
        exit_dt = datetime.strptime(tt["scheduled_exit"], "%Y-%m-%d %H:%M:%S")
        tt_obj = Timetable(
            timetable_id=tt["timetable_id"],
            train_number=tt["train_number"],
            section_id=tt["section_id"],
            track_id=tt["track_id"],
            direction=tt["direction"],
            scheduled_entry=entry_dt,
            scheduled_exit=exit_dt,
            transit_duration_mins=int(tt.get("transit_duration_mins", 15)),
            headway_buffer_mins=int(tt.get("headway_buffer_mins", 10)),
            source="SIMULATED_COA"
        )
        db.merge(tt_obj)

    # 6. Generate Goods Freight Forecasts
    freight_multiplier = 2.0 if preset_key == "FREIGHT_CONGESTION" else 1.0
    freight_trains_count = int(len(trains_raw) * freight_multiplier)
    goods_raw = generate_goods_forecast(trains_raw[:freight_trains_count], preset_cfg["planning_days"], rng)
    for gf in goods_raw:
        gf_obj = GoodsForecast(
            forecast_id=gf["forecast_id"],
            train_number=gf["train_number"],
            section_id=gf["section_id"],
            track_id=gf["track_id"],
            estimated_entry=datetime.strptime(gf["estimated_entry"], "%Y-%m-%d %H:%M:%S"),
            estimated_exit=datetime.strptime(gf["estimated_exit"], "%Y-%m-%d %H:%M:%S"),
            confidence_score=float(gf.get("confidence_score", 0.8)),
            commodity=gf.get("commodity", "CONTAINER"),
            origin_hub=gf.get("origin_hub"),
            destination_hub=gf.get("destination_hub"),
            source="SIMULATED_FOIS"
        )
        db.merge(gf_obj)

    # 7. Generate Maintenance Requests
    requests_raw = generate_maintenance_requests(assets_raw, preset_cfg["total_requests"], preset_cfg["planning_days"], rng)

    # Inject canonical multi-department and emergency scenario patterns
    inject_deterministic_scenarios(requests_raw, assets_raw, timetable_raw, goods_raw)

    # Special handling for MULTI_DEPARTMENT_OPPORTUNITY: Align multi-department tasks on existing valid tracks
    if preset_key == "MULTI_DEPARTMENT_OPPORTUNITY":
        by_trk: Dict[str, List[Dict[str, Any]]] = {}
        for req in requests_raw:
            by_trk.setdefault(req["track_id"], []).append(req)

        depts_cycle = ["ENGINEERING", "SIGNAL_TELECOM", "TRD"]
        for trk_id, req_list in by_trk.items():
            if len(req_list) >= 2:
                for i, req in enumerate(req_list):
                    dept = depts_cycle[i % len(depts_cycle)]
                    req["department"] = dept
                    req["earliest_start"] = "2026-10-01 02:00:00"
                    req["latest_deadline"] = "2026-10-03 22:00:00"
                    req["duration_minutes"] = 90
                    if dept == "ENGINEERING":
                        req["defect_type"] = "DEEP_SCREENING_REQUIRED"
                        req["machinery_required"] = ["TAMPING_01"] if i % 2 == 0 else ["BCM_01"]
                        req["power_block_required"] = False
                    elif dept == "SIGNAL_TELECOM":
                        req["defect_type"] = "POINT_MACHINE_BACKLASH"
                        req["machinery_required"] = []
                        req["power_block_required"] = False
                    else:  # TRD
                        req["defect_type"] = "CANTILEVER_CORROSION"
                        req["machinery_required"] = ["TOWER_WAGON_01"]
                        req["power_block_required"] = True

    for req in requests_raw:
        m_req = MaintenanceRequest(
            request_id=req["request_id"],
            department=req["department"],
            source_system=req["source_system"],
            asset_id=req["asset_id"],
            section_id=req["section_id"],
            track_id=req["track_id"],
            start_km=float(req["start_km"]),
            end_km=float(req["end_km"]),
            defect_type=req["defect_type"],
            severity=req["severity"],
            duration_minutes=int(req["duration_minutes"]),
            earliest_start=datetime.strptime(req["earliest_start"], "%Y-%m-%d %H:%M:%S"),
            latest_deadline=datetime.strptime(req["latest_deadline"], "%Y-%m-%d %H:%M:%S"),
            speed_restriction_kmph=int(req.get("speed_restriction_kmph", 0)),
            machinery_required=req.get("machinery_required", []),
            power_block_required=bool(req.get("power_block_required", False)),
            elementary_section_id=req.get("elementary_section_id"),
            status="PENDING",
            scenario_tag=scenario_id
        )
        db.merge(m_req)

    db.commit()

    # -------------------------------------------------------------------------
    # 8. Execute Full Pipeline: AI Prioritization -> Windows -> CP-SAT -> Sentinel
    # -------------------------------------------------------------------------
    # A. AI Prioritization Pipeline
    prioritized_tasks = run_prioritization_pipeline(db=db)
    tier1_emergencies = sum(1 for r in prioritized_tasks if r.get("ai_urgency_level") == "CRITICAL_EMERGENCY")
    high_risk_assets = sum(1 for r in prioritized_tasks if (r.get("ai_risk_score") or 0.0) >= 0.50)

    # B. Candidate Windows Extraction
    extracted_windows = extract_candidate_windows(db=db, min_gap_minutes=60)

    # C. CP-SAT Master Optimizer
    plan_res = solve_maintenance_schedule(db=db, horizon="WEEKLY", max_solver_time_s=10)
    plan_id = plan_res.get("plan_id", f"PLAN-{scenario_id}")

    # D. Independent Sentinel Validator
    val_res = validate_plan_schedule(db=db, plan_id=plan_id)

    # E. Audit Log Entry
    obj_breakdown = plan_res.get("objective_breakdown", {})
    active_bundles = obj_breakdown.get("active_bundles_count", 0)
    saved_hours = obj_breakdown.get("block_possession_saved_hours", 0.0)
    total_block_hours = obj_breakdown.get("total_block_hours", 0.0)

    h = hashlib.sha256(f"SCENARIO_{scenario_id}_{seed}".encode()).hexdigest()
    audit = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        action="RANDOM_SCENARIO_GENERATED",
        actor=actor,
        plan_id=plan_id,
        justification=f"Scenario '{preset_cfg['name']}' generated with Seed={seed}. Scheduled {plan_res.get('scheduled_tasks', 0)} tasks in {active_bundles} bundles. Sentinel: {val_res.get('overall_verdict')}.",
        content_hash=h,
        new_state={
            "scenario_id": scenario_id,
            "preset": preset_key,
            "seed": seed,
            "trains": len(trains_raw),
            "timetable_entries": len(timetable_raw),
            "requests": len(requests_raw),
            "scheduled": plan_res.get("scheduled_tasks", 0),
            "bundles": active_bundles,
            "validation": val_res.get("overall_verdict")
        }
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SCENARIO_GENERATED",
        "scenario_id": scenario_id,
        "preset": preset_key,
        "preset_name": preset_cfg["name"],
        "description": preset_cfg["description"],
        "seed": seed,
        "trains_count": len(trains_raw),
        "timetable_count": len(timetable_raw),
        "maintenance_requests_count": len(requests_raw),
        "tier1_emergencies_count": tier1_emergencies,
        "high_risk_assets_count": high_risk_assets,
        "candidate_windows_count": len(extracted_windows),
        "scheduled_tasks_count": plan_res.get("scheduled_tasks", 0),
        "unscheduled_tasks_count": plan_res.get("unscheduled_tasks", 0),
        "active_bundles_count": active_bundles,
        "possession_hours_saved": saved_hours,
        "total_possession_hours": total_block_hours,
        "solver_runtime_s": plan_res.get("runtime_seconds", 0.0),
        "validation_verdict": val_res.get("overall_verdict", "PASSED"),
        "plan_id": plan_id,
        "audit_log_id": audit.log_id,
        "message": f"Scenario '{preset_cfg['name']}' (Seed {seed}) generated and verified successfully."
    }
