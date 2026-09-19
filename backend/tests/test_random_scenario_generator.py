"""
RailSync AI — Random Scenario Generator Test Suite
Verifies:
1. Retrieval of available scenario presets.
2. End-to-end execution of randomized simulation generation across different presets.
3. Data persistence, AI ML risk prioritization, CP-SAT optimization, and Sentinel validation.
4. Reproducibility using fixed seeds.
5. Idempotent Reset Demo restoration after randomized scenario execution.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.db_models import (
    MaintenanceRequest, Train, Timetable, GoodsForecast,
    CandidateWindow, BlockPlan, AuditLog
)
from backend.app.services.demo_reset_service import execute_canonical_demo_reset

client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_canonical_baseline():
    """Ensure baseline is restored before and after tests."""
    db = SessionLocal()
    try:
        execute_canonical_demo_reset(db=db)
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        execute_canonical_demo_reset(db=db)
    finally:
        db.close()


def test_scenario_presets_endpoint():
    """Verify listing of all simulation presets."""
    res = client.get("/api/v1/demo/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 7
    preset_ids = [p["id"] for p in presets]
    assert "BALANCED_OPERATIONS" in preset_ids
    assert "HEAVY_MAINTENANCE" in preset_ids
    assert "FREIGHT_CONGESTION" in preset_ids
    assert "HIGH_RISK_ASSETS" in preset_ids
    assert "MAJOR_DISRUPTION" in preset_ids
    assert "RESOURCE_SHORTAGE" in preset_ids
    assert "MULTI_DEPARTMENT_OPPORTUNITY" in preset_ids


def test_generate_scenario_balanced_operations():
    """Verify balanced operations generation and complete pipeline execution."""
    res = client.post("/api/v1/demo/generate-scenario?preset=BALANCED_OPERATIONS&seed=55512")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SCENARIO_GENERATED"
    assert data["seed"] == 55512
    assert data["preset"] == "BALANCED_OPERATIONS"
    assert data["trains_count"] > 0
    assert data["timetable_count"] > 0
    assert data["maintenance_requests_count"] > 0
    assert data["candidate_windows_count"] > 0
    assert data["scheduled_tasks_count"] > 0
    assert data["validation_verdict"] == "PASSED"

    # Verify DB persistence
    db = SessionLocal()
    try:
        req_count = db.query(MaintenanceRequest).count()
        assert req_count == data["maintenance_requests_count"]

        train_count = db.query(Train).count()
        assert train_count == data["trains_count"]

        plan = db.query(BlockPlan).first()
        assert plan is not None
        assert plan.total_tasks_scheduled == data["scheduled_tasks_count"]

        # Verify Audit Log
        audit = db.query(AuditLog).filter(AuditLog.action == "RANDOM_SCENARIO_GENERATED").first()
        assert audit is not None
        assert "55512" in audit.justification
    finally:
        db.close()


def test_generate_scenario_high_risk_and_multi_department():
    """Verify High-Risk Assets and Multi-Department Opportunity presets."""
    # 1. High Risk Assets Preset
    res_hr = client.post("/api/v1/demo/generate-scenario?preset=HIGH_RISK_ASSETS&seed=77701")
    assert res_hr.status_code == 200
    data_hr = res_hr.json()
    assert data_hr["high_risk_assets_count"] > 0
    assert data_hr["validation_verdict"] == "PASSED"

    # 2. Multi-Department Opportunity Preset
    res_md = client.post("/api/v1/demo/generate-scenario?preset=MULTI_DEPARTMENT_OPPORTUNITY&seed=88802")
    assert res_md.status_code == 200
    data_md = res_md.json()
    assert data_md["active_bundles_count"] > 0
    assert data_md["possession_hours_saved"] > 0.0


def test_scenario_reproducibility_with_seed():
    """Verify that identical seeds produce deterministic relational scenarios."""
    res1 = client.post("/api/v1/demo/generate-scenario?preset=BALANCED_OPERATIONS&seed=42424")
    assert res1.status_code == 200
    data1 = res1.json()

    res2 = client.post("/api/v1/demo/generate-scenario?preset=BALANCED_OPERATIONS&seed=42424")
    assert res2.status_code == 200
    data2 = res2.json()

    assert data1["trains_count"] == data2["trains_count"]
    assert data1["timetable_count"] == data2["timetable_count"]
    assert data1["maintenance_requests_count"] == data2["maintenance_requests_count"]
    assert data1["scheduled_tasks_count"] == data2["scheduled_tasks_count"]
    assert data1["active_bundles_count"] == data2["active_bundles_count"]


def test_repeated_generate_and_reset_demo():
    """Verify repeated scenario generations and that Reset Demo restores canonical state."""
    # Generate 3 sequential random scenarios
    for i in range(3):
        res = client.post(f"/api/v1/demo/generate-scenario?preset=BALANCED_OPERATIONS&seed={1000 + i}")
        assert res.status_code == 200
        assert res.json()["validation_verdict"] == "PASSED"

    # Reset Demo
    res_reset = client.post("/api/v1/demo/reset?re_generate=false")
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["status"] == "DEMO_RESET_COMPLETE"
    assert reset_data["validation_verdict"] == "PASSED"
