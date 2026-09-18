import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_full_frontend_e2e_flow():
    # 1. Check Metrics & Model Version Displayed on Header
    m_resp = client.get("/api/v1/metrics/dashboard")
    assert m_resp.status_code == 200
    metrics = m_resp.json()
    assert "HistGradientBoosting" in metrics["model_version"]
    assert "3.0" in metrics["model_version"]
    assert metrics["corridor"] == "Bilaspur - Nagpur Corridor (BSP-NGP)"

    # 2. Prioritize Requests (Maintenance view)
    p_resp = client.post("/api/v1/tasks/prioritize")
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["status"] == "SUCCESS"
    assert p_data["prioritized_count"] > 0

    # 3. Tasks list has AI risk and priority scores populated
    tasks_resp = client.get("/api/v1/tasks")
    assert tasks_resp.status_code == 200
    tasks = tasks_resp.json()
    assert len(tasks) > 0
    sample_task = tasks[0]
    assert "ai_risk_score" in sample_task
    assert "ai_priority_score" in sample_task
    assert sample_task["ai_risk_score"] is not None

    # 4. AI Explanation Panel (Contributing factors & Model Metadata)
    exp_resp = client.get(f"/api/v1/tasks/{sample_task['request_id']}/explain")
    assert exp_resp.status_code == 200
    exp = exp_resp.json()
    ai_ctx = exp.get("ai_risk_context", {})
    assert ai_ctx["model_name"] == "HistGradientBoosting GBDT"
    assert "3.0" in ai_ctx["model_version"]
    assert ai_ctx["prediction_target"] == "P(failure_within_14d)"
    assert 0.0 <= ai_ctx["predicted_failure_risk"] <= 1.0
    assert len(ai_ctx["feature_attributions"]) > 0

    # 5. Generate Optimized Plan (Block Plan view)
    plan_resp = client.post("/api/v1/optimization/solve?horizon=WEEKLY")
    assert plan_resp.status_code == 200
    plan = plan_resp.json()
    assert plan["status"] == "SUCCESS"
    
    # Get latest schedule
    sched_resp = client.get("/api/v1/schedules/latest")
    assert sched_resp.status_code == 200
    sched = sched_resp.json()
    assert len(sched["items"]) > 0
    plan_id = sched["plan_id"]

    # 6. Opportunity Evaluation ("Why this Window?")
    first_item_id = sched["items"][0]["item_id"]
    opp_resp = client.get(f"/api/v1/opportunity/item/{first_item_id}")
    assert opp_resp.status_code == 200
    opp = opp_resp.json()
    assert 0 <= opp["score"] <= 100
    assert "breakdown" in opp
    assert len(opp["reasons"]) > 0

    # 7. Validate Plan (Sentinel Safety Validator)
    val_resp = client.post(f"/api/v1/schedules/{plan_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    verdict = val_data["validation_verdict"]
    assert verdict["overall_verdict"] == "PASSED"
    assert verdict["conflicts_detected"] == 0
    assert len(verdict["verification_hash"]) == 64  # SHA-256
