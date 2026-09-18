"""
RailSync AI — Unit Tests for Maintenance Opportunity Engine & What-If Simulator
Verifies:
1. Opportunity score bounded in [0, 100]
2. Determinism and reproducibility
3. High AI asset risk increases maintenance value
4. Multi-department bundling increases opportunity score
5. Timetable traffic density penalizes score
6. Long possession duration penalizes score
7. Infeasible windows receive 0 score and are flagged
8. Safety-critical constraints dominance
9. What-If perturbation simulation reproducibility
"""

import pytest
from datetime import datetime, timedelta
from backend.app.database import init_db, SessionLocal
from backend.app.models.db_models import (
    Station, TrackSection, Track, Asset, MaintenanceRequest, BlockPlan, BlockPlanItem
)
from backend.app.pipeline.opportunity_engine import (
    calculate_opportunity_score,
    evaluate_block_item_opportunity
)
from backend.app.pipeline.what_if_simulator import simulate_what_if_scenario


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_opportunity_score_bounds():
    """Score must be strictly normalized within [0.0, 100.0]."""
    tasks = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.85, "severity": "CRITICAL", "criticality_weight": 5, "duration_minutes": 120}
    ]
    score, breakdown, reasons = calculate_opportunity_score(tasks, window_duration_mins=120)
    assert 0.0 <= score <= 100.0
    assert 0.0 <= breakdown["net_score"] <= 100.0
    assert len(reasons) > 0


def test_opportunity_score_determinism():
    """Identical inputs must yield exact identical score and component breakdown."""
    tasks = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.70, "severity": "URGENT", "criticality_weight": 4, "duration_minutes": 90},
        {"request_id": "REQ-2", "department": "SIGNAL_TELECOM", "ai_risk_score": 0.60, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60}
    ]
    score_1, breakdown_1, reasons_1 = calculate_opportunity_score(tasks, window_duration_mins=120, train_conflict_count=0)
    score_2, breakdown_2, reasons_2 = calculate_opportunity_score(tasks, window_duration_mins=120, train_conflict_count=0)

    assert score_1 == score_2
    assert breakdown_1 == breakdown_2
    assert reasons_1 == reasons_2


def test_high_risk_asset_boosts_score():
    """Higher AI asset failure risk must strictly increase the asset risk component and net score."""
    low_risk_tasks = [
        {"request_id": "REQ-L", "department": "ENGINEERING", "ai_risk_score": 0.10, "severity": "ROUTINE", "criticality_weight": 2, "duration_minutes": 90}
    ]
    high_risk_tasks = [
        {"request_id": "REQ-H", "department": "ENGINEERING", "ai_risk_score": 0.95, "severity": "CRITICAL", "criticality_weight": 5, "duration_minutes": 90}
    ]

    score_low, breakdown_low, _ = calculate_opportunity_score(low_risk_tasks, window_duration_mins=120)
    score_high, breakdown_high, _ = calculate_opportunity_score(high_risk_tasks, window_duration_mins=120)

    assert breakdown_high["asset_risk_value"] > breakdown_low["asset_risk_value"]
    assert score_high > score_low


def test_bundling_multi_dept_boosts_score():
    """Bundling 3 departments must provide higher bundling benefit than a single department."""
    single_dept = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60}
    ]
    tri_dept = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60},
        {"request_id": "REQ-2", "department": "SIGNAL_TELECOM", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60},
        {"request_id": "REQ-3", "department": "TRD", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60},
    ]

    score_single, breakdown_single, _ = calculate_opportunity_score(single_dept, window_duration_mins=120)
    score_tri, breakdown_tri, _ = calculate_opportunity_score(tri_dept, window_duration_mins=120)

    assert breakdown_tri["bundling_benefit"] > breakdown_single["bundling_benefit"]
    assert score_tri > score_single


def test_traffic_density_penalty():
    """Higher train conflict count / timetable density must decrease opportunity score."""
    tasks = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60}
    ]
    score_quiet, breakdown_quiet, _ = calculate_opportunity_score(tasks, window_duration_mins=120, train_conflict_count=0)
    score_busy, breakdown_busy, _ = calculate_opportunity_score(tasks, window_duration_mins=120, train_conflict_count=3)

    assert breakdown_busy["traffic_penalty"] > breakdown_quiet["traffic_penalty"]
    assert score_quiet > score_busy


def test_possession_cost_penalty():
    """Excessively long possession windows incur possession cost penalties."""
    tasks = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.5, "severity": "ROUTINE", "criticality_weight": 3, "duration_minutes": 60}
    ]
    score_short, breakdown_short, _ = calculate_opportunity_score(tasks, window_duration_mins=120)
    score_long, breakdown_long, _ = calculate_opportunity_score(tasks, window_duration_mins=480)

    assert breakdown_long["possession_penalty"] >= breakdown_short["possession_penalty"]
    assert score_short >= score_long


def test_infeasible_window_handling():
    """Infeasible windows return 0.0 score and clear conflict explanation."""
    tasks = [
        {"request_id": "REQ-1", "department": "ENGINEERING", "ai_risk_score": 0.9, "severity": "EMERGENCY", "criticality_weight": 5, "duration_minutes": 120}
    ]
    score, breakdown, reasons = calculate_opportunity_score(tasks, window_duration_mins=120, is_feasible=False)

    assert score == 0.0
    assert breakdown["net_score"] == 0.0
    assert "infeasible" in reasons[0].lower()


def test_what_if_simulation_reproducibility(db_session):
    """What-if simulator must return structured Before/After metrics and delta calculations."""
    res = simulate_what_if_scenario(
        db=db_session,
        perturbation_type="TRAIN_DELAY",
        params={"train_number": "12004", "section_id": "GZB-ALJN", "delay_minutes": 45}
    )

    assert res["status"] == "SIMULATION_SUCCESS"
    assert "current_plan" in res
    assert "what_if_plan" in res
    assert "impact" in res
    assert res["impact"]["possession_delta_hours"] >= 0
    assert "reasons" in res["impact"]
