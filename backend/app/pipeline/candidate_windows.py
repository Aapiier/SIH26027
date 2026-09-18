"""
RailSync AI — Candidate Shadow-Block Generator
Extracts available corridor timetable gaps from simulated COA train movements and goods forecasts.
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
    clearance_buffer_mins: int = 15
) -> List[Dict[str, Any]]:
    """
    Compute collision-free candidate maintenance windows by subtracting train occupancy
    intervals (plus headway buffers) from the calendar timeline for each track.
    """
    tracks = db.query(Track).all()
    timetable_entries = db.query(Timetable).all()
    goods_forecasts = db.query(GoodsForecast).all()

    # Clear previous candidate windows
    db.query(CandidateWindow).delete()

    created_windows = []
    window_id_counter = 8001

    # Group timetables by track_id
    tt_by_track = {}
    for tt in timetable_entries:
        tt_by_track.setdefault(tt.track_id, []).append(tt)

    # Group freight by track_id
    gf_by_track = {}
    for gf in goods_forecasts:
        gf_by_track.setdefault(gf.track_id, []).append(gf)

    for trk in tracks:
        track_id = trk.track_id
        sec_id = trk.section_id

        # Collect train occupancy intervals
        occupancies: List[Tuple[datetime, datetime, str]] = []
        for tt in tt_by_track.get(track_id, []):
            h_buf = timedelta(minutes=tt.headway_buffer_mins)
            s = tt.scheduled_entry - h_buf
            e = tt.scheduled_exit + h_buf
            occupancies.append((s, e, f"TRAIN_{tt.train_number}"))

        # Add hard freight paths (> 0.75 confidence)
        for gf in gf_by_track.get(track_id, []):
            if gf.confidence_score >= 0.75:
                s = gf.estimated_entry - timedelta(minutes=10)
                e = gf.estimated_exit + timedelta(minutes=10)
                occupancies.append((s, e, f"HARD_FREIGHT_{gf.train_number}"))

        if not occupancies:
            continue

        # Sort intervals by start time
        occupancies.sort(key=lambda x: x[0])

        # Merge overlapping occupancies
        merged_blocks = []
        cur_s, cur_e, cur_label = occupancies[0]
        for s, e, lbl in occupancies[1:]:
            if s <= cur_e:
                cur_e = max(cur_e, e)
            else:
                merged_blocks.append((cur_s, cur_e))
                cur_s, cur_e = s, e
        merged_blocks.append((cur_s, cur_e))

        # Compute gaps between merged occupancies
        for i in range(len(merged_blocks) - 1):
            gap_start = merged_blocks[i][1] + timedelta(minutes=setup_buffer_mins)
            gap_end = merged_blocks[i + 1][0] - timedelta(minutes=clearance_buffer_mins)

            if gap_end > gap_start:
                duration_mins = int((gap_end - gap_start).total_seconds() // 60)
                if duration_mins >= min_gap_minutes:
                    # Check if any soft freight overlaps this gap
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

    db.commit()
    return created_windows
