"""
RailSync AI — Ingestion & Status API Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
from backend.app.database import get_db
from backend.app.pipeline.ingestion import ingest_all_data
from dataset_generation.config import DEFAULT_OUTPUT_DIR

router = APIRouter(prefix="/api/v1/ingestion", tags=["Ingestion"])


@router.post("/sync")
def sync_synthetic_data(db: Session = Depends(get_db)):
    """Trigger data ingestion from synthetic CSV repository into SQLite database."""
    try:
        summary = ingest_all_data(DEFAULT_OUTPUT_DIR, db=db)
        return {"status": "SUCCESS", "summary": summary}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
