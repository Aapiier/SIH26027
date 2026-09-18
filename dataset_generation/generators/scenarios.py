"""
RailSync AI — Deterministic Scenario Injector
Injects mathematically crafted scenarios into synthetic datasets for verification and demo testing.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta

def inject_deterministic_scenarios(
    requests: List[Dict[str, Any]], 
    assets: List[Dict[str, Any]],
    timetable: List[Dict[str, Any]],
    goods_forecast: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Inject 8 deterministic test scenarios directly into the dataset collections.
    """
    base_date = datetime(2026, 10, 1, 0, 0, 0)

    # -------------------------------------------------------------------------
    # Scenario 1: Tri-Department Integrated Mega Block on GZB-ALJN (Day 1)
    # -------------------------------------------------------------------------
    # ENG + S&T + TRD on the same section GZB-ALJN, same track GZB-ALJN-UP, compatible windows
    s1_asset_eng = next(a for a in assets if a["section_id"] == "GZB-ALJN" and a["department"] == "ENGINEERING")
    s1_asset_snt = next(a for a in assets if a["section_id"] == "GZB-ALJN" and a["department"] == "SIGNAL_TELECOM")
    s1_asset_trd = next(a for a in assets if a["section_id"] == "GZB-ALJN" and a["department"] == "TRD")

    s1_start = base_date + timedelta(days=0, hours=10, minutes=0)
    s1_deadline = base_date + timedelta(days=0, hours=16, minutes=0)

    requests.append({
        "request_id": "SCN-01-ENG",
        "department": "ENGINEERING",
        "source_system": "SIMULATED_TMS",
        "asset_id": s1_asset_eng["asset_id"],
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "start_km": 25.0,
        "end_km": 35.0,
        "defect_type": "TRACK_GEOMETRY_TWIST",
        "severity": "URGENT",
        "duration_minutes": 150,
        "earliest_start": s1_start.strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": s1_deadline.strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 50,
        "machinery_required": ["TAMPING_01"],
        "power_block_required": False,
        "elementary_section_id": "ES-GZB-ALJN",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_1_MEGA_BLOCK",
    })

    requests.append({
        "request_id": "SCN-01-SNT",
        "department": "SIGNAL_TELECOM",
        "source_system": "SIMULATED_SMMS",
        "asset_id": s1_asset_snt["asset_id"],
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "start_km": 28.0,
        "end_km": 28.5,
        "defect_type": "POINT_MACHINE_DETECTION_FAILURE",
        "severity": "URGENT",
        "duration_minutes": 90,
        "earliest_start": (s1_start + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": s1_deadline.strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 30,
        "machinery_required": [],
        "power_block_required": False,
        "elementary_section_id": "ES-GZB-ALJN",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_1_MEGA_BLOCK",
    })

    requests.append({
        "request_id": "SCN-01-TRD",
        "department": "TRD",
        "source_system": "SIMULATED_TDMS",
        "asset_id": s1_asset_trd["asset_id"],
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "start_km": 20.0,
        "end_km": 40.0,
        "defect_type": "INSULATOR_HEAVY_POLLUTION_CLEANING",
        "severity": "URGENT",
        "duration_minutes": 120,
        "earliest_start": s1_start.strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": s1_deadline.strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 0,
        "machinery_required": ["TOWER_WAGON_01"],
        "power_block_required": True,
        "elementary_section_id": "ES-GZB-ALJN",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_1_MEGA_BLOCK",
    })

    # -------------------------------------------------------------------------
    # Scenario 2: Safety-Critical Emergency Escalation on NDLS-GZB
    # -------------------------------------------------------------------------
    s2_asset = next(a for a in assets if a["section_id"] == "NDLS-GZB" and a["category"] == "TRACK")
    requests.append({
        "request_id": "SCN-02-EMERGENCY",
        "department": "ENGINEERING",
        "source_system": "SIMULATED_TMS",
        "asset_id": s2_asset["asset_id"],
        "section_id": "NDLS-GZB",
        "track_id": "NDLS-GZB-UP-FAST",
        "start_km": 8.5,
        "end_km": 9.0,
        "defect_type": "RAIL_FRACTURE_RISK",
        "severity": "EMERGENCY",
        "duration_minutes": 120,
        "earliest_start": (base_date + timedelta(days=0, hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": (base_date + timedelta(days=0, hours=12)).strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 20,
        "machinery_required": ["TAMPING_01"],
        "power_block_required": False,
        "elementary_section_id": "ES-NDLS-GZB-UP-F",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_2_EMERGENCY_ESCALATION",
    })

    # -------------------------------------------------------------------------
    # Scenario 4: Heavy Machinery Disjunctive Conflict (TAMPING_01 assigned in 2 far places)
    # -------------------------------------------------------------------------
    # TAMPING_01 is needed on ALJN-TDL and CNB-PRYJ within 1 hour of each other (distance > 250 km)
    s4_asset = next(a for a in assets if a["section_id"] == "CNB-PRYJ" and a["category"] == "TRACK")
    requests.append({
        "request_id": "SCN-04-MACH-CLASH",
        "department": "ENGINEERING",
        "source_system": "SIMULATED_TMS",
        "asset_id": s4_asset["asset_id"],
        "section_id": "CNB-PRYJ",
        "track_id": "CNB-PRYJ-DN",
        "start_km": 15.0,
        "end_km": 25.0,
        "defect_type": "IMR_ULTRASONIC_FLAW",
        "severity": "CRITICAL",
        "duration_minutes": 150,
        "earliest_start": (base_date + timedelta(days=0, hours=11)).strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": (base_date + timedelta(days=0, hours=17)).strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 45,
        "machinery_required": ["TAMPING_01"],  # Same machine as SCN-01-ENG!
        "power_block_required": False,
        "elementary_section_id": "ES-CNB-PRYJ",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_4_MACHINE_CONFLICT",
    })

    # -------------------------------------------------------------------------
    # Scenario 7: Infeasible Task (Demands 480 mins on busy section where max gap is 60m)
    # -------------------------------------------------------------------------
    s7_asset = next(a for a in assets if a["section_id"] == "ETW-CNB" and a["category"] == "TRACK")
    requests.append({
        "request_id": "SCN-07-INFEASIBLE",
        "department": "ENGINEERING",
        "source_system": "SIMULATED_TMS",
        "asset_id": s7_asset["asset_id"],
        "section_id": "ETW-CNB",
        "track_id": "ETW-CNB-UP",
        "start_km": 50.0,
        "end_km": 70.0,
        "defect_type": "BALLAST_CLEANING_DEEP",
        "severity": "ROUTINE",
        "duration_minutes": 480, # 8 hours! Impossible in daytime traffic
        "earliest_start": (base_date + timedelta(days=1, hours=8)).strftime("%Y-%m-%d %H:%M:%S"),
        "latest_deadline": (base_date + timedelta(days=1, hours=16)).strftime("%Y-%m-%d %H:%M:%S"),
        "speed_restriction_kmph": 30,
        "machinery_required": ["BCM_01"],
        "power_block_required": True,
        "elementary_section_id": "ES-ETW-CNB",
        "status": "PENDING",
        "scenario_tag": "SCENARIO_7_INFEASIBLE_WINDOW",
    })

    return {
        "scenario_1": "Tri-Department Mega Block on GZB-ALJN",
        "scenario_2": "Safety-Critical Emergency on NDLS-GZB",
        "scenario_4": "Heavy Machine Routing Conflict on TAMPING_01",
        "scenario_7": "Infeasible Duration Request on ETW-CNB",
    }
