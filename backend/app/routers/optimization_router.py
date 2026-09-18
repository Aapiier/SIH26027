"""
RailSync AI — Optimization & Planning API Router
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.multi_horizon import run_weekly_operational_plan, run_monthly_strategic_forecast
from backend.app.pipeline.optimization_benchmark import run_optimization_benchmark

router = APIRouter(prefix="/api/v1/optimization", tags=["Optimization Engine"])


@router.post("/solve")
def run_solver(
    horizon: str = Query("WEEKLY", description="WEEKLY or MONTHLY"),
    max_time_s: int = Query(10, description="Max solver timeout in seconds"),
    db: Session = Depends(get_db)
):
    """Execute Google OR-Tools CP-SAT optimization engine."""
    try:
        res = solve_maintenance_schedule(db, horizon=horizon, max_solver_time_s=max_time_s)
        return {"status": "SUCCESS", "result": res}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/benchmark")
def trigger_benchmark(
    horizon: str = Query("WEEKLY", description="WEEKLY or MONTHLY"),
    max_time_s: int = Query(10, description="Max solver timeout in seconds"),
    db: Session = Depends(get_db)
):
    """Run side-by-side benchmark between Greedy Baseline and CP-SAT Optimizer."""
    try:
        res = run_optimization_benchmark(db, horizon=horizon, max_solver_time_s=max_time_s)
        return res
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/weekly-plan")
def trigger_weekly_plan(db: Session = Depends(get_db)):
    """Generate 7-day tactical operational block schedule."""
    try:
        res = run_weekly_operational_plan(db)
        return {"status": "SUCCESS", "result": res}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@router.post("/monthly-forecast")
def trigger_monthly_forecast(db: Session = Depends(get_db)):
    """Generate 30-day strategic macro-block maintenance forecast."""
    try:
        res = run_monthly_strategic_forecast(db)
        return {"status": "SUCCESS", "result": res}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

