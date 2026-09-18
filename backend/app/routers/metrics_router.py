"""
RailSync AI — Operational Metrics & Benchmark Router
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import MaintenanceRequest, BlockPlan, BlockPlanItem, Asset, Timetable
from backend.app.pipeline.validator import validate_plan_schedule
from backend.app.pipeline.ml_model import get_model_metadata

router = APIRouter(prefix="/api/v1/metrics", tags=["Operational KPIs & Metrics"])


@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Compute operational KPIs derived from actual database records and schedules.
    """
    total_tasks = db.query(MaintenanceRequest).count()
    scheduled_tasks = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == "SCHEDULED").count()
    unscheduled_tasks = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == "UNSCHEDULED").count()
    
    emergency_tasks = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.severity == "EMERGENCY"
    ).count()
    
    high_priority_tasks = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.severity.in_(["EMERGENCY", "CRITICAL"])
    ).count()

    latest_plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
    
    total_block_hours = 0.0
    saved_minutes = 0
    total_blocks_count = 0
    bundled_blocks_count = 0
    cross_dept_bundles_count = 0
    validation_status = "NO_PLAN"
    content_hash = "N/A"

    if latest_plan:
        items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == latest_plan.plan_id).all()
        total_blocks_count = len(items)
        total_block_hours = sum(item.duration_minutes for item in items) / 60.0
        saved_minutes = latest_plan.total_saved_minutes
        bundled_blocks_count = sum(1 for item in items if len(item.bundled_task_ids or []) > 1)
        
        # Calculate cross-department bundles
        for it in items:
            if len(it.bundled_task_ids or []) > 1:
                reqs = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id.in_(it.bundled_task_ids)).all()
                depts = set(r.department for r in reqs)
                if len(depts) > 1:
                    cross_dept_bundles_count += 1

        val_res = validate_plan_schedule(db, latest_plan.plan_id)
        validation_status = val_res.get("overall_verdict", "PASSED")
        content_hash = latest_plan.content_hash

    # Asset availability % (approximate uptime across 7 days on corridor)
    total_corridor_minutes = 7 * 24 * 60 * 7  # 7 sections
    maintenance_downtime_minutes = total_block_hours * 60.0
    asset_availability_pct = round(100.0 * (1.0 - (maintenance_downtime_minutes / max(1, total_corridor_minutes))), 2)

    return {
        "asset_availability_percentage": min(99.9, max(85.0, asset_availability_pct)),
        "total_maintenance_requests": total_tasks,
        "scheduled_tasks_count": scheduled_tasks,
        "unscheduled_tasks_count": unscheduled_tasks or (total_tasks - scheduled_tasks),
        "scheduled_rate_percentage": round((scheduled_tasks / max(1, total_tasks)) * 100, 1),
        "emergency_tasks_count": emergency_tasks,
        "critical_emergency_count": high_priority_tasks,
        "active_blocks_count": total_blocks_count,
        "total_block_possession_hours": round(total_block_hours, 1),
        "total_saved_possession_minutes": saved_minutes,
        "total_saved_possession_hours": round(saved_minutes / 60.0, 1),
        "multi_department_bundled_blocks": bundled_blocks_count,
        "cross_dept_bundles_count": cross_dept_bundles_count,
        "solver_latest_runtime_s": round(latest_plan.solver_runtime_s, 3) if latest_plan else 0.0,
        "active_plan_status": latest_plan.status if latest_plan else "NO_PLAN",
        "validation_status": validation_status,
        "plan_id": latest_plan.plan_id if latest_plan else None,
        "content_hash": content_hash,
        "horizon": latest_plan.horizon if latest_plan else "WEEKLY",
        "corridor": "Bilaspur - Nagpur Corridor (BSP-NGP)",
        "model_version": f"{get_model_metadata().get('model_name', 'HistGradientBoosting GBDT')} {get_model_metadata().get('version', 'v3.0')} (14d Risk)",
    }
