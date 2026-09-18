"""
RailSync AI — Dataset Generation Configuration
Central configuration for generating deterministic, relational synthetic railway datasets.
"""

from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = ROOT_DIR / "data" / "synthetic"
DEFAULT_SEED = 42

@dataclass
class DatasetConfig:
    seed: int = DEFAULT_SEED
    output_dir: Path = DEFAULT_OUTPUT_DIR
    planning_days: int = 7
    total_trains: int = 120
    total_requests: int = 80
    corridor_name: str = "Delhi - Prayagraj Trunk Corridor"

# ---------------------------------------------------------------------------
# 1. Geographic Hub Stations with 2D Canvas Coordinates (for Network Map)
# ---------------------------------------------------------------------------
STATION_CATALOG: List[Dict[str, Any]] = [
    {"code": "NDLS", "name": "New Delhi", "division": "Delhi", "zone": "NR", "x": 100, "y": 250, "platforms": 16},
    {"code": "ANVT", "name": "Anand Vihar Terminal", "division": "Delhi", "zone": "NR", "x": 180, "y": 210, "platforms": 7},
    {"code": "GZB",  "name": "Ghaziabad Junction", "division": "Delhi", "zone": "NR", "x": 260, "y": 250, "platforms": 8},
    {"code": "ALJN", "name": "Aligarh Junction", "division": "Prayagraj", "zone": "NCR", "x": 420, "y": 280, "platforms": 7},
    {"code": "TDL",  "name": "Tundla Junction", "division": "Prayagraj", "zone": "NCR", "x": 560, "y": 320, "platforms": 5},
    {"code": "ETW",  "name": "Etawah Junction", "division": "Prayagraj", "zone": "NCR", "x": 700, "y": 350, "platforms": 5},
    {"code": "CNB",  "name": "Kanpur Central", "division": "Prayagraj", "zone": "NCR", "x": 860, "y": 380, "platforms": 10},
    {"code": "PRYJ", "name": "Prayagraj Junction", "division": "Prayagraj", "zone": "NCR", "x": 1020, "y": 420, "platforms": 10},
]

# ---------------------------------------------------------------------------
# 2. Inter-Station Track Sections along Trunk Corridor
# ---------------------------------------------------------------------------
SECTION_CATALOG: List[Dict[str, Any]] = [
    {"section_id": "NDLS-GZB", "from_stn": "NDLS", "to_stn": "GZB", "distance_km": 25.0, "line_type": "QUADRUPLE", "tracks": 4, "max_speed": 110, "headway_mins": 8},
    {"section_id": "ANVT-GZB", "from_stn": "ANVT", "to_stn": "GZB", "distance_km": 15.0, "line_type": "DOUBLE", "tracks": 2, "max_speed": 90,  "headway_mins": 10},
    {"section_id": "GZB-ALJN", "from_stn": "GZB",  "to_stn": "ALJN", "distance_km": 105.0,"line_type": "DOUBLE", "tracks": 2, "max_speed": 130, "headway_mins": 10},
    {"section_id": "ALJN-TDL", "from_stn": "ALJN", "to_stn": "TDL",  "distance_km": 78.0, "line_type": "DOUBLE", "tracks": 2, "max_speed": 130, "headway_mins": 10},
    {"section_id": "TDL-ETW",  "from_stn": "TDL",  "to_stn": "ETW",  "distance_km": 92.0, "line_type": "DOUBLE", "tracks": 2, "max_speed": 130, "headway_mins": 10},
    {"section_id": "ETW-CNB",  "from_stn": "ETW",  "to_stn": "CNB",  "distance_km": 139.0,"line_type": "DOUBLE", "tracks": 2, "max_speed": 130, "headway_mins": 10},
    {"section_id": "CNB-PRYJ", "from_stn": "CNB",  "to_stn": "PRYJ", "distance_km": 194.0,"line_type": "DOUBLE", "tracks": 2, "max_speed": 130, "headway_mins": 10},
]

# ---------------------------------------------------------------------------
# 3. Train Classification & Profiles
# ---------------------------------------------------------------------------
TRAIN_PROFILES = [
    {"type": "VANDE_BHARAT", "priority_rank": 1, "speed_factor": 1.15, "headway_buffer": 15, "weight": 0.10},
    {"type": "RAJDHANI",     "priority_rank": 1, "speed_factor": 1.10, "headway_buffer": 15, "weight": 0.15},
    {"type": "SHATABDI",     "priority_rank": 1, "speed_factor": 1.05, "headway_buffer": 12, "weight": 0.10},
    {"type": "SUPERFAST",    "priority_rank": 2, "speed_factor": 0.95, "headway_buffer": 10, "weight": 0.30},
    {"type": "EXPRESS",      "priority_rank": 3, "speed_factor": 0.85, "headway_buffer": 8,  "weight": 0.20},
    {"type": "FREIGHT",      "priority_rank": 4, "speed_factor": 0.65, "headway_buffer": 5,  "weight": 0.15},
]

