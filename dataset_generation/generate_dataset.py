"""
RailSync AI — Master Dataset Generator CLI
Generates complete relational datasets for prototype simulation and testing.
"""

import argparse
import csv
import json
import random
from pathlib import Path
from datetime import datetime

from dataset_generation.config import DatasetConfig, DEFAULT_SEED, DEFAULT_OUTPUT_DIR
from dataset_generation.generators.geography import generate_stations, generate_track_sections, generate_tracks
from dataset_generation.generators.assets import generate_assets
from dataset_generation.generators.trains import generate_trains
from dataset_generation.generators.timetable import generate_timetable
from dataset_generation.generators.goods_forecast import generate_goods_forecast
from dataset_generation.generators.resources import generate_resources
from dataset_generation.generators.defects import generate_maintenance_requests
from dataset_generation.generators.scenarios import inject_deterministic_scenarios
from dataset_generation.validators.validate_dataset import validate_dataset_integrity
from dataset_generation.validators.data_profiler import generate_eda_profile


def write_csv(filepath: Path, rows: list) -> int:
    """Write list of dicts to CSV with consistent fieldnames."""
    if not rows:
        return 0
    filepath.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with filepath.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            # Handle list fields (like machinery_required) for clean CSV serialization
            row_copy = dict(r)
            for k, v in row_copy.items():
                if isinstance(v, list):
                    row_copy[k] = json.dumps(v)
            writer.writerow(row_copy)
    return len(rows)


def run_generation(config: DatasetConfig) -> dict:
    """Execute complete dataset generation pipeline."""
    rng = random.Random(config.seed)
    print(f"[*] Starting RailSync AI Dataset Generator (Seed={config.seed}, Days={config.planning_days})")

    # 1. Topology & Assets
    stations = generate_stations()
    sections = generate_track_sections()
    tracks = generate_tracks(rng)
    assets = generate_assets(tracks, rng)

    # 2. Operations & Timetables
    trains = generate_trains(config.total_trains, rng)
    timetable = generate_timetable(trains, config.planning_days, rng)
    goods_forecast = generate_goods_forecast(trains, config.planning_days, rng)
    resources = generate_resources()

    # 3. Departmental Maintenance Demands
    requests = generate_maintenance_requests(assets, config.total_requests, config.planning_days, rng)

    # 4. Inject 8 Deterministic Scenarios
    scenarios_meta = inject_deterministic_scenarios(requests, assets, timetable, goods_forecast)

    # 5. Referential Integrity & Quality Validation
    val_report = validate_dataset_integrity(
        stations, sections, tracks, assets, trains, timetable, goods_forecast, resources, requests
    )

    if not val_report["passed"]:
        print(f"[!] VALIDATION ERRORS DETECTED: {val_report['errors']}")
        raise ValueError(f"Dataset integrity failed with {val_report['error_count']} errors.")

    # 6. Generate EDA Profile
    eda_report = generate_eda_profile(
        stations, sections, tracks, assets, trains, timetable, goods_forecast, resources, requests
    )

    # 7. Write CSVs to Output Directory
    out_dir = config.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    written_files = {
        "stations.csv": write_csv(out_dir / "stations.csv", stations),
        "track_sections.csv": write_csv(out_dir / "track_sections.csv", sections),
        "tracks.csv": write_csv(out_dir / "tracks.csv", tracks),
        "assets.csv": write_csv(out_dir / "assets.csv", assets),
        "trains.csv": write_csv(out_dir / "trains.csv", trains),
        "timetable.csv": write_csv(out_dir / "timetable.csv", timetable),
        "goods_forecast.csv": write_csv(out_dir / "goods_forecast.csv", goods_forecast),
        "resources.csv": write_csv(out_dir / "resources.csv", resources),
        "maintenance_requests.csv": write_csv(out_dir / "maintenance_requests.csv", requests),
    }

    # 8. Write Manifest & EDA Metadata
    manifest = {
        "generator_version": "1.0.0",
        "generated_at": datetime.now().isoformat(),
        "seed": config.seed,
        "planning_days": config.planning_days,
        "validation_status": "PASSED",
        "row_counts": val_report["row_counts"],
        "written_files": written_files,
        "scenarios_injected": scenarios_meta,
    }

    with (out_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    with (out_dir / "eda_profile.json").open("w", encoding="utf-8") as f:
        json.dump(eda_report, f, indent=2)

    print(f"[+] Successfully generated and validated canonical dataset in: {out_dir}")
    print(f"[+] Total Requests: {len(requests)} | Total Timetable Rows: {len(timetable)} | Stations: {len(stations)}")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic datasets for RailSync AI")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for reproducibility")
    parser.add_argument("--mode", choices=["demo", "stress"], default="demo", help="Dataset size mode")
    parser.add_argument("--days", type=int, default=7, help="Planning horizon in days")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_OUTPUT_DIR), help="Output directory")

    args = parser.parse_args()

    if args.mode == "demo":
        cfg = DatasetConfig(
            seed=args.seed,
            output_dir=Path(args.output_dir),
            planning_days=args.days,
            total_trains=120,
            total_requests=80,
        )
    else:  # stress
        cfg = DatasetConfig(
            seed=args.seed,
            output_dir=Path(args.output_dir),
            planning_days=14,
            total_trains=400,
            total_requests=250,
        )

    run_generation(cfg)
