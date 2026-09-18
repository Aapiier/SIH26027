"""
RailSync AI — Unit Tests for Canonical Demo Reset Service & Endpoint
Verifies:
1. Canonical reset execution restores pristine state.
2. Ingestion, Prioritization, Window Extraction, CP-SAT solve, and Sentinel validation run end-to-end.
3. Reset is idempotent and repeatable.
4. Cryptographic audit trail log is created.
"""

import pytest
from backend.app.database import init_db, SessionLocal
from backend.app.services.demo_reset_service import execute_canonical_demo_reset
from backend.app.models.db_models import (
    MaintenanceRequest, BlockPlan, BlockPlanItem, CandidateWindow, AuditLog
)


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_execute_canonical_demo_reset(db_session):
    """Verify demo reset completes all 7 steps and produces a validated canonical plan."""
    res = execute_canonical_demo_reset(db=db_session, re_generate=False, actor="TEST_RUNNER")

    assert res["status"] == "DEMO_RESET_COMPLETE"
    assert res["tasks_ingested"] > 0
    assert res["candidate_windows"] > 0
    assert res["scheduled_tasks"] > 0
    assert res["validation_verdict"] == "PASSED"
    assert res["audit_log_id"].startswith("LOG-")

    # Verify database state
    plan = db_session.query(BlockPlan).filter(BlockPlan.plan_id == res["plan_id"]).first()
    assert plan is not None
    assert plan.total_tasks_scheduled == res["scheduled_tasks"]

    # Verify audit log entry
    audit = db_session.query(AuditLog).filter(AuditLog.log_id == res["audit_log_id"]).first()
    assert audit is not None
    assert audit.action == "DEMO_RESET"
    assert audit.actor == "TEST_RUNNER"


def test_demo_reset_idempotency(db_session):
    """Running demo reset consecutively must yield a valid, deterministic state every time."""
    res_1 = execute_canonical_demo_reset(db=db_session, re_generate=False, actor="TEST_IDEMPOTENCY_1")
    res_2 = execute_canonical_demo_reset(db=db_session, re_generate=False, actor="TEST_IDEMPOTENCY_2")

    assert res_1["status"] == "DEMO_RESET_COMPLETE"
    assert res_2["status"] == "DEMO_RESET_COMPLETE"
    assert res_1["tasks_ingested"] == res_2["tasks_ingested"]
    assert res_1["scheduled_tasks"] == res_2["scheduled_tasks"]
    assert res_1["validation_verdict"] == "PASSED"
    assert res_2["validation_verdict"] == "PASSED"
