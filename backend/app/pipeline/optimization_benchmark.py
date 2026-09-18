"""
RailSync AI — Optimization Benchmarking Engine
Executes side-by-side comparative benchmarking between Deterministic Greedy Baseline
and Google OR-Tools CP-SAT Optimizer on identical inputs and constraints.
"""

from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.db_models import MaintenanceRequest
from backend.app.pipeline.baseline_scheduler import run_greedy_baseline_scheduler
from backend.app.pipeline.optimizer import solve_maintenance_schedule


def run_optimization_benchmark(db: Session, horizon: str = "WEEKLY", max_solver_time_s: int = 10) -> Dict[str, Any]:
    """
    Execute empirical benchmark comparing Greedy Baseline vs CP-SAT Optimizer.
    """
    # 1. Reset all requests to PENDING
    for r in db.query(MaintenanceRequest).all():
        r.status = "PENDING"
    db.commit()

    # 2. Run Greedy Baseline
    greedy_res = run_greedy_baseline_scheduler(db)
    greedy_metrics = greedy_res["objective_breakdown"]

    # 3. Reset all requests to PENDING again
    for r in db.query(MaintenanceRequest).all():
        r.status = "PENDING"
    db.commit()

    # 4. Run CP-SAT Optimizer
    cpsat_res = solve_maintenance_schedule(db, horizon=horizon, max_solver_time_s=max_solver_time_s)
    cpsat_metrics = cpsat_res["objective_breakdown"]

    # 5. Compute Comparative Differentiators
    delta_scheduled = cpsat_metrics.get("total_scheduled_tasks", 0) - greedy_metrics.get("total_scheduled_tasks", 0)
    delta_saved_hours = cpsat_metrics.get("block_possession_saved_hours", 0.0) - greedy_metrics.get("block_possession_saved_hours", 0.0)
    delta_priority = round(cpsat_metrics.get("weighted_priority_captured", 0.0) - greedy_metrics.get("weighted_priority_captured", 0.0), 1)
    delta_bundles = cpsat_metrics.get("active_bundles_count", 0) - greedy_metrics.get("active_bundles_count", 0)

    comparison_table = {
        "scheduled_tasks": {
            "greedy_baseline": greedy_metrics.get("total_scheduled_tasks", 0),
            "cpsat_optimizer": cpsat_metrics.get("total_scheduled_tasks", 0),
            "delta": delta_scheduled,
        },
        "critical_emergency_tasks": {
            "greedy_baseline": greedy_metrics.get("scheduled_emergency_tasks", 0) + greedy_metrics.get("scheduled_critical_tasks", 0),
            "cpsat_optimizer": cpsat_metrics.get("scheduled_emergency_tasks", 0) + cpsat_metrics.get("scheduled_critical_tasks", 0),
            "delta": (cpsat_metrics.get("scheduled_emergency_tasks", 0) + cpsat_metrics.get("scheduled_critical_tasks", 0)) -
                     (greedy_metrics.get("scheduled_emergency_tasks", 0) + greedy_metrics.get("scheduled_critical_tasks", 0)),
        },
        "block_possession_hours_saved": {
            "greedy_baseline": greedy_metrics.get("block_possession_saved_hours", 0.0),
            "cpsat_optimizer": cpsat_metrics.get("block_possession_saved_hours", 0.0),
            "delta": delta_saved_hours,
        },
        "active_bundles_count": {
            "greedy_baseline": greedy_metrics.get("active_bundles_count", 0),
            "cpsat_optimizer": cpsat_metrics.get("active_bundles_count", 0),
            "delta": delta_bundles,
        },
        "cross_department_bundles": {
            "greedy_baseline": greedy_metrics.get("cross_department_bundles_count", 0),
            "cpsat_optimizer": cpsat_metrics.get("cross_department_bundles_count", 0),
            "delta": cpsat_metrics.get("cross_department_bundles_count", 0) - greedy_metrics.get("cross_department_bundles_count", 0),
        },
        "weighted_priority_captured": {
            "greedy_baseline": greedy_metrics.get("weighted_priority_captured", 0.0),
            "cpsat_optimizer": cpsat_metrics.get("weighted_priority_captured", 0.0),
            "delta": delta_priority,
        },
        "runtime_seconds": {
            "greedy_baseline": greedy_metrics.get("solver_runtime_s", 0.0),
            "cpsat_optimizer": cpsat_metrics.get("solver_runtime_s", 0.0),
        },
    }

    return {
        "status": "SUCCESS",
        "benchmark_summary": {
            "total_tasks_evaluated": len(db.query(MaintenanceRequest).all()),
            "greedy_scheduled": greedy_metrics.get("total_scheduled_tasks", 0),
            "cpsat_scheduled": cpsat_metrics.get("total_scheduled_tasks", 0),
            "block_hours_saved_by_bundling": cpsat_metrics.get("block_possession_saved_hours", 0.0),
            "cross_dept_bundles_created": cpsat_metrics.get("cross_department_bundles_count", 0),
        },
        "comparison_table": comparison_table,
        "greedy_details": greedy_metrics,
        "cpsat_details": cpsat_metrics,
    }