# ---------------------------------------------------------------------------
# 4. Departmental Defect Profiles (TMS, SMMS, TDMS)
# ---------------------------------------------------------------------------
TMS_DEFECT_TYPES = [
    {"type": "RAIL_FRACTURE_RISK", "severity": "EMERGENCY", "base_duration": 180, "machinery": ["TAMPING_01"], "speed_res": 30},
    {"type": "IMR_ULTRASONIC_FLAW", "severity": "CRITICAL", "base_duration": 120, "machinery": ["TAMPING_01"], "speed_res": 50},
    {"type": "TRACK_GEOMETRY_TWIST", "severity": "URGENT", "base_duration": 150, "machinery": ["UNIMAT_01"], "speed_res": 75},
    {"type": "OVERDUE_TAMPING", "severity": "ROUTINE", "base_duration": 240, "machinery": ["TAMPING_02"], "speed_res": 0},
    {"type": "BALLAST_CLEANING_DEEP", "severity": "ROUTINE", "base_duration": 300, "machinery": ["BCM_01"], "speed_res": 45},
]

SMMS_DEFECT_TYPES = [
    {"type": "POINT_MACHINE_DETECTION_FAILURE", "severity": "EMERGENCY", "base_duration": 90, "machinery": [], "speed_res": 30},
    {"type": "TRACK_CIRCUIT_INTERMITTENT_DROP", "severity": "CRITICAL", "base_duration": 75, "machinery": [], "speed_res": 45},
    {"type": "AXLE_COUNTER_RESET_FAULT", "severity": "URGENT", "base_duration": 60, "machinery": [], "speed_res": 0},
    {"type": "SIGNAL_ASPECT_LED_BURNOUT", "severity": "URGENT", "base_duration": 45, "machinery": [], "speed_res": 0},
    {"type": "SNT_CABLE_MEGGERING_INSPECTION", "severity": "ROUTINE", "base_duration": 120, "machinery": [], "speed_res": 0},
]

TDMS_DEFECT_TYPES = [
    {"type": "OHE_CANTILEVER_FLASH_BURN", "severity": "EMERGENCY", "base_duration": 120, "machinery": ["TOWER_WAGON_01"], "speed_res": 30},
    {"type": "CONTACT_WIRE_PARTING_RISK", "severity": "CRITICAL", "base_duration": 150, "machinery": ["TOWER_WAGON_01"], "speed_res": 45},
    {"type": "INSULATOR_HEAVY_POLLUTION_CLEANING", "severity": "URGENT", "base_duration": 90, "machinery": ["TOWER_WAGON_02"], "speed_res": 0},
    {"type": "NEUTRAL_SECTION_PTFE_REPLACEMENT", "severity": "ROUTINE", "base_duration": 180, "machinery": ["TOWER_WAGON_02"], "speed_res": 0},
    {"type": "DROPPER_REGULATION_ADJUSTMENT", "severity": "ROUTINE", "base_duration": 120, "machinery": ["TOWER_WAGON_01"], "speed_res": 0},
]

# ---------------------------------------------------------------------------
# 5. Heavy Machinery & Resource Registry
# ---------------------------------------------------------------------------
RESOURCE_CATALOG = [
    {"resource_id": "TAMPING_01", "name": "CSM Tamping Express 01", "type": "TAMPING_MACHINE", "department": "ENGINEERING", "home_depot": "GZB", "transit_speed_kmph": 40, "max_shift_hours": 8},
    {"resource_id": "TAMPING_02", "name": "Duomatic Tamper 02", "type": "TAMPING_MACHINE", "department": "ENGINEERING", "home_depot": "CNB", "transit_speed_kmph": 40, "max_shift_hours": 8},
    {"resource_id": "UNIMAT_01",  "name": "Unimat 4S Points Tamper", "type": "UNIMAT", "department": "ENGINEERING", "home_depot": "TDL", "transit_speed_kmph": 35, "max_shift_hours": 8},
    {"resource_id": "BCM_01",     "name": "Plasser Ballast Cleaning Machine 01", "type": "BCM", "department": "ENGINEERING", "home_depot": "GZB", "transit_speed_kmph": 30, "max_shift_hours": 8},
    {"resource_id": "TOWER_WAGON_01", "name": "8-Wheeler DETC Tower Wagon 01", "type": "TOWER_WAGON", "department": "TRD", "home_depot": "ALJN", "transit_speed_kmph": 50, "max_shift_hours": 10},
    {"resource_id": "TOWER_WAGON_02", "name": "4-Wheeler OHE Tower Car 02", "type": "TOWER_WAGON", "department": "TRD", "home_depot": "ETW", "transit_speed_kmph": 45, "max_shift_hours": 10},
    {"resource_id": "CREW_ENG_GZB", "name": "P-Way Maintenance Gang GZB", "type": "CREW_TEAM", "department": "ENGINEERING", "home_depot": "GZB", "transit_speed_kmph": 60, "max_shift_hours": 8},
    {"resource_id": "CREW_SNT_ALJN", "name": "S&T Technical Maintenance Squad ALJN", "type": "CREW_TEAM", "department": "SIGNAL_TELECOM", "home_depot": "ALJN", "transit_speed_kmph": 60, "max_shift_hours": 8},
    {"resource_id": "CREW_TRD_CNB", "name": "TRD Traction Power Gang CNB", "type": "CREW_TEAM", "department": "TRD", "home_depot": "CNB", "transit_speed_kmph": 60, "max_shift_hours": 8},
]
