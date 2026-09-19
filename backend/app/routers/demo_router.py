"""
RailSync AI — Demo Environment Management Router
Provides canonical demo reset, random scenario generation, and demonstration control endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.demo_reset_service import execute_canonical_demo_reset
from backend.app.services.scenario_generator_service import (
    generate_random_simulation_scenario, PRESET_CONFIGS
)

router = APIRouter(prefix="/api/v1/demo", tags=["Demo Controls"])


@router.post("/reset")
def reset_demo_state(
    re_generate: bool = Query(False, description="Re-generate synthetic raw CSVs"),
    actor: str = Query("DEMO_CONTROLLER", description="Actor name for audit logging"),
    db: Session = Depends(get_db)
):
    """
    Reset the demonstration environment to the pristine canonical state:
    Re-ingests datasets, executes AI prioritization, extracts candidate windows,
    solves the master schedule with CP-SAT, and validates with Sentinel.
    """
    try:
        result = execute_canonical_demo_reset(db=db, re_generate=re_generate, actor=actor)
        return result
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Demo reset failed: {str(ex)}")


@router.get("/presets")
def list_scenario_presets():
    """
    List available simulation presets with descriptions.
    """
    return [
        {
            "id": k,
            "name": v["name"],
            "description": v["description"],
            "planning_days": v["planning_days"],
            "total_trains": v["total_trains"],
            "total_requests": v["total_requests"]
        }
        for k, v in PRESET_CONFIGS.items()
    ]


@router.post("/generate-scenario")
def generate_scenario(
    preset: str = Query("BALANCED_OPERATIONS", description="Simulation scenario preset"),
    seed: Optional[int] = Query(None, description="Optional random seed for reproducible scenario"),
    actor: str = Query("DEMO_CONTROLLER", description="Actor name for audit logging"),
    db: Session = Depends(get_db)
):
    """
    Generate a fresh, randomized railway simulation scenario:
    Creates trains, timetables, maintenance requests, and assets, then automatically
    runs AI Risk prediction, candidate window extraction, CP-SAT optimization, and Sentinel validation.
    """
    try:
        result = generate_random_simulation_scenario(
            db=db,
            preset=preset,
            seed=seed,
            actor=actor
        )
        return result
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Scenario generation failed: {str(ex)}")
