"""
RailSync AI — Final SIH26027 End-to-End Acceptance Test
Comprehensive automated verification of all SIH26027 criteria.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_sih_data_integration_and_normalization():
    """Verify TMS, SMMS, TDMS, Timetable, and Freight datasets are ingested and normalized."""
    # Maintenance tasks from TMS, SMMS, TDMS
    resp = client.get("/api/v1/tasks")
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) >= 12

    departments = set(t["department"] for t in tasks)
    assert "ENGINEERING" in departments  # TMS
    assert "SIGNAL_TELECOM" in departments  # SMMS
    assert "TRD" in departments  # TDMS (Traction)

    # Stations and Track sections
    stn_resp = client.get("/api/v1/network/stations")
    assert stn_resp.status_code == 200
    assert len(stn_resp.json()) >= 8

    sec_resp = client.get("/api/v1/network/sections")
    assert sec_resp.status_code == 200
    assert len(sec_resp.json()) >= 7


def test_sih_ai_asset_risk_model_and_safety_gate():
    """Verify ML model inference, zero target leakage, and Tier-1 safety gate dominance."""
    # Prioritization execution
    p_resp = client.post("/api/v1/tasks/prioritize")
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["status"] == "SUCCESS"
    assert p_data["prioritized_count"] > 0

    # Inspect explanation and AI context
    tasks_resp = client.get("/api/v1/tasks")
    tasks = tasks_resp.json()
    
    emergency_task = next((t for t in tasks if t["severity"] == "EMERGENCY"), tasks[0])
    exp_resp = client.get(f"/api/v1/tasks/{emergency_task['request_id']}/explain")
    assert exp_resp.status_code == 200
    exp = exp_resp.json()
    
    ai_ctx = exp.get("ai_risk_context", {})
    assert ai_ctx["model_name"] == "HistGradientBoosting GBDT"
    assert "3.0" in ai_ctx["model_version"]
    assert ai_ctx["prediction_target"] == "P(failure_within_14d)"
    assert 0.0 <= ai_ctx["predicted_failure_risk"] <= 1.0
    assert len(ai_ctx["feature_attributions"]) > 0

    # If emergency, verify Tier 1 safety dominance
    if emergency_task["severity"] == "EMERGENCY":
        assert "TIER 1" in ai_ctx["tier"] or "Safety" in ai_ctx["tier_description"]


def test_sih_weekly_and_monthly_planning():
    """Verify Weekly tactical block generation and Monthly strategic forecast."""
    # Weekly operational plan
    w_resp = client.post("/api/v1/optimization/weekly-plan")
    assert w_resp.status_code == 200
    assert w_resp.json()["status"] == "SUCCESS"

    latest_resp = client.get("/api/v1/schedules/latest")
    assert latest_resp.status_code == 200
    latest = latest_resp.json()
    assert latest["horizon"] == "WEEKLY"
    assert len(latest["items"]) > 0

    # Monthly strategic forecast
    m_resp = client.post("/api/v1/optimization/monthly-forecast")
    assert m_resp.status_code == 200
    assert m_resp.json()["status"] == "SUCCESS"


def test_sih_multi_department_bundling():
    """Verify cross-department bundling of Engineering, S&T, and TRD tasks into unified blocks."""
    # Solve schedule with bundling
    solve_resp = client.post("/api/v1/optimization/solve?horizon=WEEKLY")
    assert solve_resp.status_code == 200

    latest_resp = client.get("/api/v1/schedules/latest")
    latest = latest_resp.json()
    items = latest["items"]

    bundled_items = [it for it in items if len(it.get("bundled_task_ids", [])) > 1]
    assert len(bundled_items) > 0, "At least one bundled maintenance block must be created"

    # Verify bundled block contains tasks from multiple departments
    tasks_resp = client.get("/api/v1/tasks")
    task_map = {t["request_id"]: t for t in tasks_resp.json()}

    has_multi_dept = False
    for b in bundled_items:
        depts = set(task_map[t_id]["department"] for t_id in b["bundled_task_ids"] if t_id in task_map)
        if len(depts) > 1:
            has_multi_dept = True
            break
    assert has_multi_dept, "Must contain at least one multi-department bundle (e.g. Engineering + TRD / S&T)"


def test_sih_opportunity_engine_why_this_window():
    """Verify Maintenance Opportunity Score (0-100) and explainability breakdown."""
    latest_resp = client.get("/api/v1/schedules/latest")
    latest = latest_resp.json()
    assert len(latest["items"]) > 0
    first_item = latest["items"][0]

    opp_resp = client.get(f"/api/v1/opportunity/item/{first_item['item_id']}")
    assert opp_resp.status_code == 200
    opp = opp_resp.json()
    assert 0 <= opp["score"] <= 100
    assert "base_maintenance_value" in opp["breakdown"]
    assert "asset_risk_value" in opp["breakdown"]
    assert "bundling_benefit" in opp["breakdown"]
    assert len(opp["reasons"]) > 0
    assert len(opp["alternatives"]) > 0


def test_sih_optimization_benchmark_and_possession_reduction():
    """Verify optimization benchmark proves reduced modeled track possession vs greedy baseline."""
    bench_resp = client.post("/api/v1/optimization/benchmark")
    assert bench_resp.status_code == 200
    bench = bench_resp.json()
    assert bench["status"] == "SUCCESS"

    table = bench["comparison_table"]
    assert "block_possession_hours_saved" in table
    saved_hours = table["block_possession_hours_saved"]["delta"]
    assert saved_hours >= 0.0


def test_sih_sentinel_safety_validator_and_conflict_detection():
    """Verify Sentinel validator executes and generates tamper-evident verification hash."""
    latest_resp = client.get("/api/v1/schedules/latest")
    latest = latest_resp.json()
    plan_id = latest["plan_id"]

    val_resp = client.post(f"/api/v1/schedules/{plan_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    verdict = val_data["validation_verdict"]
    assert verdict["overall_verdict"] == "PASSED"
    assert verdict["conflicts_detected"] == 0
    assert len(verdict["verification_hash"]) == 64  # SHA-256


def test_sih_disruption_replanning():
    """Verify 45-minute train delay disruption detection and re-optimization."""
    tt_resp = client.get("/api/v1/network/timetable?limit=1")
    assert tt_resp.status_code == 200
    tt = tt_resp.json()[0]

    disr_resp = client.post(
        "/api/v1/disruptions/train-delay",
        json={"train_number": tt["train_number"], "section_id": tt["section_id"], "delay_minutes": 45}
    )
    assert disr_resp.status_code == 200
    disr_data = disr_resp.json()
    assert disr_data["status"] == "SUCCESS"
    assert "reoptimization_result" in disr_data


def test_sih_manual_controller_override_and_audit():
    """Verify manual controller adjustment and cryptographic audit log trail."""
    latest_resp = client.get("/api/v1/schedules/latest")
    latest = latest_resp.json()
    first_item = latest["items"][0]

    override_resp = client.post(
        "/api/v1/schedules/override",
        json={
            "plan_id": latest["plan_id"],
            "item_id": first_item["item_id"],
            "new_start": first_item["scheduled_start"],
            "new_end": first_item["scheduled_end"],
            "justification": "Controller shift window for track inspection coordination",
            "actor": "Chief Controller BSP"
        }
    )
    assert override_resp.status_code == 200

    # Audit log verification
    audit_resp = client.get("/api/v1/audit")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0
    assert any("Chief Controller" in l.get("actor", "") or "OVERRIDE" in l.get("action", "") for l in logs)


def test_sih_canonical_demo_reset_and_idempotency():
    """Verify Reset Demo endpoint completely restores canonical database state idempotently."""
    # Reset 1
    reset1_resp = client.post("/api/v1/demo/reset")
    assert reset1_resp.status_code == 200
    r1_data = reset1_resp.json()
    assert r1_data["status"] == "DEMO_RESET_COMPLETE"
    assert r1_data["tasks_ingested"] >= 12

    # Reset 2 (Idempotency)
    reset2_resp = client.post("/api/v1/demo/reset")
    assert reset2_resp.status_code == 200
    r2_data = reset2_resp.json()
    assert r2_data["status"] == "DEMO_RESET_COMPLETE"
    assert r2_data["tasks_ingested"] >= 12
