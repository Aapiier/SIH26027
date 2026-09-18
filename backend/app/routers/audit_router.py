"""
RailSync AI — Cryptographic Audit Trail Router
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import AuditLog
from backend.app.schemas.schemas import AuditLogSchema

router = APIRouter(prefix="/api/v1/audit", tags=["Cryptographic Audit Trail"])


@router.get("", response_model=List[AuditLogSchema])
def list_audit_trail(limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve immutable audit log records with SHA-256 hash chains."""
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
