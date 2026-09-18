"""
RailSync AI — Candidate Shadow-Block Generator (Hardened Edge-Case Engine)
Extracts collision-free corridor timetable gaps by subtracting train occupancy intervals,
headway buffers, and station clearances across all operational horizon boundaries.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models.db_models import (
    TrackSection, Track, Timetable, GoodsForecast, CandidateWindow
)


def extract_candidate_windows(
    db: Session, 
    min_gap_minutes: int = 60,
    setup_buffer_mins: int = 15,
    clearance_buffer_mins: int = 15,
    horizon_days: int = 7
) -> List[Dict[str, Any]]:
    """
    Compute collision-free candidate maintenance windows by subtracting train occupancy
    intervals (plus headway buffers) from the calendar timeline for each track.
    Hardened against horizon boundary gaps (initial & trailing), exact-fit gaps, and overnight boundaries.
    """
    tracks = db.query(Track).all()
    timetable_entries = db.query(Timetable).all()
    goods_forecasts = db.query(GoodsForecast).all()

    # Clear previous candidate windows
    db.query(CandidateWindow).delete()

    created_windows = []
    window_id_counter = 8001

    if not tracks:
        db.commit()
        return []

    # Group timetables by track_id
    tt_by_track: Dict[str, List[Timetable]] = {}
    for tt in timetable_entries:
        tt_by_track.setdefault(tt.track_id, []).append(tt)

    # Group freight by track_id
    gf_by_track: Dict[str, List[GoodsForecast]] = {}
    for gf in goods_forecasts:
        gf_by_track.setdefault(gf.track_id, []).append(gf)

    # Determine global timeline horizon boundaries
    all_dates = []
    for tt in timetable_entries:
        all_dates.extend([tt.scheduled_entry, tt.scheduled_exit])
    for gf in goods_forecasts:
        all_dates.extend([gf.estimated_entry, gf.estimated_exit])

    if all_dates:
        horizon_start = min(all_dates).replace(hour=0, minute=0, second=0, microsecond=0)
        horizon_end = max(max(all_dates), horizon_start + timedelta(days=horizon_days)).replace(hour=23, minute=59, second=59)
    else:
        horizon_start = datetime(2026, 10, 1, 0, 0, 0)
        horizon_end = horizon_start + timedelta(days=horizon_days)

    for trk in tracks:
        track_id = trk.track_id
        sec_id = trk.section_id

        # Collect train occupancy intervals
        occupancies: List[Tuple[datetime, datetime, str]] = []
        for tt in tt_by_track.get(track_id, []):
            h_buf = timedelta(minutes=tt.headway_buffer_mins)
            s = tt.scheduled_entry - h_buf
            e = tt.scheduled_exit + h_buf
            # Clip to horizon boundaries
            s = max(horizon_start, s)
            e = min(horizon_end, e)
            if e > s:
                occupancies.append((s, e, f"TRAIN_{tt.train_number}"))

        # Add hard freight paths (confidence >= 0.75)
        for gf in gf_by_track.get(track_id, []):
            if gf.confidence_score >= 0.75:
                s = gf.estimated_entry - timedelta(minutes=10)
                e = gf.estimated_exit + timedelta(minutes=10)
                s = max(horizon_start, s)
                e = min(horizon_end, e)
                if e > s:
                    occupancies.append((s, e, f"HARD_FREIGHT_{gf.train_number}"))

        if not occupancies:
            # Entire horizon is open for this track
            total_dur = int((horizon_end - horizon_start).total_seconds() // 60)
            if total_dur >= min_gap_minutes:
                win = CandidateWindow(
                    window_id=f"CW-{window_id_counter}",
                    section_id=sec_id,
                    track_id=track_id,
                    window_start=horizon_start,
                    window_end=horizon_end,
                    usable_duration_mins=total_dur,
                    train_conflict_count=0,
                    forecast_uncertainty=0.0,
                    eligible_departments=["ENGINEERING", "SIGNAL_TELECOM", "TRD"],
                )
                db.add(win)
                created_windows.append({
                    "window_id": win.window_id,
                    "section_id": win.section_id,
                    "track_id": win.track_id,
                    "window_start": win.window_start.isoformat(),
                    "window_end": win.window_end.isoformat(),
                    "usable_duration_mins": win.usable_duration_mins,
                    "forecast_uncertainty": 0.0,
                })
                window_id_counter += 1
            continue

        # Sort intervals chronologically
        occupancies.sort(key=lambda x: x[0])

        # Merge overlapping/adjacent train occupancies
        merged_blocks: List[Tuple[datetime, datetime]] = []
        cur_s, cur_e, _ = occupancies[0]
        for s, e, _ in occupancies[1:]:
            if s <= cur_e:
                cur_e = max(cur_e, e)
            else:
                merged_blocks.append((cur_s, cur_e))
                cur_s, cur_e = s, e
        merged_blocks.append((cur_s, cur_e))

        # 1. Edge Case 1: Initial Boundary Gap (before first train)
        if merged_blocks[0][0] > horizon_start:
            init_gap_end = merged_blocks[0][0] - timedelta(minutes=clearance_buffer_mins)
            if init_gap_end > horizon_start:
                dur = int((init_gap_end - horizon_start).total_seconds() // 60)
                if dur >= min_gap_minutes:
                    win = CandidateWindow(
                        window_id=f"CW-{window_id_counter}",
                        section_id=sec_id,
                        track_id=track_id,
                        window_start=horizon_start,
                        window_end=init_gap_end,
                        usable_duration_mins=dur,
                        train_conflict_count=0,
                        forecast_uncertainty=0.0,
                        eligible_departments=["ENGINEERING", "SIGNAL_TELECOM", "TRD"],
                    )
                    db.add(win)
                    created_windows.append({
                        "window_id": win.window_id,
                        "section_id": win.section_id,
                        "track_id": win.track_id,
                        "window_start": win.window_start.isoformat(),
                        "window_end": win.window_end.isoformat(),
                        "usable_duration_mins": win.usable_duration_mins,
                        "forecast_uncertainty": 0.0,
                    })
                    window_id_counter += 1

        # 2. Inter-train Gaps (between merged occupancies)
        for i in range(len(merged_blocks) - 1):
            gap_start = merged_blocks[i][1] + timedelta(minutes=setup_buffer_mins)
            gap_end = merged_blocks[i + 1][0] - timedelta(minutes=clearance_buffer_mins)

            if gap_end > gap_start:
                duration_mins = int((gap_end - gap_start).total_seconds() // 60)
                # Exact-fit condition: duration_mins >= min_gap_minutes
                if duration_mins >= min_gap_minutes:
                    # Check soft freight overlap
                    soft_freight = [
                        gf for gf in gf_by_track.get(track_id, [])
                        if gf.confidence_score < 0.75 and
                        max(gap_start, gf.estimated_entry) < min(gap_end, gf.estimated_exit)
                    ]
                    uncertainty = max([gf.confidence_score for gf in soft_freight], default=0.0)

                    win = CandidateWindow(
                        window_id=f"CW-{window_id_counter}",
                        section_id=sec_id,
                        track_id=track_id,
                        window_start=gap_start,
                        window_end=gap_end,
                        usable_duration_mins=duration_mins,
                        train_conflict_count=len(soft_freight),
                        forecast_uncertainty=uncertainty,
                        eligible_departments=["ENGINEERING", "SIGNAL_TELECOM", "TRD"],
                    )
                    db.add(win)
                    created_windows.append({
                        "window_id": win.window_id,
                        "section_id": win.section_id,
                        "track_id": win.track_id,
                        "window_start": win.window_start.isoformat(),
                        "window_end": win.window_end.isoformat(),
                        "usable_duration_mins": win.usable_duration_mins,
                        "forecast_uncertainty": win.forecast_uncertainty,
                    })
                    window_id_counter += 1

        # 3. Edge Case 2: Trailing Boundary Gap (after last train to horizon end)
        if merged_blocks[-1][1] < horizon_end:
            trail_gap_start = merged_blocks[-1][1] + timedelta(minutes=setup_buffer_mins)
            if horizon_end > trail_gap_start:
                dur = int((horizon_end - trail_gap_start).total_seconds() // 60)
                if dur >= min_gap_minutes:
                    win = CandidateWindow(
                        window_id=f"CW-{window_id_counter}",
                        section_id=sec_id,
                        track_id=track_id,
                        window_start=trail_gap_start,
                        window_end=horizon_end,
                        usable_duration_mins=dur,
                        train_conflict_count=0,
                        forecast_uncertainty=0.0,
                        eligible_departments=["ENGINEERING", "SIGNAL_TELECOM", "TRD"],
                    )
                    db.add(win)
                    created_windows.append({
                        "window_id": win.window_id,
                        "section_id": win.section_id,
                        "track_id": win.track_id,
                        "window_start": win.window_start.isoformat(),
                        "window_end": win.window_end.isoformat(),
                        "usable_duration_mins": win.usable_duration_mins,
                        "forecast_uncertainty": 0.0,
                    })
                    window_id_counter += 1

    db.commit()
    return created_windows
