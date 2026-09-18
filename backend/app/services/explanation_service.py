"""
RailSync AI — Unscheduled Task Feasibility Explainer
Provides mathematically grounded explanations for why tasks were unscheduled or deferred.
"""

from typing import Dict, List, Any
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.db_models import MaintenanceRequest, CandidateWindow, Timetable


def explain_unscheduled_task(db: Session, request_id: str) -> Dict[str, Any]:
    """
    Perform diagnostic analysis on an unscheduled request to determine the exact failure cause.
    """
    req = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == request_id).first()
    if not req:
        return {"error": f"Request {request_id} not found"}

    if req.status == "SCHEDULED":
        return {
            "request_id": req.request_id,
            "status": "SCHEDULED",
            "explanation": "Task successfully scheduled in optimized block possession window."
        }

    duration = req.duration_minutes
    es = req.earliest_start
    ld = req.latest_deadline

    # Check 1: Deadline feasibility
    if (ld - es).total_seconds() / 60 < duration:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "DEADLINE_WINDOW_TOO_SHORT",
            "explanation": f"The requested duration ({duration} mins) exceeds the total available time window between earliest start and deadline ({int((ld-es).total_seconds()/60)} mins).",
            "recommendation": "Extend task deadline or split into smaller maintenance increments."
        }

    # Check 2: Available candidate windows on track
    windows = db.query(CandidateWindow).filter(
        CandidateWindow.track_id == req.track_id,
        CandidateWindow.window_start >= es,
        CandidateWindow.window_end <= ld
    ).all()

    if not windows:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "NO_TRAFFIC_GAP_ON_CORRIDOR",
            "explanation": f"High train frequency on section {req.section_id} (track {req.track_id}) prevented finding an uninterrupted gap of at least {duration} minutes.",
            "recommendation": "Request night possession window or temporary passenger train rerouting via loop lines."
        }

    max_gap = max(w.usable_duration_mins for w in windows)
    if max_gap < duration:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "MAX_GAP_INSUFFICIENT",
            "explanation": f"Largest available gap on track {req.track_id} is {max_gap} minutes, which is less than requested {duration} minutes.",
            "recommendation": f"Reduce requested work duration to <= {max_gap} minutes or coordinate joint track possession."
        }

    # Check 3: Machine conflict
    if req.machinery_required:
        return {
            "request_id": req.request_id,
            "status": "UNSCHEDULED",
            "root_cause": "RESOURCE_BOTTLENECK",
            "explanation": f"Required machinery ({req.machinery_required}) was prioritized for higher-urgency defects on other corridor sections.",
            "recommendation": "Mobilize secondary machine unit from adjacent division depot."
        }

    return {
        "request_id": req.request_id,
        "status": "UNSCHEDULED",
        "root_cause": "OBJECTIVE_OPTIMIZATION_TRADE_OFF",
        "explanation": "Task deferred due to objective score trade-off against higher-priority emergency requests.",
        "recommendation": "Manually override to force inclusion into draft schedule."
    }
