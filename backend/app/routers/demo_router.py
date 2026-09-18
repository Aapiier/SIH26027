"""
RailSync AI — Demo Environment Management Router
Provides canonical demo reset and demonstration control endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.demo_reset_service import execute_canonical_demo_reset

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
