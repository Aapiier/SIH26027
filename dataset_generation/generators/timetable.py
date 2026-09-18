"""
RailSync AI — Timetable & Sectional Occupancy Generator
Simulates COA train timetables across corridor sections for the planning horizon.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
from dataset_generation.config import SECTION_CATALOG

def generate_timetable(
    trains: List[Dict[str, Any]], 
    planning_days: int, 
    rng: random.Random
) -> List[Dict[str, Any]]:
    """
    Generate realistic multi-day train timetable entries with sequential section entry/exit times.
    """
    timetable = []
    entry_id_counter = 5001

    base_date = datetime(2026, 10, 1, 0, 0, 0)
    sections_order = [s for s in SECTION_CATALOG if s["section_id"] != "ANVT-GZB"]
    
    # We simulate UP (PRYJ -> NDLS) and DOWN (NDLS -> PRYJ) flows
    for day_offset in range(planning_days):
        current_day_start = base_date + timedelta(days=day_offset)

        for train in trains:
            # Skip freight here if handled via probabilistic goods forecast, or include fixed path freight
            is_down = rng.random() > 0.5  # Direction
            route = sections_order if is_down else list(reversed(sections_order))

            # Initial departure offset in the day (0:00 to 23:30)
            dep_minute = rng.randint(0, 1400)
            current_time = current_day_start + timedelta(minutes=dep_minute)

            for sec in route:
                sec_id = sec["section_id"]
                dist = sec["distance_km"]
                speed = sec["max_speed"] * train["speed_factor"]
                transit_minutes = max(5, int((dist / speed) * 60))

                entry_time = current_time
                exit_time = entry_time + timedelta(minutes=transit_minutes)

                direction = "DOWN" if is_down else "UP"
                track_id = f"{sec_id}-DN" if is_down else f"{sec_id}-UP"
                if sec["tracks"] == 4:
                    sub = "FAST" if train["priority_rank"] <= 2 else "SLOW"
                    track_id = f"{sec_id}-DN-{sub}" if is_down else f"{sec_id}-UP-{sub}"

                timetable.append({
                    "timetable_id": f"TT-{entry_id_counter}",
                    "train_number": train["train_number"],
                    "section_id": sec_id,
                    "track_id": track_id,
                    "direction": direction,
                    "scheduled_entry": entry_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "scheduled_exit": exit_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "transit_duration_mins": transit_minutes,
                    "headway_buffer_mins": train["headway_buffer_mins"],
                    "source": "SIMULATED_COA",
                })
                entry_id_counter += 1

                # Station stop / signal buffer before next section
                current_time = exit_time + timedelta(minutes=rng.choice([2, 5, 10]))

    return timetable
