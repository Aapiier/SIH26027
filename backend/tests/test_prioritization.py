"""
Tests for Two-Tier AI & Deterministic Prioritization Engine
"""

import pytest
from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.prioritization import run_prioritization_pipeline
from backend.app.models.db_models import MaintenanceRequest


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_prioritization_pipeline(db_session):
    results = run_prioritization_pipeline(db_session)
    assert len(results) > 0

    # Verify hard safety rule for Emergency defects
    emergency_tasks = [r for r in results if r["severity"] == "EMERGENCY"]
    for t in emergency_tasks:
        assert t["ai_priority_score"] >= 95.0
        assert t["ai_urgency_level"] == "CRITICAL_EMERGENCY"

    # Verify all tasks have scores and attribution
    for t in results:
        assert 0.0 <= t["ai_priority_score"] <= 100.0
        assert 0.0 <= t["ai_risk_score"] <= 1.0
        assert "feature_attribution" in t
