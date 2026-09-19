"""
RailSync AI — Task Bundling & Multi-Department Synchronization Engine
Evaluates spatial, temporal, machinery, and electrical (TRD) compatibility to bundle maintenance requests.
"""

from typing import List, Dict, Any, Tuple
from itertools import combinations
from datetime import datetime


def are_tasks_compatible(req_a: Dict[str, Any], req_b: Dict[str, Any]) -> bool:
    """
    Check if two maintenance requests can be bundled into a shared possession window.
    """
    # 1. Geographic compatibility: same section and track
    if req_a.get("section_id") != req_b.get("section_id"):
        return False
    if req_a.get("track_id") != req_b.get("track_id"):
        return False

    # 2. Machinery conflict: cannot demand the exact same machinery unit simultaneously
    mach_a = set(req_a.get("machinery_required") or [])
    mach_b = set(req_b.get("machinery_required") or [])
    if mach_a & mach_b:
        return False

    # 3. Temporal compatibility: overlapping deadline window with sufficient duration
    es_a = req_a.get("earliest_start")
    ld_a = req_a.get("latest_deadline")
    es_b = req_b.get("earliest_start")
    ld_b = req_b.get("latest_deadline")

    if isinstance(es_a, str): es_a = datetime.fromisoformat(es_a)
    if isinstance(ld_a, str): ld_a = datetime.fromisoformat(ld_a)
    if isinstance(es_b, str): es_b = datetime.fromisoformat(es_b)
    if isinstance(ld_b, str): ld_b = datetime.fromisoformat(ld_b)

    dur_a = req_a.get("duration_minutes", 60)
    dur_b = req_b.get("duration_minutes", 60)
    bundled_dur = max(dur_a, dur_b)

    # Windows must overlap and allow the full bundled duration
    common_start = max(es_a, es_b)
    common_end = min(ld_a, ld_b)
    if (common_end - common_start).total_seconds() / 60 < bundled_dur:
        return False

    return True


def generate_bundle_justification(bundled_requests: List[Dict[str, Any]]) -> str:
    """
    Generate human-readable justification explaining why multi-department tasks were bundled.
    """
    departments = list(set(r.get("department") for r in bundled_requests))
    dept_set = set(departments)

    if {"ENGINEERING", "SIGNAL_TELECOM", "TRD"}.issubset(dept_set):
        return "Tri-Department Integrated Mega Block: Synchronized P-Way track packing, S&T point machine overhaul, and 25kV OHE catenary adjustment under unified power and traffic block."
    elif {"ENGINEERING", "TRD"}.issubset(dept_set):
        return "Coordinated P-Way Track and 25kV Traction Window under joint track possession and electrical power isolation."
    elif {"ENGINEERING", "SIGNAL_TELECOM"}.issubset(dept_set):
        return "Joint Permanent Way & Signalling Corridor Block with synchronized track circuit & mechanical protection."
    elif {"SIGNAL_TELECOM", "TRD"}.issubset(dept_set):
        return "Combined S&T and Overhead Traction Maintenance under a common traffic and power block."
    else:
        return f"Synchronized Departmental Block: Bundled {len(bundled_requests)} compatible activities on the same track."


def group_compatible_tasks(requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identify potential candidate bundles from pending maintenance requests.
    """
    bundles = []
    bundle_id_counter = 1

    # Group by (section_id, track_id)
    by_track: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    for r in requests:
        key = (r.get("section_id"), r.get("track_id"))
        by_track.setdefault(key, []).append(r)

    for (sec_id, track_id), group in by_track.items():
        if len(group) < 2:
            continue

        # Check pairs and triplets
        for size in range(2, min(5, len(group) + 1)):
            for combo in combinations(group, size):
                if all(are_tasks_compatible(a, b) for a, b in combinations(combo, 2)):
                    req_list = list(combo)
                    separate_duration = sum(r.get("duration_minutes", 60) for r in req_list)
                    bundled_duration = max(r.get("duration_minutes", 60) for r in req_list)
                    saved_minutes = max(0, separate_duration - bundled_duration)

                    bundles.append({
                        "bundle_id": f"BUNDLE-{bundle_id_counter:03d}",
                        "section_id": sec_id,
                        "track_id": track_id,
                        "requests": req_list,
                        "request_ids": [r.get("request_id") for r in req_list],
                        "departments": list(set(r.get("department") for r in req_list)),
                        "separate_duration_mins": separate_duration,
                        "bundled_duration_mins": bundled_duration,
                        "saved_minutes": saved_minutes,
                        "justification": generate_bundle_justification(req_list),
                    })
                    bundle_id_counter += 1

    return bundles
