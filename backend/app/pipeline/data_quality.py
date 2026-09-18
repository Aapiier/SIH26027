"""
RailSync AI — Ingestion Data Quality & Sanitization Gate
Checks schema validity, field constraints, datetime parsing, and flags/quarantines invalid records.
"""

from typing import Dict, List, Any, Tuple
from datetime import datetime
import json


def sanitize_datetime(val: Any) -> datetime:
    """Parse string datetime into datetime object."""
    if isinstance(val, datetime):
        return val
    if not val:
        raise ValueError("Datetime field cannot be empty")
    return datetime.fromisoformat(str(val).replace("Z", ""))


def validate_and_clean_request(raw: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], str]:
    """
    Validate and clean a raw maintenance request record.
    Returns (is_valid, cleaned_dict, error_msg).
    """
    try:
        req_id = raw.get("request_id")
        if not req_id:
            return False, raw, "Missing request_id"

        department = raw.get("department")
        if department not in ("ENGINEERING", "SIGNAL_TELECOM", "TRD"):
            return False, raw, f"Invalid department '{department}'"

        severity = raw.get("severity", "ROUTINE")
        if severity not in ("EMERGENCY", "CRITICAL", "URGENT", "ROUTINE"):
            return False, raw, f"Invalid severity '{severity}'"

        duration = int(raw.get("duration_minutes", 60))
        if duration <= 0:
            return False, raw, f"Invalid duration '{duration}'"

        earliest = sanitize_datetime(raw.get("earliest_start"))
        deadline = sanitize_datetime(raw.get("latest_deadline"))
        if earliest >= deadline:
            return False, raw, "earliest_start must be before latest_deadline"

        # Handle machinery JSON string or list
        machinery = raw.get("machinery_required", [])
        if isinstance(machinery, str):
            try:
                machinery = json.loads(machinery)
            except Exception:
                machinery = [machinery] if machinery else []

        cleaned = {
            "request_id": str(req_id),
            "department": department,
            "source_system": str(raw.get("source_system", "SIMULATED_TMS")),
            "asset_id": str(raw.get("asset_id")),
            "section_id": str(raw.get("section_id")),
            "track_id": str(raw.get("track_id")),
            "start_km": float(raw.get("start_km", 0.0)),
            "end_km": float(raw.get("end_km", 0.0)),
            "defect_type": str(raw.get("defect_type", "GENERIC_DEFECT")),
            "severity": severity,
            "duration_minutes": duration,
            "earliest_start": earliest,
            "latest_deadline": deadline,
            "speed_restriction_kmph": int(raw.get("speed_restriction_kmph", 0)),
            "machinery_required": machinery,
            "power_block_required": bool(raw.get("power_block_required", False)),
            "elementary_section_id": raw.get("elementary_section_id"),
            "status": str(raw.get("status", "PENDING")),
            "scenario_tag": str(raw.get("scenario_tag", "BASE_POOL")),
        }
        return True, cleaned, ""
    except Exception as ex:
        return False, raw, str(ex)
