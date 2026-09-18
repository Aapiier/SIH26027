"""
Tests for Candidate Shadow Block Window Extraction
"""

import pytest
from backend.app.database import SessionLocal, init_db
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.models.db_models import CandidateWindow


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_candidate_window_extraction(db_session):
    windows = extract_candidate_windows(db_session, min_gap_minutes=60)
    assert len(windows) > 0

    # Verify all windows meet minimum gap duration
    for w in windows:
        assert w["usable_duration_mins"] >= 60
        assert "track_id" in w
        assert "section_id" in w

    # Verify windows in database
    db_count = db_session.query(CandidateWindow).count()
    assert db_count == len(windows)
