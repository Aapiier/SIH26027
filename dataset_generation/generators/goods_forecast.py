"""
RailSync AI — Simulated Goods Freight Forecast Generator
Generates probabilistic freight train movement projections with confidence scores.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
from dataset_generation.config import SECTION_CATALOG

def generate_goods_forecast(
    trains: List[Dict[str, Any]], 
    planning_days: int, 
    rng: random.Random
) -> List[Dict[str, Any]]:
    """
    Generate simulated goods train forecasts with entry/exit windows and confidence scores.
    High confidence (>0.75) represents scheduled container flows;
    Lower confidence (<0.60) represents ad-hoc/coal rakes priced as soft penalties.
    """
    forecasts = []
    forecast_id_counter = 7001
    base_date = datetime(2026, 10, 1, 0, 0, 0)
    
    freight_trains = [t for t in trains if t["train_type"] == "FREIGHT"]
    if not freight_trains:
        # Create virtual freight IDs
        freight_trains = [{"train_number": f"FRT-AD-{i:03d}"} for i in range(1, 15)]

    for day_offset in range(planning_days):
        current_day = base_date + timedelta(days=day_offset)

        for frt in freight_trains:
            # Each freight rakes runs across 2-4 contiguous sections
            sec_subset = rng.sample(SECTION_CATALOG, k=rng.randint(2, 4))
            start_minute = rng.randint(60, 1380)
            current_time = current_day + timedelta(minutes=start_minute)

            confidence = round(rng.uniform(0.45, 0.95), 2)

            for sec in sec_subset:
                sec_id = sec["section_id"]
                transit = rng.randint(45, 90)
                entry = current_time
                exit_time = entry + timedelta(minutes=transit)
                
                track_id = f"{sec_id}-DN" if rng.random() > 0.5 else f"{sec_id}-UP"

                forecasts.append({
                    "forecast_id": f"GF-{forecast_id_counter}",
                    "train_number": frt["train_number"],
                    "section_id": sec_id,
                    "track_id": track_id,
                    "estimated_entry": entry.strftime("%Y-%m-%d %H:%M:%S"),
                    "estimated_exit": exit_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence_score": confidence,
                    "commodity": rng.choice(["CONTAINER", "COAL", "FERTILIZER", "AUTOMOBILES", "EMPTY_RAKE"]),
                    "origin_hub": "Tughlakabad ICD",
                    "destination_hub": "Dankuni Goods Yard",
                    "source": "SIMULATED_FOIS",
                })
                forecast_id_counter += 1
                current_time = exit_time + timedelta(minutes=15)

    return forecasts
