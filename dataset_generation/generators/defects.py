"""
RailSync AI — Departmental Maintenance Requests Generator (TMS, SMMS, TDMS)
Generates structured maintenance demands linked to real assets and track sections.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
from dataset_generation.config import TMS_DEFECT_TYPES, SMMS_DEFECT_TYPES, TDMS_DEFECT_TYPES

def generate_maintenance_requests(
    assets: List[Dict[str, Any]], 
    total_requests: int, 
    planning_days: int,
    rng: random.Random
) -> List[Dict[str, Any]]:
    """
    Generate realistic multi-departmental maintenance requests.
    """
    requests = []
    req_id_counter = 3001
    base_date = datetime(2026, 10, 1, 0, 0, 0)

    # Departmental distribution: 40% ENG, 30% S&T, 30% TRD
    dept_weights = [("ENGINEERING", 0.40), ("SIGNAL_TELECOM", 0.30), ("TRD", 0.30)]
    dept_choices = [d[0] for d in dept_weights]
    dept_probs = [d[1] for d in dept_weights]

    for _ in range(total_requests):
        dept = rng.choices(dept_choices, weights=dept_probs)[0]
        
        # Filter matching assets
        matching_assets = [a for a in assets if a["department"] == dept]
        if not matching_assets:
            matching_assets = assets
        asset = rng.choice(matching_assets)

        if dept == "ENGINEERING":
            defect_meta = rng.choice(TMS_DEFECT_TYPES)
            source_sys = "SIMULATED_TMS"
        elif dept == "SIGNAL_TELECOM":
            defect_meta = rng.choice(SMMS_DEFECT_TYPES)
            source_sys = "SIMULATED_SMMS"
        else:
            defect_meta = rng.choice(TDMS_DEFECT_TYPES)
            source_sys = "SIMULATED_TDMS"

        # Timing constraints
        start_day_offset = rng.randint(0, planning_days - 2)
        earliest_start = base_date + timedelta(days=start_day_offset, hours=rng.randint(1, 10))
        
        # Deadlines vary by severity
        severity = defect_meta["severity"]
        if severity == "EMERGENCY":
            deadline = earliest_start + timedelta(hours=rng.randint(6, 18))
        elif severity == "CRITICAL":
            deadline = earliest_start + timedelta(days=rng.randint(1, 2))
        elif severity == "URGENT":
            deadline = earliest_start + timedelta(days=rng.randint(2, 4))
        else: # ROUTINE
            deadline = earliest_start + timedelta(days=rng.randint(4, 7))

        requests.append({
            "request_id": f"REQ-{req_id_counter}",
            "department": dept,
            "source_system": source_sys,
            "asset_id": asset["asset_id"],
            "section_id": asset["section_id"],
            "track_id": asset["track_id"],
            "start_km": asset["start_km"],
            "end_km": asset["end_km"],
            "defect_type": defect_meta["type"],
            "severity": severity,
            "duration_minutes": defect_meta["base_duration"],
            "earliest_start": earliest_start.strftime("%Y-%m-%d %H:%M:%S"),
            "latest_deadline": deadline.strftime("%Y-%m-%d %H:%M:%S"),
            "speed_restriction_kmph": defect_meta["speed_res"],
            "machinery_required": defect_meta["machinery"],
            "power_block_required": (dept == "TRD" or "BCM" in str(defect_meta["machinery"])),
            "elementary_section_id": f"ES-{asset['section_id']}",
            "status": "PENDING",
            "scenario_tag": "BASE_POOL",
        })
        req_id_counter += 1

    return requests
