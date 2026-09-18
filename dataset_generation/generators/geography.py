"""
RailSync AI — Geography & Network Topology Generator
Generates Stations, TrackSections, and individual Track lines.
"""

from typing import List, Dict, Any
import random
from dataset_generation.config import STATION_CATALOG, SECTION_CATALOG

def generate_stations() -> List[Dict[str, Any]]:
    """Return catalog of hub stations with 2D coordinates."""
    return [dict(stn) for stn in STATION_CATALOG]

def generate_track_sections() -> List[Dict[str, Any]]:
    """Return catalog of corridor track sections."""
    return [dict(sec) for sec in SECTION_CATALOG]

def generate_tracks(rng: random.Random) -> List[Dict[str, Any]]:
    """
    Generate individual track records for each section.
    Double track -> UP & DOWN lines.
    Quadruple track -> UP Slow, DOWN Slow, UP Fast, DOWN Fast lines.
    """
    tracks = []
    for sec in SECTION_CATALOG:
        sec_id = sec["section_id"]
        total_tracks = sec["tracks"]
        
        if total_tracks == 2:
            tracks.append({
                "track_id": f"{sec_id}-UP",
                "section_id": sec_id,
                "track_name": f"{sec_id} UP Main",
                "direction": "UP",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-UP",
                "speed_limit_kmph": sec["max_speed"],
            })
            tracks.append({
                "track_id": f"{sec_id}-DN",
                "section_id": sec_id,
                "track_name": f"{sec_id} DOWN Main",
                "direction": "DOWN",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-DN",
                "speed_limit_kmph": sec["max_speed"],
            })
        elif total_tracks == 4:
            tracks.append({
                "track_id": f"{sec_id}-UP-FAST",
                "section_id": sec_id,
                "track_name": f"{sec_id} UP Fast",
                "direction": "UP",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-UP-F",
                "speed_limit_kmph": sec["max_speed"],
            })
            tracks.append({
                "track_id": f"{sec_id}-DN-FAST",
                "section_id": sec_id,
                "track_name": f"{sec_id} DOWN Fast",
                "direction": "DOWN",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-DN-F",
                "speed_limit_kmph": sec["max_speed"],
            })
            tracks.append({
                "track_id": f"{sec_id}-UP-SLOW",
                "section_id": sec_id,
                "track_name": f"{sec_id} UP Slow",
                "direction": "UP",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-UP-S",
                "speed_limit_kmph": max(60, sec["max_speed"] - 20),
            })
            tracks.append({
                "track_id": f"{sec_id}-DN-SLOW",
                "section_id": sec_id,
                "track_name": f"{sec_id} DOWN Slow",
                "direction": "DOWN",
                "is_electrified": True,
                "elementary_section_id": f"ES-{sec_id}-DN-S",
                "speed_limit_kmph": max(60, sec["max_speed"] - 20),
            })
    return tracks
