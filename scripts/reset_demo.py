"""
RailSync AI — Canonical Demo Environment Reset Tool
SIH26027: AI-Powered Automatic Block Planning

Usage:
    py -3.12 scripts/reset_demo.py [--re-generate-data]

This script resets the local SQLite database to the pristine canonical state:
1. Re-initializes clean database tables.
2. Ingests canonical synthetic datasets from `data/synthetic/`.
3. Runs the ML v2 prioritization engine with Tier 1 Safety Gates.
4. Generates candidate block windows from timetable occupancy.
5. Solves the canonical CP-SAT schedule.
6. Executes the independent Sentinel validation check.
7. Writes an initial system initialization audit trail log.
"""

import sys
import argparse
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import engine, Base, SessionLocal, init_db
from backend.app.pipeline.ingestion import ingest_all_data
from backend.app.pipeline.prioritization import run_prioritization_pipeline
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.models.db_models import BlockPlan, BlockPlanItem, AuditLog
from dataset_generation.config import DatasetConfig
from dataset_generation.generate_dataset import run_generation


def reset_demo_environment(re_generate: bool = False):
    print("=" * 70)
    print("  RAILSYNC AI — CANONICAL DEMO ENVIRONMENT RESET (SIH26027)")
    print("=" * 70)

    data_dir = PROJECT_ROOT / "data" / "synthetic"

    # Step 1: Optional Re-generation of Synthetic Data
    if re_generate or not (data_dir / "maintenance_requests.csv").exists():
        print("\n[*] Step 1/5: Generating canonical synthetic datasets...")
        config = DatasetConfig(output_dir=data_dir, seed=42, planning_days=2)
        run_generation(config)
    else:
        print("\n[*] Step 1/5: Using existing canonical synthetic datasets in `data/synthetic/`")

    # Step 2: Database Re-initialization & Ingestion
    print("\n[*] Step 2/5: Ingesting relational datasets into SQLite...")
    init_db()
    db = SessionLocal()
    try:
        # Clear existing tables cleanly
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()

        ingest_summary = ingest_all_data(data_dir, db=db)
        print(f"    - Ingestion complete: {ingest_summary}")

        # Step 3: Prioritization
        print("\n[*] Step 3/5: Executing AI ML v2 Prioritization with Safety Gates...")
        p_results = run_prioritization_pipeline(db=db)
        tier_1 = sum(1 for r in p_results if r["ai_urgency_level"] == "CRITICAL_EMERGENCY")
        print(f"    - Prioritized {len(p_results)} requests ({tier_1} Tier-1 G&SR Emergency Escalations).")

        # Step 4: Candidate Windows & CP-SAT Solver
        print("\n[*] Step 4/5: Extracting candidate windows & solving CP-SAT schedule...")
        w_summary = extract_candidate_windows(db=db, min_gap_minutes=60)
        print(f"    - Extracted candidate shadow windows from timetable occupancy.")

        plan_res = solve_maintenance_schedule(db=db, horizon="WEEKLY", max_solver_time_s=10)
        plan_id = plan_res.get("plan_id", "PLAN-UNKNOWN")
        print(f"    - CP-SAT Plan solved: {plan_id} (Scheduled Tasks: {plan_res.get('scheduled_tasks', 0)}, Bundles: {plan_res.get('active_bundles_count', 0)})")

        # Step 5: Sentinel Validator Check
        print("\n[*] Step 5/5: Running Independent Sentinel Schedule Validator...")
        v_result = validate_plan_schedule(db=db, plan_id=plan_id)
        print(f"    - Sentinel Status: {v_result.get('overall_verdict')} (Violations: {v_result.get('total_violations_found', 0)}, Hash: {v_result.get('verification_hash', '')[:12]}...)")

        # Audit Log Entry
        import uuid
        import hashlib
        h = hashlib.sha256(f"DEMO_RESET_{plan_id}".encode()).hexdigest()
        audit = AuditLog(
            log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
            action="DEMO_RESET",
            actor="SYSTEM_OPERATOR",
            plan_id=plan_id,
            justification=f"Canonical demo environment reset. Plan {plan_id} created with Sentinel validator status: {v_result.get('overall_verdict')}.",
            content_hash=h,
            new_state={"plan_id": plan_id, "status": "ACTIVE"}
        )
        db.add(audit)
        db.commit()

        print("\n" + "=" * 70)
        print("  DEMO RESET COMPLETE: System is ready for live demonstration.")
        print("  Dashboard UI is operational at http://localhost:5173")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset RailSync AI canonical demo state")
    parser.add_argument("--re-generate-data", action="store_true", help="Re-generate synthetic CSV files from scratch")
    args = parser.parse_args()

    reset_demo_environment(re_generate=args.re_generate_data)
