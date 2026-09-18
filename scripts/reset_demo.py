"""
RailSync AI — Canonical Demo Environment Reset Tool
SIH26027: AI-Powered Automatic Block Planning

Usage:
    py -3.12 scripts/reset_demo.py [--re-generate-data]
"""

import sys
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import SessionLocal, init_db
from backend.app.services.demo_reset_service import execute_canonical_demo_reset


def reset_demo_environment(re_generate: bool = False):
    print("=" * 70)
    print("  RAILSYNC AI — CANONICAL DEMO ENVIRONMENT RESET (SIH26027)")
    print("=" * 70)

    init_db()
    db = SessionLocal()
    try:
        res = execute_canonical_demo_reset(db=db, re_generate=re_generate, actor="CLI_OPERATOR")
        print(f"\n[*] Demo Reset Result:")
        print(f"    - Plan ID:          {res['plan_id']}")
        print(f"    - Tasks:            {res['tasks_ingested']} prioritized ({res['tier_1_emergencies']} Tier-1 Emergencies)")
        print(f"    - Windows:          {res['candidate_windows']} candidate shadow windows")
        print(f"    - Scheduled Tasks:  {res['scheduled_tasks']} across {res['active_bundles']} bundles")
        print(f"    - Sentinel Status:  {res['validation_verdict']}")
        print(f"    - Audit Log:        {res['audit_log_id']}")
        print("\n" + "=" * 70)
        print("  DEMO RESET COMPLETE: Pristine baseline restored for demonstration.")
        print("=" * 70)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset RailSync AI canonical demo state")
    parser.add_argument("--re-generate-data", action="store_true", help="Re-generate synthetic CSV files from scratch")
    args = parser.parse_args()

    reset_demo_environment(re_generate=args.re_generate_data)
