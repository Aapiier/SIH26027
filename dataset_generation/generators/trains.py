"""
RailSync AI — Train Master Generator
Generates realistic passenger and goods train profiles with priority rankings.
"""

from typing import List, Dict, Any
import random
from dataset_generation.config import TRAIN_PROFILES

TRAIN_NAMES = [
    ("22436", "Vande Bharat Express (NDLS-BSB)", "VANDE_BHARAT"),
    ("22435", "Vande Bharat Express (BSB-NDLS)", "VANDE_BHARAT"),
    ("12302", "Howrah Rajdhani Express", "RAJDHANI"),
    ("12301", "New Delhi Rajdhani Express", "RAJDHANI"),
    ("12004", "Lucknow Swarna Shatabdi", "SHATABDI"),
    ("12003", "New Delhi Shatabdi Express", "SHATABDI"),
    ("12554", "Vaishali Superfast Express", "SUPERFAST"),
    ("12553", "New Delhi Vaishali Express", "SUPERFAST"),
    ("12418", "Prayagraj Express", "SUPERFAST"),
    ("12417", "New Delhi Prayagraj Express", "SUPERFAST"),
    ("12876", "Neelachal Express", "SUPERFAST"),
    ("12875", "Anand Vihar Neelachal Express", "SUPERFAST"),
    ("14218", "Unchahar Express", "EXPRESS"),
    ("14217", "Prayag Unchahar Express", "EXPRESS"),
    ("14006", "Lichchavi Express", "EXPRESS"),
    ("14005", "Anand Vihar Lichchavi Express", "EXPRESS"),
]

def generate_trains(total_trains: int, rng: random.Random) -> List[Dict[str, Any]]:
    """Generate train catalog with priorities and operational bounds."""
    trains = []
    generated_numbers = set()

    # Add curated premier trains first
    for t_num, t_name, t_type in TRAIN_NAMES:
        profile = next(p for p in TRAIN_PROFILES if p["type"] == t_type)
        trains.append({
            "train_number": t_num,
            "train_name": t_name,
            "train_type": t_type,
            "priority_rank": profile["priority_rank"],
            "speed_factor": profile["speed_factor"],
            "headway_buffer_mins": profile["headway_buffer"],
            "max_speed_kmph": 130 if profile["priority_rank"] == 1 else 110,
        })
        generated_numbers.add(t_num)

    # Generate additional trains to meet target count
    types_pool = [p["type"] for p in TRAIN_PROFILES]
    weights_pool = [p["weight"] for p in TRAIN_PROFILES]

    counter = 1
    while len(trains) < total_trains:
        t_type = rng.choices(types_pool, weights=weights_pool)[0]
        profile = next(p for p in TRAIN_PROFILES if p["type"] == t_type)
        
        if t_type == "FREIGHT":
            t_num = f"FRT-{counter:04d}"
            t_name = f"Container Freight Corridor Unit {counter:03d}"
        else:
            t_num = f"{rng.randint(12000, 19999)}"
            t_name = f"{t_type.capitalize()} Express {counter:03d}"

        if t_num not in generated_numbers:
            generated_numbers.add(t_num)
            trains.append({
                "train_number": t_num,
                "train_name": t_name,
                "train_type": t_type,
                "priority_rank": profile["priority_rank"],
                "speed_factor": profile["speed_factor"],
                "headway_buffer_mins": profile["headway_buffer"],
                "max_speed_kmph": 75 if t_type == "FREIGHT" else (130 if profile["priority_rank"] == 1 else 110),
            })
            counter += 1

    return trains
