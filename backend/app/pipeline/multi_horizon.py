"""
RailSync AI — Multi-Horizon Planning Engine
Provides 7-day tactical operational block plans and 30-day strategic corridor forecasts.
"""

from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.pipeline.candidate_windows import extract_candidate_windows
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.services.audit_service import log_audit_action


def run_weekly_operational_plan(db: Session, actor: str = "CHIEF_CONTROLLER") -> Dict[str, Any]:
    """
    Generate high-granularity 7-day operational block plan.
    """
    extract_candidate_windows(db, min_gap_minutes=60)
    solve_res = solve_maintenance_schedule(db, horizon="WEEKLY", max_solver_time_s=10)
    val_res = validate_plan_schedule(db, solve_res["plan_id"])

    log_audit_action(
        db=db,
        action="RUN_WEEKLY_PLAN",
        actor=actor,
        plan_id=solve_res["plan_id"],
        new_state=solve_res,
        justification="Generated 7-day tactical operational block schedule"
    )

    return {
        "horizon": "WEEKLY",
        "plan_id": solve_res["plan_id"],
        "scheduled_tasks": solve_res["scheduled_tasks"],
        "unscheduled_tasks": solve_res["unscheduled_tasks"],
        "solver_runtime_s": solve_res["runtime_seconds"],
        "validation_verdict": val_res["overall_verdict"],
    }


def run_monthly_strategic_forecast(db: Session, actor: str = "DIVISIONAL_OPERATIONS_MANAGER") -> Dict[str, Any]:
    """
    Generate 30-day strategic macro-block possession forecast.
    """
    extract_candidate_windows(db, min_gap_minutes=120)
    solve_res = solve_maintenance_schedule(db, horizon="MONTHLY", max_solver_time_s=15)
    val_res = validate_plan_schedule(db, solve_res["plan_id"])

    log_audit_action(
        db=db,
        action="RUN_MONTHLY_FORECAST",
        actor=actor,
        plan_id=solve_res["plan_id"],
        new_state=solve_res,
        justification="Generated 30-day strategic macro-block maintenance possession forecast"
    )

    return {
        "horizon": "MONTHLY",
        "plan_id": solve_res["plan_id"],
        "scheduled_tasks": solve_res["scheduled_tasks"],
        "unscheduled_tasks": solve_res["unscheduled_tasks"],
        "solver_runtime_s": solve_res["runtime_seconds"],
        "validation_verdict": val_res["overall_verdict"],
    }
