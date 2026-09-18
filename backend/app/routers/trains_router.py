"""
RailSync AI — Trains & Timetables API Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import Train, Timetable, GoodsForecast, Station, TrackSection
from backend.app.schemas.schemas import TrainSchema, TimetableSchema, StationSchema, TrackSectionSchema

router = APIRouter(prefix="/api/v1/network", tags=["Network & Trains"])


@router.get("/stations", response_model=List[StationSchema])
def list_stations(db: Session = Depends(get_db)):
    """List all corridor stations with 2D map coordinates."""
    return db.query(Station).all()


@router.get("/sections", response_model=List[TrackSectionSchema])
def list_sections(db: Session = Depends(get_db)):
    """List all inter-station corridor track sections."""
    return db.query(TrackSection).all()


@router.get("/trains", response_model=List[TrainSchema])
def list_trains(db: Session = Depends(get_db)):
    """List all train master profiles."""
    return db.query(Train).all()


@router.get("/timetable", response_model=List[TimetableSchema])
def list_timetables(
    section_id: Optional[str] = Query(None),
    track_id: Optional[str] = Query(None),
    limit: int = Query(200),
    db: Session = Depends(get_db)
):
    """List train timetable schedules and sectional occupancies."""
    query = db.query(Timetable)
    if section_id:
        query = query.filter(Timetable.section_id == section_id)
    if track_id:
        query = query.filter(Timetable.track_id == track_id)
    return query.limit(limit).all()
