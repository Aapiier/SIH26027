"""
RailSync AI — Feature Engineering Pipeline
Extracts multi-dimensional risk and operational feature vectors from maintenance requests and assets.
"""

from typing import Dict, List, Any
from datetime import datetime
import numpy as np


SEVERITY_MAP = {
    "EMERGENCY": 4.0,
    "CRITICAL": 3.0,
    "URGENT": 2.0,
    "ROUTINE": 1.0,
}

DEPARTMENT_MAP = {
    "ENGINEERING": 1.0,
    "SIGNAL_TELECOM": 2.0,
    "TRD": 3.0,
}


def extract_request_features(req: Dict[str, Any], asset_meta: Dict[str, Any] = None) -> Dict[str, float]:
    """
    Extract standardized numeric features for ML risk scoring and explainability.
    """
    if asset_meta is None:
        asset_meta = {}

    severity_val = SEVERITY_MAP.get(req.get("severity", "ROUTINE"), 1.0)
    dept_val = DEPARTMENT_MAP.get(req.get("department", "ENGINEERING"), 1.0)
    duration_hrs = float(req.get("duration_minutes", 60)) / 60.0

    # Deadline window in hours
    earliest = req.get("earliest_start")
    deadline = req.get("latest_deadline")
    if isinstance(earliest, str):
        earliest = datetime.fromisoformat(earliest)
    if isinstance(deadline, str):
        deadline = datetime.fromisoformat(deadline)

    deadline_window_hrs = max(1.0, (deadline - earliest).total_seconds() / 3600.0) if earliest and deadline else 24.0
    urgency_ratio = duration_hrs / deadline_window_hrs

    # Asset metrics
    criticality = float(asset_meta.get("criticality_weight", 3.0))
    health_idx = float(asset_meta.get("health_index", 85.0))
    degradation_risk = (100.0 - health_idx) / 100.0
    inspection_age_days = float(asset_meta.get("last_inspected_days_ago", 15.0))

    # Operational impact
    speed_res = float(req.get("speed_restriction_kmph", 0))
    speed_impact = max(0.0, (110.0 - speed_res) / 110.0) if speed_res > 0 else 0.0
    power_block = 1.0 if req.get("power_block_required") else 0.0
    machinery = req.get("machinery_required", [])
    machine_count = float(len(machinery) if isinstance(machinery, list) else 0)

    return {
        "severity_level": severity_val,
        "department_code": dept_val,
        "duration_hours": round(duration_hrs, 2),
        "deadline_window_hours": round(deadline_window_hrs, 2),
        "urgency_ratio": round(urgency_ratio, 3),
        "asset_criticality": criticality,
        "degradation_risk": round(degradation_risk, 3),
        "inspection_age_days": inspection_age_days,
        "speed_restriction_impact": round(speed_impact, 3),
        "power_block_required": power_block,
        "machinery_count": machine_count,
    }


def feature_dict_to_vector(features: Dict[str, float]) -> List[float]:
    """Convert feature dictionary to ordered feature vector."""
    ordered_keys = [
        "severity_level",
        "department_code",
        "duration_hours",
        "deadline_window_hours",
        "urgency_ratio",
        "asset_criticality",
        "degradation_risk",
        "inspection_age_days",
        "speed_restriction_impact",
        "power_block_required",
        "machinery_count",
    ]
    return [features[k] for k in ordered_keys]
