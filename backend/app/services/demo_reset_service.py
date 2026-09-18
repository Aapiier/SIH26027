"""
RailSync AI — Canonical Demo Environment Reset Service
Shared implementation for both CLI (`scripts/reset_demo.py`) and API endpoint (`POST /api/v1/demo/reset`).
Performs full, pristine database restoration:
1. Truncates all tables cleanly
2. Re-ingests canonical datasets from `data/synthetic/`
3. Runs AI ML v2 Prioritization Pipeline
4. Extracts collision-free candidate windows
5. Solves canonical CP-SAT schedule
6. Executes independent Sentinel validator check
7. Writes audit log entry
"""

from typing import Dict, Any
from pathlib import Path
import uuid
import hashlib
from sqlalchemy.orm import Session

from backend.app.database import Base
from backend.app.pipeline.ingestion import ingest_all_data
from backend.app.pipeline.prioritization import run_prioritization_pipeline
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.models.db_models import AuditLog
from dataset_generation.config import DatasetConfig
from dataset_generation.generate_dataset import run_generation


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data" / "synthetic"


def execute_canonical_demo_reset(db: Session, re_generate: bool = False, actor: str = "SYSTEM_OPERATOR") -> Dict[str, Any]:
    """
    Executes a complete, deterministic reset of the demonstration environment.
    """
    # 1. Ensure synthetic datasets exist
    if re_generate or not (DATA_DIR / "maintenance_requests.csv").exists():
        config = DatasetConfig(output_dir=DATA_DIR, seed=42, planning_days=2)
        run_generation(config)

    # 2. Clear existing database tables
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    # 3. Ingest canonical datasets
    ingest_summary = ingest_all_data(DATA_DIR, db=db)

    # 4. AI Prioritization Pipeline
    prioritized_tasks = run_prioritization_pipeline(db=db)
    tier_1_count = sum(1 for r in prioritized_tasks if r.get("ai_urgency_level") == "CRITICAL_EMERGENCY")

    # 5. Extract Candidate Windows
    extracted_windows = extract_candidate_windows(db=db, min_gap_minutes=60)

    # 6. Solve Master Schedule via CP-SAT
    plan_res = solve_maintenance_schedule(db=db, horizon="WEEKLY", max_solver_time_s=10)
    plan_id = plan_res.get("plan_id", "PLAN-CANONICAL")

    # 7. Independent Sentinel Validation
    val_res = validate_plan_schedule(db=db, plan_id=plan_id)

    # 8. Cryptographic Audit Log Entry
    h = hashlib.sha256(f"DEMO_RESET_{plan_id}".encode()).hexdigest()
    audit = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        action="DEMO_RESET",
        actor=actor,
        plan_id=plan_id,
        justification=f"Canonical demo environment restored. Plan {plan_id} generated with Sentinel validation: {val_res.get('overall_verdict')}.",
        content_hash=h,
        new_state={
            "plan_id": plan_id,
            "tasks_prioritized": len(prioritized_tasks),
            "scheduled_tasks": plan_res.get("scheduled_tasks", 0),
            "bundles_created": plan_res.get("active_bundles_count", 0),
            "validation": val_res.get("overall_verdict")
        }
    )
    db.add(audit)
    db.commit()

    return {
        "status": "DEMO_RESET_COMPLETE",
        "plan_id": plan_id,
        "tasks_ingested": len(prioritized_tasks),
        "tier_1_emergencies": tier_1_count,
        "candidate_windows": len(extracted_windows),
        "scheduled_tasks": plan_res.get("scheduled_tasks", 0),
        "active_bundles": plan_res.get("active_bundles_count", 0),
        "validation_verdict": val_res.get("overall_verdict"),
        "audit_log_id": audit.log_id,
        "message": "Canonical demonstration state restored successfully."
    }
