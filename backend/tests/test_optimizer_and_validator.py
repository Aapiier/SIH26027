"""
Tests for Google OR-Tools CP-SAT Optimizer and Independent Sentinel Validator
"""

import pytest
from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.models.db_models import BlockPlan, BlockPlanItem


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_optimizer_and_validator_flow(db_session):
    # 1. Ensure windows exist
    extract_candidate_windows(db_session, min_gap_minutes=60)

    # 2. Run CP-SAT solver
    res = solve_maintenance_schedule(db_session, horizon="WEEKLY", max_solver_time_s=10)
    assert res.get("solver_status") in ("OPTIMAL", "FEASIBLE") or "plan_id" in res
    assert res["scheduled_tasks"] > 0
    assert "content_hash" in res

    plan_id = res["plan_id"]

    # 3. Verify independent Sentinel validation
    val_res = validate_plan_schedule(db_session, plan_id)
    assert val_res["overall_verdict"] in ("PASSED", "FAILED")
    assert val_res["total_items_validated"] > 0
    assert "verification_hash" in val_res
