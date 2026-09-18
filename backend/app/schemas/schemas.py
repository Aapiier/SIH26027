"""
RailSync AI — Pydantic Schemas for API Requests and Responses
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class StationSchema(BaseModel):
    code: str
    name: str
    division: str
    zone: str
    x: float
    y: float
    platforms: int

    model_config = {"from_attributes": True}


class TrackSectionSchema(BaseModel):
    section_id: str
    from_stn: str
    to_stn: str
    distance_km: float
    line_type: str
    tracks: int
    max_speed: int
    headway_mins: int

    model_config = {"from_attributes": True}


class TrackSchema(BaseModel):
    track_id: str
    section_id: str
    track_name: str
    direction: str
    is_electrified: bool
    elementary_section_id: Optional[str] = None
    speed_limit_kmph: int

    model_config = {"from_attributes": True}


class AssetSchema(BaseModel):
    asset_id: str
    asset_name: str
    category: str
    department: str
    section_id: str
    track_id: str
    start_km: float
    end_km: float
    criticality_weight: int
    health_index: float
    last_inspected_days_ago: int

    model_config = {"from_attributes": True}


class MaintenanceRequestSchema(BaseModel):
    request_id: str
    department: str
    source_system: str
    asset_id: str
    section_id: str
    track_id: str
    start_km: float
    end_km: float
    defect_type: str
    severity: str
    duration_minutes: int
    earliest_start: datetime
    latest_deadline: datetime
    speed_restriction_kmph: int
    machinery_required: List[str] = []
    power_block_required: bool = False
    elementary_section_id: Optional[str] = None
    status: str = "PENDING"
    scenario_tag: Optional[str] = "BASE_POOL"
    ai_priority_score: Optional[float] = None
    ai_risk_score: Optional[float] = None
    ai_urgency_level: Optional[str] = None
    unscheduled_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class TrainSchema(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    priority_rank: int
    speed_factor: float
    headway_buffer_mins: int
    max_speed_kmph: int

    model_config = {"from_attributes": True}


class TimetableSchema(BaseModel):
    timetable_id: str
    train_number: str
    section_id: str
    track_id: str
    direction: str
    scheduled_entry: datetime
    scheduled_exit: datetime
    transit_duration_mins: int
    headway_buffer_mins: int
    source: str

    model_config = {"from_attributes": True}


class CandidateWindowSchema(BaseModel):
    window_id: str
    section_id: str
    track_id: str
    window_start: datetime
    window_end: datetime
    usable_duration_mins: int
    train_conflict_count: int
    forecast_uncertainty: float
    eligible_departments: List[str] = []

    model_config = {"from_attributes": True}


class BlockPlanItemSchema(BaseModel):
    item_id: str
    plan_id: str
    window_id: Optional[str] = None
    section_id: str
    track_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    bundled_task_ids: List[str] = []
    assigned_resource_ids: List[str] = []
    justification: Optional[str] = None
    validation_status: str = "PASSED"
    conflict_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class BlockPlanSchema(BaseModel):
    plan_id: str
    horizon: str
    status: str
    solver_runtime_s: float
    total_saved_minutes: int
    total_blocks_scheduled: int
    total_tasks_scheduled: int
    total_unscheduled_tasks: int
    content_hash: str
    created_at: datetime
    items: List[BlockPlanItemSchema] = []

    model_config = {"from_attributes": True}


class AuditLogSchema(BaseModel):
    log_id: str
    plan_id: Optional[str] = None
    action: str
    actor: str
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    justification: Optional[str] = None
    content_hash: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class ManualOverrideRequest(BaseModel):
    plan_id: str
    item_id: str
    new_start: datetime
    new_end: datetime
    justification: str
    actor: str = "CHIEF_CONTROLLER"


class DisruptionTrainDelayRequest(BaseModel):
    train_number: str
    section_id: str
    delay_minutes: int
    actor: str = "CONTROLLER"
