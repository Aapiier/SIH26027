"""
Tests for Data Ingestion & Data Quality Gates
"""

import pytest
from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.ingestion import ingest_all_data
from backend.app.models.db_models import Station, MaintenanceRequest, Timetable
from dataset_generation.config import DEFAULT_OUTPUT_DIR


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_ingestion_counts(db_session):
    summary = ingest_all_data(DEFAULT_OUTPUT_DIR, db=db_session)
    assert summary["stations"] == 8
    assert summary["track_sections"] == 7
    assert summary["maintenance_requests_valid"] > 0
    assert summary["timetable"] > 1000

    # Verify entities in DB
    stns = db_session.query(Station).count()
    assert stns == 8

    reqs = db_session.query(MaintenanceRequest).count()
    assert reqs >= 80
