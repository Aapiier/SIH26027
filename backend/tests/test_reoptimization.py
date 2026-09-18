"""
Tests for Disruption & Event-Driven Reoptimization
"""

import pytest
from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.reoptimizer import handle_train_delay_disruption
from backend.app.models.db_models import Train, Timetable


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_train_delay_reoptimization(db_session):
    first_tt = db_session.query(Timetable).first()
    assert first_tt is not None

    res = handle_train_delay_disruption(
        db=db_session,
        train_number=first_tt.train_number,
        section_id=first_tt.section_id,
        delay_minutes=30,
        actor="CHIEF_CONTROLLER_TEST"
    )

    assert res["status"] == "REOPTIMIZATION_COMPLETE"
    assert "new_plan_id" in res
    assert res["validation_verdict"] in ("PASSED", "FAILED")
