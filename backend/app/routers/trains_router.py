"""
RailSync AI — Trains & Timetables API Router
"""

import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import Train, Timetable, GoodsForecast, Station, TrackSection, Track, AuditLog
from backend.app.schemas.schemas import (
    TrainSchema, TimetableSchema, StationSchema, TrackSectionSchema,
    TrainCreateSchema, TimetableCreateSchema
)
from backend.app.pipeline.candidate_windows import extract_candidate_windows

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


@router.post("/trains", response_model=TrainSchema, status_code=201)
def create_train(payload: TrainCreateSchema, db: Session = Depends(get_db)):
    """
    Manually register a new train profile in the network master database.
    """
    existing = db.query(Train).filter(Train.train_number == payload.train_number).first()
    if existing:
        # Update existing attributes
        existing.train_name = payload.train_name
        existing.train_type = payload.train_type
        existing.priority_rank = payload.priority_rank
        existing.speed_factor = payload.speed_factor
        existing.headway_buffer_mins = payload.headway_buffer_mins
        existing.max_speed_kmph = payload.max_speed_kmph
        db.commit()
        db.refresh(existing)
        return existing

    train = Train(
        train_number=payload.train_number,
        train_name=payload.train_name,
        train_type=payload.train_type,
        priority_rank=payload.priority_rank,
        speed_factor=payload.speed_factor,
        headway_buffer_mins=payload.headway_buffer_mins,
        max_speed_kmph=payload.max_speed_kmph
    )
    db.add(train)
    db.commit()
    db.refresh(train)
    return train


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


@router.post("/timetable", response_model=TimetableSchema, status_code=201)
def create_timetable_entry(payload: TimetableCreateSchema, db: Session = Depends(get_db)):
    """
    Inject a manual train schedule slot onto a physical track section.
    Immediately recalculates collision-free candidate windows so the master optimizer reflects newly occupied gaps.
    """
    if payload.scheduled_exit <= payload.scheduled_entry:
        raise HTTPException(status_code=400, detail="scheduled_exit must be after scheduled_entry")

    # Ensure train exists or create fallback profile
    train = db.query(Train).filter(Train.train_number == payload.train_number).first()
    if not train:
        train = Train(
            train_number=payload.train_number,
            train_name=f"Special Train {payload.train_number}",
            train_type="EXPRESS",
            priority_rank=3,
            speed_factor=1.0,
            headway_buffer_mins=payload.headway_buffer_mins or 10,
            max_speed_kmph=110
        )
        db.add(train)
        db.flush()

    # Ensure section exists
    section = db.query(TrackSection).filter(TrackSection.section_id == payload.section_id).first()
    if not section:
        raise HTTPException(status_code=400, detail=f"Section {payload.section_id} not found")

    # Ensure track exists
    track = db.query(Track).filter(Track.track_id == payload.track_id).first()
    if not track:
        alt_id = payload.track_id.replace("-DOWN", "-DN").replace("-DN", "-DOWN")
        track = db.query(Track).filter(Track.track_id == alt_id).first()
        if not track:
            dir_filter = "DOWN" if ("DN" in payload.track_id.upper() or "DOWN" in payload.track_id.upper()) else "UP"
            track = db.query(Track).filter(Track.section_id == payload.section_id, Track.direction == dir_filter).first()
            if not track:
                track = db.query(Track).filter(Track.section_id == payload.section_id).first()
            if not track:
                raise HTTPException(status_code=400, detail=f"Track {payload.track_id} not found")
        payload.track_id = track.track_id

    transit_dur = payload.transit_duration_mins
    if not transit_dur or transit_dur <= 0:
        transit_dur = int((payload.scheduled_exit - payload.scheduled_entry).total_seconds() // 60)

    tt_id = f"TT-SIM-{uuid.uuid4().hex[:6].upper()}"
    tt = Timetable(
        timetable_id=tt_id,
        train_number=payload.train_number,
        section_id=payload.section_id,
        track_id=payload.track_id,
        direction=payload.direction,
        scheduled_entry=payload.scheduled_entry,
        scheduled_exit=payload.scheduled_exit,
        transit_duration_mins=transit_dur,
        headway_buffer_mins=payload.headway_buffer_mins or 10,
        source=payload.source or "MANUAL_SIMULATION"
    )
    db.add(tt)
    db.commit()

    # Automatically recalculate candidate windows so the optimizer & shadow gaps adapt immediately
    extract_candidate_windows(db=db, min_gap_minutes=60)

    # Log to audit trail
    h = hashlib.sha256(f"MANUAL_TIMETABLE_{tt_id}_{payload.train_number}".encode()).hexdigest()
    audit = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        action="MANUAL_TIMETABLE_CREATED",
        actor=payload.actor or "DEMO_OPERATOR",
        plan_id=None,
        justification=f"Manual timetable slot {tt_id} for train {payload.train_number} injected on {payload.track_id}.",
        content_hash=h,
        new_state={
            "timetable_id": tt_id,
            "train_number": payload.train_number,
            "section_id": payload.section_id,
            "track_id": payload.track_id,
            "entry": payload.scheduled_entry.isoformat(),
            "exit": payload.scheduled_exit.isoformat()
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(tt)

    return tt
