"""
RailSync AI — Railway Asset Catalog Generator
Generates track segments, turnouts, point machines, signals, and OHE feeding sections.
"""

from typing import List, Dict, Any
import random
from dataset_generation.config import SECTION_CATALOG

def generate_assets(tracks: List[Dict[str, Any]], rng: random.Random) -> List[Dict[str, Any]]:
    """
    Generate infrastructure assets associated with tracks and sections.
    """
    assets = []
    asset_id_counter = 1001

    for track in tracks:
        track_id = track["track_id"]
        sec_id = track["section_id"]
        sec_meta = next(s for s in SECTION_CATALOG if s["section_id"] == sec_id)
        distance = sec_meta["distance_km"]

        # 1. Permanent Way Track Segments (every 10 km)
        num_segments = max(1, int(distance // 10))
        for i in range(num_segments):
            start_km = round(i * (distance / num_segments), 1)
            end_km = round(min(distance, (i + 1) * (distance / num_segments)), 1)
            assets.append({
                "asset_id": f"AST-TRK-{asset_id_counter}",
                "asset_name": f"Track Block {sec_id} {track['direction']} (Km {start_km}-{end_km})",
                "category": "TRACK",
                "department": "ENGINEERING",
                "section_id": sec_id,
                "track_id": track_id,
                "start_km": start_km,
                "end_km": end_km,
                "criticality_weight": rng.choice([3, 4, 5]),
                "health_index": round(rng.uniform(65.0, 98.0), 1),
                "last_inspected_days_ago": rng.randint(5, 60),
            })
            asset_id_counter += 1

        # 2. S&T Assets: Point Machines and Signals
        assets.append({
            "asset_id": f"AST-SIG-{asset_id_counter}",
            "asset_name": f"Signal Post {sec_id} {track['direction']} Auto Block",
            "category": "SIGNAL",
            "department": "SIGNAL_TELECOM",
            "section_id": sec_id,
            "track_id": track_id,
            "start_km": round(distance * 0.3, 1),
            "end_km": round(distance * 0.3 + 0.1, 1),
            "criticality_weight": 4,
            "health_index": round(rng.uniform(70.0, 99.0), 1),
            "last_inspected_days_ago": rng.randint(3, 45),
        })
        asset_id_counter += 1

        assets.append({
            "asset_id": f"AST-PNT-{asset_id_counter}",
            "asset_name": f"Point Machine {sec_id} Crossover Junction",
            "category": "POINT_MACHINE",
            "department": "SIGNAL_TELECOM",
            "section_id": sec_id,
            "track_id": track_id,
            "start_km": round(distance * 0.8, 1),
            "end_km": round(distance * 0.8 + 0.2, 1),
            "criticality_weight": 5,
            "health_index": round(rng.uniform(60.0, 95.0), 1),
            "last_inspected_days_ago": rng.randint(2, 30),
        })
        asset_id_counter += 1

        # 3. TRD Assets: OHE Catenary & Contact Wire Sector
        assets.append({
            "asset_id": f"AST-OHE-{asset_id_counter}",
            "asset_name": f"25kV OHE Catenary Section {sec_id} {track['direction']}",
            "category": "OHE",
            "department": "TRD",
            "section_id": sec_id,
            "track_id": track_id,
            "start_km": 0.0,
            "end_km": distance,
            "criticality_weight": 4,
            "health_index": round(rng.uniform(68.0, 97.0), 1),
            "last_inspected_days_ago": rng.randint(7, 50),
        })
        asset_id_counter += 1

    return assets
