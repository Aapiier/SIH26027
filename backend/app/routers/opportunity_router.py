"""
RailSync AI — Maintenance Opportunity & What-If Router
Provides endpoints for opportunity score evaluations, explainability, alternative windows,
and what-if planning perturbations.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.schemas import (
    OpportunityEvaluationResponse,
    WhatIfSimulateRequest,
    WhatIfResponseSchema
)
from backend.app.pipeline.opportunity_engine import evaluate_block_item_opportunity
from backend.app.pipeline.what_if_simulator import simulate_what_if_scenario

router = APIRouter(prefix="/api/v1/opportunity", tags=["Maintenance Opportunity Engine"])


@router.get("/item/{item_id}", response_model=OpportunityEvaluationResponse)
def get_item_opportunity(item_id: str, db: Session = Depends(get_db)):
    """
    Retrieve explainable Maintenance Opportunity Score (0-100), reasons, and alternative windows for a block.
    """
    res = evaluate_block_item_opportunity(db, item_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/what-if", response_model=WhatIfResponseSchema)
def simulate_what_if(req: WhatIfSimulateRequest, db: Session = Depends(get_db)):
    """
    Simulate an operational condition change (train delay, duration increase, block shift)
    and return Before / After / Delta impact metrics.
    """
    res = simulate_what_if_scenario(
        db=db,
        perturbation_type=req.perturbation_type,
        params=req.model_dump()
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
