"""
RailSync AI — Dataset Profiler & EDA Reporter
Computes statistical profiles, severity distributions, and traffic density metrics on generated datasets.
"""

from typing import Dict, List, Any
from collections import Counter

def generate_eda_profile(
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
    Generate rich EDA metrics for synthetic dataset validation.
    """
    # Department breakdown
    dept_counts = Counter(r["department"] for r in requests)
    
    # Severity breakdown
    severity_counts = Counter(r["severity"] for r in requests)

    # Section request density
    section_requests = Counter(r["section_id"] for r in requests)

    # Train types
    train_types = Counter(t["train_type"] for t in trains)

    # Machinery demands
    machines_demanded = Counter(
        m for r in requests for m in r.get("machinery_required", [])
    )

    # Timetable section density (average trains per section per day)
    tt_section_counts = Counter(t["section_id"] for t in timetable)

    return {
        "total_requests": len(requests),
        "department_distribution": dict(dept_counts),
        "severity_distribution": dict(severity_counts),
        "top_busy_sections_requests": dict(section_requests.most_common(5)),
        "train_type_distribution": dict(train_types),
        "machinery_utilization_demand": dict(machines_demanded),
        "timetable_density_per_section": dict(tt_section_counts),
        "power_blocks_required_count": sum(1 for r in requests if r.get("power_block_required")),
    }
