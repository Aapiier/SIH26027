"""
RailSync AI — Next-Generation Temporal Feature Engineering Pipeline (v2.0)
Extracts multi-scale backward-looking physical degradation, traffic exposure, and maintenance debt features
strictly without target proxy leakage or lookahead bias.
"""

from typing import Dict, List, Any
import numpy as np

FEATURE_NAMES = [
    "current_health_index",
    "health_degradation_velocity_14d",
    "health_degradation_velocity_30d",
    "cumulative_gmt_tonnage_30d",
    "days_since_last_inspection",
    "days_since_last_maintenance",
    "past_defects_count_90d",
    "deferred_maintenance_count",
    "environmental_stress_index_7d",
    "asset_age_years",
    "asset_criticality",
    "speed_restriction_active",
]


def extract_asset_features(
    asset_meta: Dict[str, Any],
    recent_telemetry: List[Dict[str, Any]] = None,
    recent_defects: List[Dict[str, Any]] = None
) -> Dict[str, float]:
    """
    Extract backward-looking feature dictionary for an asset at current decision time T.
    Uses asset metadata and recent historical telemetry if available, falling back cleanly.
    """
    if asset_meta is None:
        asset_meta = {}

    current_health = float(asset_meta.get("health_index", 85.0))
    days_since_insp = float(asset_meta.get("last_inspected_days_ago", 15.0))
    criticality = float(asset_meta.get("criticality_weight", 3.0))
    age_years = float(asset_meta.get("age_years", 12.0))

    if recent_telemetry and len(recent_telemetry) >= 14:
        # Calculate empirical degradation velocity
        h_latest = recent_telemetry[-1].get("health_index", current_health)
        h_14 = recent_telemetry[-14].get("health_index", h_latest)
        h_30 = recent_telemetry[-30].get("health_index", h_14) if len(recent_telemetry) >= 30 else h_14
        
        vel_14d = round((h_latest - h_14) / 14.0, 3)
        vel_30d = round((h_latest - h_30) / (30.0 if len(recent_telemetry) >= 30 else 14.0), 3)
        gmt_30d = sum(r.get("daily_gmt", 45.0) for r in recent_telemetry[-30:])
        days_maint = float(recent_telemetry[-1].get("days_since_maintenance", 25.0))
        deferred_cnt = float(recent_telemetry[-1].get("deferred_count", 0.0))
        speed_res = float(recent_telemetry[-1].get("speed_restriction_active", 0.0))
        env_stress = float(recent_telemetry[-1].get("stress_index", 0.8))
    else:
        # Heuristic estimation for cold start / request-level asset records
        vel_14d = round(-max(0.0, (100.0 - current_health) / 100.0 * 0.4), 3)
        vel_30d = round(-max(0.0, (100.0 - current_health) / 100.0 * 0.3), 3)
        gmt_30d = round(45.0 * 30.0, 1)
        days_maint = max(10.0, days_since_insp * 1.5)
        deferred_cnt = 1.0 if current_health < 65.0 else 0.0
        speed_res = 1.0 if current_health < 50.0 else 0.0
        env_stress = 0.85

    past_def_90d = float(len(recent_defects)) if recent_defects else (2.0 if current_health < 60.0 else 0.0)

    return {
        "current_health_index": round(current_health, 1),
        "health_degradation_velocity_14d": vel_14d,
        "health_degradation_velocity_30d": vel_30d,
        "cumulative_gmt_tonnage_30d": round(gmt_30d, 1),
        "days_since_last_inspection": days_since_insp,
        "days_since_last_maintenance": days_maint,
        "past_defects_count_90d": past_def_90d,
        "deferred_maintenance_count": deferred_cnt,
        "environmental_stress_index_7d": round(env_stress, 2),
        "asset_age_years": age_years,
        "asset_criticality": criticality,
        "speed_restriction_active": speed_res,
    }


def feature_dict_to_vector(features: Dict[str, float]) -> List[float]:
    """Convert feature dictionary to ordered float vector strictly matching FEATURE_NAMES."""
    return [float(features.get(k, 0.0)) for k in FEATURE_NAMES]
