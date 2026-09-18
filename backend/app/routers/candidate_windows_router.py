"""
RailSync AI — Candidate Windows Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import CandidateWindow
from backend.app.schemas.schemas import CandidateWindowSchema
from backend.app.pipeline.candidate_windows import extract_candidate_windows

router = APIRouter(prefix="/api/v1/windows", tags=["Candidate Windows"])


@router.post("/generate")
def generate_windows(min_gap_mins: int = Query(60), db: Session = Depends(get_db)):
    """Trigger timetable gap subtraction engine to find candidate shadow blocks."""
    windows = extract_candidate_windows(db, min_gap_minutes=min_gap_mins)
    return {"status": "SUCCESS", "windows_extracted": len(windows), "candidate_windows": windows}


@router.get("", response_model=List[CandidateWindowSchema])
def list_candidate_windows(
    section_id: Optional[str] = Query(None),
    track_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List extracted candidate shadow block windows."""
    query = db.query(CandidateWindow)
    if section_id:
        query = query.filter(CandidateWindow.section_id == section_id)
    if track_id:
        query = query.filter(CandidateWindow.track_id == track_id)
    return query.all()
