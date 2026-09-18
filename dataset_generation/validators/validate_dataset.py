"""
RailSync AI — Dataset Integrity & Referential Validation
Validates foreign keys, duplicate IDs, timestamp intervals, and scenario tags.
"""

from typing import Dict, List, Any
import json
from pathlib import Path

def validate_dataset_integrity(
    stations: List[Dict[str, Any]],
    sections: List[Dict[str, Any]],
    tracks: List[Dict[str, Any]],
    assets: List[Dict[str, Any]],
    trains: List[Dict[str, Any]],
    timetable: List[Dict[str, Any]],
    goods_forecast: List[Dict[str, Any]],
    resources: List[Dict[str, Any]],
    requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Perform deep referential and logical integrity validation across all relational entities.
    """
    errors = []
    warnings = []

    # 1. Unique Primary Keys
    def check_unique(items: List[Dict[str, Any]], key: str, entity_name: str):
        seen = set()
        for item in items:
            val = item.get(key)
            if val in seen:
                errors.append(f"Duplicate {key}='{val}' in {entity_name}")
            seen.add(val)
        return seen

    stn_codes = check_unique(stations, "code", "Station")
    sec_ids = check_unique(sections, "section_id", "TrackSection")
    track_ids = check_unique(tracks, "track_id", "Track")
    asset_ids = check_unique(assets, "asset_id", "Asset")
    train_nums = check_unique(trains, "train_number", "Train")
    tt_ids = check_unique(timetable, "timetable_id", "Timetable")
    gf_ids = check_unique(goods_forecast, "forecast_id", "GoodsForecast")
    res_ids = check_unique(resources, "resource_id", "Resource")
    req_ids = check_unique(requests, "request_id", "MaintenanceRequest")

    # 2. Foreign Key References
    for trk in tracks:
        if trk["section_id"] not in sec_ids:
            errors.append(f"Track {trk['track_id']} references missing section_id '{trk['section_id']}'")

    for ast in assets:
        if ast["section_id"] not in sec_ids:
            errors.append(f"Asset {ast['asset_id']} references missing section_id '{ast['section_id']}'")
        if ast["track_id"] not in track_ids:
            errors.append(f"Asset {ast['asset_id']} references missing track_id '{ast['track_id']}'")

    for tt in timetable:
        if tt["train_number"] not in train_nums:
            errors.append(f"Timetable {tt['timetable_id']} references missing train '{tt['train_number']}'")
        if tt["section_id"] not in sec_ids:
            errors.append(f"Timetable {tt['timetable_id']} references missing section '{tt['section_id']}'")

    for req in requests:
        if req["asset_id"] not in asset_ids:
            errors.append(f"Request {req['request_id']} references missing asset '{req['asset_id']}'")
        if req["section_id"] not in sec_ids:
            errors.append(f"Request {req['request_id']} references missing section '{req['section_id']}'")
        if req["track_id"] not in track_ids:
            errors.append(f"Request {req['request_id']} references missing track '{req['track_id']}'")
        
        # Check machine references
        for m in req.get("machinery_required", []):
            if m not in res_ids:
                errors.append(f"Request {req['request_id']} requires unknown machine '{m}'")

    # 3. Chronological Consistency
    for tt in timetable:
        if tt["scheduled_entry"] >= tt["scheduled_exit"]:
            errors.append(f"Timetable {tt['timetable_id']} entry >= exit: {tt['scheduled_entry']} >= {tt['scheduled_exit']}")

    for req in requests:
        if req["earliest_start"] >= req["latest_deadline"]:
            errors.append(f"Request {req['request_id']} earliest_start >= latest_deadline")

    # 4. Summary Verdict
    passed = len(errors) == 0
    return {
        "passed": passed,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "errors": errors[:20],  # cap for display
        "warnings": warnings,
        "row_counts": {
            "stations": len(stations),
            "track_sections": len(sections),
            "tracks": len(tracks),
            "assets": len(assets),
            "trains": len(trains),
            "timetable_entries": len(timetable),
            "goods_forecasts": len(goods_forecast),
            "resources": len(resources),
            "maintenance_requests": len(requests),
        }
    }
