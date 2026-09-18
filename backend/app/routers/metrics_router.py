"""
RailSync AI — Operational Metrics & Benchmark Router
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.db_models import MaintenanceRequest, BlockPlan, BlockPlanItem, Asset, Timetable

router = APIRouter(prefix="/api/v1/metrics", tags=["Operational KPIs & Metrics"])


@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Compute operational KPIs derived from actual database records and schedules.
    """
    total_tasks = db.query(MaintenanceRequest).count()
    scheduled_tasks = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == "SCHEDULED").count()
    critical_emergency_tasks = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.severity.in_(["EMERGENCY", "CRITICAL"])
    ).count()

    latest_plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
    
    total_block_hours = 0.0
    saved_minutes = 0
    bundled_blocks_count = 0

    if latest_plan:
        items = db.query(BlockPlanItem).filter(BlockPlanItem.plan_id == latest_plan.plan_id).all()
        total_block_hours = sum(item.duration_minutes for item in items) / 60.0
        saved_minutes = latest_plan.total_saved_minutes
        bundled_blocks_count = sum(1 for item in items if len(item.bundled_task_ids or []) > 1)

    # Asset availability % (approximate uptime across 7 days)
    total_corridor_minutes = 7 * 24 * 60 * 7 # 7 sections
    maintenance_downtime_minutes = total_block_hours * 60.0
    asset_availability_pct = round(100.0 * (1.0 - (maintenance_downtime_minutes / max(1, total_corridor_minutes))), 2)

    return {
        "asset_availability_percentage": min(99.9, max(85.0, asset_availability_pct)),
        "total_maintenance_requests": total_tasks,
        "scheduled_tasks_count": scheduled_tasks,
        "scheduled_rate_percentage": round((scheduled_tasks / max(1, total_tasks)) * 100, 1),
        "critical_emergency_count": critical_emergency_tasks,
        "total_block_possession_hours": round(total_block_hours, 1),
        "total_saved_possession_minutes": saved_minutes,
        "multi_department_bundled_blocks": bundled_blocks_count,
        "solver_latest_runtime_s": latest_plan.solver_runtime_s if latest_plan else 0.0,
        "active_plan_status": latest_plan.status if latest_plan else "NO_PLAN",
    }
