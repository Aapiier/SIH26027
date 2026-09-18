"""
Tests for Optimization Benchmarking (Greedy Baseline vs CP-SAT)
"""

import pytest
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.optimization_benchmark import run_optimization_benchmark


@pytest.fixture(scope="module")
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_optimization_benchmark_execution(db: Session):
    """Verify benchmark runs cleanly and returns complete side-by-side comparison metrics."""
    res = run_optimization_benchmark(db)

    assert res["status"] == "SUCCESS"
    assert "benchmark_summary" in res
    assert "comparison_table" in res
    assert "greedy_details" in res
    assert "cpsat_details" in res

    comp = res["comparison_table"]
    assert "scheduled_tasks" in comp
    assert "block_possession_hours_saved" in comp
    assert "active_bundles_count" in comp
    assert "runtime_seconds" in comp

    # Verify CP-SAT shadow bundling savings >= 0
    assert comp["block_possession_hours_saved"]["cpsat_optimizer"] >= 0.0
