"""
RailSync AI — Maintenance Tasks & Prioritization Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import MaintenanceRequest
from backend.app.schemas.schemas import MaintenanceRequestSchema
from backend.app.pipeline.prioritization import run_prioritization_pipeline
from backend.app.services.explanation_service import explain_unscheduled_task

router = APIRouter(prefix="/api/v1/tasks", tags=["Maintenance Tasks"])


@router.get("", response_model=List[MaintenanceRequestSchema])
def list_tasks(
    department: Optional[str] = Query(None, description="Filter by department"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """List all maintenance requests with optional filtering."""
    query = db.query(MaintenanceRequest)
    if department:
        query = query.filter(MaintenanceRequest.department == department)
    if severity:
        query = query.filter(MaintenanceRequest.severity == severity)
    if status:
        query = query.filter(MaintenanceRequest.status == status)
    return query.all()


@router.get("/{request_id}", response_model=MaintenanceRequestSchema)
def get_task(request_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single maintenance request."""
    req = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Task not found")
    return req


@router.post("/prioritize")
def run_prioritization(db: Session = Depends(get_db)):
    """Trigger two-tier AI & deterministic prioritization engine."""
    results = run_prioritization_pipeline(db)
    return {"status": "SUCCESS", "prioritized_count": len(results), "tasks": results}


@router.get("/{request_id}/explain")
def explain_task(request_id: str, db: Session = Depends(get_db)):
    """Get diagnostic feasibility explanation for an unscheduled maintenance task."""
    explanation = explain_unscheduled_task(db, request_id)
    return explanation
