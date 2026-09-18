"""
RailSync AI — Disruption & Reoptimization Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.schemas import DisruptionTrainDelayRequest
from backend.app.pipeline.reoptimizer import handle_train_delay_disruption

router = APIRouter(prefix="/api/v1/disruptions", tags=["Disruption & Reoptimization"])


@router.post("/train-delay")
def report_train_delay(req: DisruptionTrainDelayRequest, db: Session = Depends(get_db)):
    """
    Inject live train delay event, identify collided blocks, and trigger targeted reoptimization.
    """
    try:
        res = handle_train_delay_disruption(
            db=db,
            train_number=req.train_number,
            section_id=req.section_id,
            delay_minutes=req.delay_minutes,
            actor=req.actor
        )
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return {"status": "SUCCESS", "reoptimization_result": res}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
