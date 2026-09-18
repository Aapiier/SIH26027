"""
Negative Tests for RailSync AI Independent Sentinel Validator
Constructs intentionally corrupted or invalid block plans to verify that the Sentinel catches:
1. Train occupancy clashes
2. Physical track-level overlaps
3. Window containment violations
4. Deadline violations
5. Machinery transit & collision violations
6. Bundle internal incompatibilities
"""

import uuid
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal, init_db
from backend.app.models.db_models import (
    BlockPlan, BlockPlanItem, Timetable, MaintenanceRequest, Resource, CandidateWindow
)
from backend.app.pipeline.validator import validate_plan_schedule


@pytest.fixture(scope="function")
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()


def test_validator_detects_train_occupancy_collision(db: Session):
    """Verify Sentinel flags block overlapping with a scheduled train on the same track."""
    plan_id = f"PLAN-NEG-TRAIN-{uuid.uuid4().hex[:8]}"
    tt = db.query(Timetable).first()
    assert tt is not None

    # Construct plan item overlapping the train
    item = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-001",
        plan_id=plan_id,
        section_id=tt.section_id,
        track_id=tt.track_id,
        scheduled_start=tt.scheduled_entry,
        scheduled_end=tt.scheduled_exit,
        duration_minutes=tt.transit_duration_mins,
        bundled_task_ids=["REQ-3001"],
        assigned_resource_ids=[],
        validation_status="PASSED",
    )
    plan = BlockPlan(
        plan_id=plan_id,
        horizon="WEEKLY",
        status="RECOMMENDED",
        content_hash="dummyhash",
    )
    db.add(plan)
    db.add(item)
    db.commit()

    res = validate_plan_schedule(db, plan_id)
    assert res["overall_verdict"] == "FAILED"
    assert res["conflicts_detected"] >= 1
    assert any("Train occupancy clash" in str(r["reasons"]) for r in res["details"])


def test_validator_detects_physical_track_overlap(db: Session):
    """Verify Sentinel flags two unbundled tasks simultaneously scheduled on the same track."""
    plan_id = f"PLAN-NEG-TRACK-{uuid.uuid4().hex[:8]}"
    t_start = datetime(2026, 10, 2, 10, 0, 0)
    t_end = datetime(2026, 10, 2, 12, 0, 0)

    item1 = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-A",
        plan_id=plan_id,
        section_id="NDLS-GZB",
        track_id="TRACK-NDLS-GZB-UP1",
        scheduled_start=t_start,
        scheduled_end=t_end,
        duration_minutes=120,
        bundled_task_ids=["REQ-3002"],
        assigned_resource_ids=[],
    )
    item2 = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-B",
        plan_id=plan_id,
        section_id="NDLS-GZB",
        track_id="TRACK-NDLS-GZB-UP1",
        scheduled_start=t_start + timedelta(minutes=30),
        scheduled_end=t_end + timedelta(minutes=30),
        duration_minutes=120,
        bundled_task_ids=["REQ-3003"],
        assigned_resource_ids=[],
    )
    plan = BlockPlan(
        plan_id=plan_id,
        horizon="WEEKLY",
        status="RECOMMENDED",
        content_hash="dummyhash2",
    )
    db.add(plan)
    db.add(item1)
    db.add(item2)
    db.commit()

    res = validate_plan_schedule(db, plan_id)
    assert res["overall_verdict"] == "FAILED"
    assert res["conflicts_detected"] >= 1
    assert any("Physical Track Overlap" in str(r["reasons"]) for r in res["details"])


def test_validator_detects_deadline_violation(db: Session):
    """Verify Sentinel flags task scheduled after its deadline."""
    plan_id = f"PLAN-NEG-DEADLINE-{uuid.uuid4().hex[:8]}"
    req = db.query(MaintenanceRequest).first()
    assert req is not None

    late_start = req.latest_deadline + timedelta(hours=2)
    late_end = late_start + timedelta(minutes=req.duration_minutes)

    item = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-001",
        plan_id=plan_id,
        section_id=req.section_id,
        track_id=req.track_id,
        scheduled_start=late_start,
        scheduled_end=late_end,
        duration_minutes=req.duration_minutes,
        bundled_task_ids=[req.request_id],
    )
    plan = BlockPlan(
        plan_id=plan_id,
        horizon="WEEKLY",
        status="RECOMMENDED",
        content_hash="dummyhash3",
    )
    db.add(plan)
    db.add(item)
    db.commit()

    res = validate_plan_schedule(db, plan_id)
    assert res["overall_verdict"] == "FAILED"
    assert any("deadline violated" in str(r["reasons"]) for r in res["details"])


def test_validator_detects_machinery_collision(db: Session):
    """Verify Sentinel flags identical machine unit assigned simultaneously to different sections."""
    plan_id = f"PLAN-NEG-MACH-{uuid.uuid4().hex[:8]}"
    t_start = datetime(2026, 10, 3, 2, 0, 0)
    t_end = datetime(2026, 10, 3, 4, 0, 0)

    item1 = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-1",
        plan_id=plan_id,
        section_id="NDLS-GZB",
        track_id="TRACK-NDLS-GZB-UP1",
        scheduled_start=t_start,
        scheduled_end=t_end,
        duration_minutes=120,
        bundled_task_ids=["REQ-3004"],
        assigned_resource_ids=["CSU-01"],
    )
    item2 = BlockPlanItem(
        item_id=f"{plan_id}-ITEM-2",
        plan_id=plan_id,
        section_id="CNB-PRYJ",
        track_id="TRACK-CNB-PRYJ-DN1",
        scheduled_start=t_start + timedelta(minutes=15),
        scheduled_end=t_end + timedelta(minutes=15),
        duration_minutes=120,
        bundled_task_ids=["REQ-3005"],
        assigned_resource_ids=["CSU-01"],  # Same machine unit on section 200km away
    )
    plan = BlockPlan(
        plan_id=plan_id,
        horizon="WEEKLY",
        status="RECOMMENDED",
        content_hash="dummyhash4",
    )
    db.add(plan)
    db.add(item1)
    db.add(item2)
    db.commit()

    res = validate_plan_schedule(db, plan_id)
    assert res["overall_verdict"] == "FAILED"
    assert any("Machinery collision" in str(r["reasons"]) for r in res["details"])
