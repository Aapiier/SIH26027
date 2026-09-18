"""
Tests for Optimizer Edge Cases (No tasks, zero windows, exact fit gaps, tight contention)
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal, init_db
from backend.app.models.db_models import MaintenanceRequest, CandidateWindow
from backend.app.pipeline.optimizer import solve_maintenance_schedule


@pytest.fixture(scope="module")
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_optimizer_handles_empty_requests(db: Session):
    """Verify optimizer returns graceful NO_TASKS status when no requests are pending."""
    # Temporarily set all to COMPLETED
    reqs = db.query(MaintenanceRequest).all()
    old_statuses = {r.request_id: r.status for r in reqs}
    for r in reqs:
        r.status = "COMPLETED"
    db.commit()

    res = solve_maintenance_schedule(db)
    assert res["solver_status"] == "NO_TASKS"
    assert res["scheduled_tasks"] == 0

    # Restore statuses
    for r in reqs:
        r.status = old_statuses[r.request_id]
    db.commit()


def test_optimizer_handles_zero_candidate_windows(db: Session):
    """Verify optimizer schedules 0 tasks if candidate windows are completely wiped."""
    windows = db.query(CandidateWindow).all()
    win_backups = [w.__dict__.copy() for w in windows]
    for w in win_backups:
        w.pop("_sa_instance_state", None)

    # Delete all windows
    db.query(CandidateWindow).delete()
    db.commit()

    for r in db.query(MaintenanceRequest).all():
        r.status = "PENDING"
    db.commit()

    res = solve_maintenance_schedule(db)
    assert res["scheduled_tasks"] == 0
    assert res["unscheduled_tasks"] == len(db.query(MaintenanceRequest).all())

    # Restore windows
    for w in win_backups:
        db.add(CandidateWindow(**w))
    db.commit()
