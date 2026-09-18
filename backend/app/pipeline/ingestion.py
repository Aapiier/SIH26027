"""
RailSync AI — Data Ingestion Pipeline
Loads synthetic CSV files into the SQLite database with validation and transactional integrity.
"""

from pathlib import Path
import csv
import json
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal, init_db
from backend.app.models.db_models import (
    Station, TrackSection, Track, Asset, Train, Timetable,
    GoodsForecast, Resource, MaintenanceRequest
)
from backend.app.pipeline.data_quality import validate_and_clean_request, sanitize_datetime


def read_csv(filepath: Path) -> list:
    """Read CSV file into list of dicts."""
    if not filepath.exists():
        raise FileNotFoundError(f"Missing required CSV: {filepath}")
    with filepath.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def ingest_all_data(data_dir: Path, db: Session = None) -> dict:
    """
    Ingest all synthetic CSV datasets into the database.
    """
    should_close = False
    if db is None:
        init_db()
        db = SessionLocal()
        should_close = True

    summary = {}

    try:
        # 1. Stations
        stations_raw = read_csv(data_dir / "stations.csv")
        for r in stations_raw:
            stn = Station(
                code=r["code"],
                name=r["name"],
                division=r["division"],
                zone=r["zone"],
                x=float(r["x"]),
                y=float(r["y"]),
                platforms=int(r.get("platforms", 2))
            )
            db.merge(stn)
        summary["stations"] = len(stations_raw)

        # 2. TrackSections
        sections_raw = read_csv(data_dir / "track_sections.csv")
        for r in sections_raw:
            sec = TrackSection(
                section_id=r["section_id"],
                from_stn=r["from_stn"],
                to_stn=r["to_stn"],
                distance_km=float(r["distance_km"]),
                line_type=r["line_type"],
                tracks=int(r["tracks"]),
                max_speed=int(r["max_speed"]),
                headway_mins=int(r["headway_mins"]),
            )
            db.merge(sec)
        summary["track_sections"] = len(sections_raw)

        # 3. Tracks
        tracks_raw = read_csv(data_dir / "tracks.csv")
        for r in tracks_raw:
            trk = Track(
                track_id=r["track_id"],
                section_id=r["section_id"],
                track_name=r["track_name"],
                direction=r["direction"],
                is_electrified=(str(r.get("is_electrified")).lower() in ("true", "1")),
                elementary_section_id=r.get("elementary_section_id"),
                speed_limit_kmph=int(r.get("speed_limit_kmph", 110)),
            )
            db.merge(trk)
        summary["tracks"] = len(tracks_raw)

        # 4. Assets
        assets_raw = read_csv(data_dir / "assets.csv")
        for r in assets_raw:
            ast = Asset(
                asset_id=r["asset_id"],
                asset_name=r["asset_name"],
                category=r["category"],
                department=r["department"],
                section_id=r["section_id"],
                track_id=r["track_id"],
                start_km=float(r["start_km"]),
                end_km=float(r["end_km"]),
                criticality_weight=int(r["criticality_weight"]),
                health_index=float(r["health_index"]),
                last_inspected_days_ago=int(r["last_inspected_days_ago"]),
            )
            db.merge(ast)
        summary["assets"] = len(assets_raw)

        # 5. Trains
        trains_raw = read_csv(data_dir / "trains.csv")
        for r in trains_raw:
            trn = Train(
                train_number=r["train_number"],
                train_name=r["train_name"],
                train_type=r["train_type"],
                priority_rank=int(r["priority_rank"]),
                speed_factor=float(r["speed_factor"]),
                headway_buffer_mins=int(r["headway_buffer_mins"]),
                max_speed_kmph=int(r["max_speed_kmph"]),
            )
            db.merge(trn)
        summary["trains"] = len(trains_raw)

        # 6. Resources
        resources_raw = read_csv(data_dir / "resources.csv")
        for r in resources_raw:
            res = Resource(
                resource_id=r["resource_id"],
                name=r["name"],
                type=r["type"],
                department=r["department"],
                home_depot=r["home_depot"],
                transit_speed_kmph=float(r["transit_speed_kmph"]),
                max_shift_hours=float(r["max_shift_hours"]),
            )
            db.merge(res)
        summary["resources"] = len(resources_raw)

        # 7. Timetable
        timetable_raw = read_csv(data_dir / "timetable.csv")
        for r in timetable_raw:
            tt = Timetable(
                timetable_id=r["timetable_id"],
                train_number=r["train_number"],
                section_id=r["section_id"],
                track_id=r["track_id"],
                direction=r["direction"],
                scheduled_entry=sanitize_datetime(r["scheduled_entry"]),
                scheduled_exit=sanitize_datetime(r["scheduled_exit"]),
                transit_duration_mins=int(r["transit_duration_mins"]),
                headway_buffer_mins=int(r["headway_buffer_mins"]),
                source=r.get("source", "SIMULATED_COA"),
            )
            db.merge(tt)
        summary["timetable"] = len(timetable_raw)

        # 8. Goods Forecast
        goods_raw = read_csv(data_dir / "goods_forecast.csv")
        for r in goods_raw:
            gf = GoodsForecast(
                forecast_id=r["forecast_id"],
                train_number=r["train_number"],
                section_id=r["section_id"],
                track_id=r["track_id"],
                estimated_entry=sanitize_datetime(r["estimated_entry"]),
                estimated_exit=sanitize_datetime(r["estimated_exit"]),
                confidence_score=float(r["confidence_score"]),
                commodity=r.get("commodity", "CONTAINER"),
                origin_hub=r.get("origin_hub"),
                destination_hub=r.get("destination_hub"),
                source=r.get("source", "SIMULATED_FOIS"),
            )
            db.merge(gf)
        summary["goods_forecast"] = len(goods_raw)

        # 9. Maintenance Requests (with Data Quality Gate)
        requests_raw = read_csv(data_dir / "maintenance_requests.csv")
        valid_reqs = 0
        quarantined_reqs = 0

        for r in requests_raw:
            is_valid, cleaned, err = validate_and_clean_request(r)
            if is_valid:
                req = MaintenanceRequest(**cleaned)
                db.merge(req)
                valid_reqs += 1
            else:
                quarantined_reqs += 1
                print(f"[!] Quarantined invalid request: {err}")

        summary["maintenance_requests_valid"] = valid_reqs
        summary["maintenance_requests_quarantined"] = quarantined_reqs

        db.commit()
        print(f"[+] Ingestion complete: {summary}")
        return summary
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    from dataset_generation.config import DEFAULT_OUTPUT_DIR
    ingest_all_data(DEFAULT_OUTPUT_DIR)
