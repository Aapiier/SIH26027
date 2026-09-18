"""
RailSync AI — Database ORM Models
SQLAlchemy models for all canonical railway and scheduling entities.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Station(Base):
    __tablename__ = "stations"

    code = Column(String(10), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    division = Column(String(50), nullable=False)
    zone = Column(String(10), nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    platforms = Column(Integer, default=2)


class TrackSection(Base):
    __tablename__ = "track_sections"

    section_id = Column(String(20), primary_key=True, index=True)
    from_stn = Column(String(10), ForeignKey("stations.code"), nullable=False)
    to_stn = Column(String(10), ForeignKey("stations.code"), nullable=False)
    distance_km = Column(Float, nullable=False)
    line_type = Column(String(20), nullable=False)
    tracks = Column(Integer, default=2)
    max_speed = Column(Integer, default=110)
    headway_mins = Column(Integer, default=10)

    tracks_rel = relationship("Track", back_populates="section_rel", cascade="all, delete-orphan")


class Track(Base):
    __tablename__ = "tracks"

    track_id = Column(String(30), primary_key=True, index=True)
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_name = Column(String(50), nullable=False)
    direction = Column(String(10), nullable=False)  # UP, DOWN, BI
    is_electrified = Column(Boolean, default=True)
    elementary_section_id = Column(String(30), nullable=True)
    speed_limit_kmph = Column(Integer, default=110)

    section_rel = relationship("TrackSection", back_populates="tracks_rel")


class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(String(30), primary_key=True, index=True)
    asset_name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)  # TRACK, SIGNAL, POINT_MACHINE, OHE
    department = Column(String(30), nullable=False)  # ENGINEERING, SIGNAL_TELECOM, TRD
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_id = Column(String(30), ForeignKey("tracks.track_id"), nullable=False)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    criticality_weight = Column(Integer, default=3)
    health_index = Column(Float, default=90.0)
    last_inspected_days_ago = Column(Integer, default=10)


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    request_id = Column(String(30), primary_key=True, index=True)
    department = Column(String(30), nullable=False)
    source_system = Column(String(30), nullable=False)
    asset_id = Column(String(30), ForeignKey("assets.asset_id"), nullable=False)
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_id = Column(String(30), ForeignKey("tracks.track_id"), nullable=False)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    defect_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # EMERGENCY, CRITICAL, URGENT, ROUTINE
    duration_minutes = Column(Integer, nullable=False)
    earliest_start = Column(DateTime, nullable=False)
    latest_deadline = Column(DateTime, nullable=False)
    speed_restriction_kmph = Column(Integer, default=0)
    machinery_required = Column(JSON, default=list)
    power_block_required = Column(Boolean, default=False)
    elementary_section_id = Column(String(30), nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, SCHEDULED, UNSCHEDULED, OVERRIDDEN, COMPLETED
    scenario_tag = Column(String(50), default="BASE_POOL")
    
    # Priority & Intelligence fields
    ai_priority_score = Column(Float, nullable=True)
    ai_risk_score = Column(Float, nullable=True)
    ai_urgency_level = Column(String(20), nullable=True)
    unscheduled_reason = Column(Text, nullable=True)


class Train(Base):
    __tablename__ = "trains"

    train_number = Column(String(20), primary_key=True, index=True)
    train_name = Column(String(100), nullable=False)
    train_type = Column(String(30), nullable=False)
    priority_rank = Column(Integer, default=3)
    speed_factor = Column(Float, default=1.0)
    headway_buffer_mins = Column(Integer, default=10)
    max_speed_kmph = Column(Integer, default=110)


class Timetable(Base):
    __tablename__ = "timetable"

    timetable_id = Column(String(30), primary_key=True, index=True)
    train_number = Column(String(20), ForeignKey("trains.train_number"), nullable=False)
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_id = Column(String(30), ForeignKey("tracks.track_id"), nullable=False)
    direction = Column(String(10), nullable=False)
    scheduled_entry = Column(DateTime, nullable=False, index=True)
    scheduled_exit = Column(DateTime, nullable=False, index=True)
    transit_duration_mins = Column(Integer, nullable=False)
    headway_buffer_mins = Column(Integer, default=10)
    source = Column(String(30), default="SIMULATED_COA")


class GoodsForecast(Base):
    __tablename__ = "goods_forecast"

    forecast_id = Column(String(30), primary_key=True, index=True)
    train_number = Column(String(20), nullable=False)
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_id = Column(String(30), ForeignKey("tracks.track_id"), nullable=False)
    estimated_entry = Column(DateTime, nullable=False)
    estimated_exit = Column(DateTime, nullable=False)
    confidence_score = Column(Float, default=0.8)
    commodity = Column(String(50), default="CONTAINER")
    origin_hub = Column(String(50), nullable=True)
    destination_hub = Column(String(50), nullable=True)
    source = Column(String(30), default="SIMULATED_FOIS")


class Resource(Base):
    __tablename__ = "resources"

    resource_id = Column(String(30), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(30), nullable=False)  # TAMPING_MACHINE, UNIMAT, BCM, TOWER_WAGON, CREW_TEAM
    department = Column(String(30), nullable=False)
    home_depot = Column(String(20), nullable=False)
    transit_speed_kmph = Column(Float, default=40.0)
    max_shift_hours = Column(Float, default=8.0)


class CandidateWindow(Base):
    __tablename__ = "candidate_windows"

    window_id = Column(String(30), primary_key=True, index=True)
    section_id = Column(String(20), ForeignKey("track_sections.section_id"), nullable=False)
    track_id = Column(String(30), ForeignKey("tracks.track_id"), nullable=False)
    window_start = Column(DateTime, nullable=False, index=True)
    window_end = Column(DateTime, nullable=False, index=True)
    usable_duration_mins = Column(Integer, nullable=False)
    train_conflict_count = Column(Integer, default=0)
    forecast_uncertainty = Column(Float, default=0.0)
    eligible_departments = Column(JSON, default=list)


class BlockPlan(Base):
    __tablename__ = "block_plans"

    plan_id = Column(String(40), primary_key=True, index=True)
    horizon = Column(String(20), default="WEEKLY")  # WEEKLY, MONTHLY
    status = Column(String(20), default="RECOMMENDED")  # DRAFT, RECOMMENDED, APPROVED, PUBLISHED, OVERRIDDEN
    solver_runtime_s = Column(Float, default=0.0)
    total_saved_minutes = Column(Integer, default=0)
    total_blocks_scheduled = Column(Integer, default=0)
    total_tasks_scheduled = Column(Integer, default=0)
    total_unscheduled_tasks = Column(Integer, default=0)
    content_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("BlockPlanItem", back_populates="plan_rel", cascade="all, delete-orphan")


class BlockPlanItem(Base):
    __tablename__ = "block_plan_items"

    item_id = Column(String(40), primary_key=True, index=True)
    plan_id = Column(String(40), ForeignKey("block_plans.plan_id"), nullable=False)
    window_id = Column(String(30), nullable=True)
    section_id = Column(String(20), nullable=False)
    track_id = Column(String(30), nullable=False)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    bundled_task_ids = Column(JSON, default=list)
    assigned_resource_ids = Column(JSON, default=list)
    justification = Column(Text, nullable=True)
    validation_status = Column(String(20), default="PASSED")  # PASSED, CONFLICT
    conflict_reason = Column(Text, nullable=True)

    plan_rel = relationship("BlockPlan", back_populates="items")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(40), primary_key=True, index=True)
    plan_id = Column(String(40), nullable=True)
    action = Column(String(50), nullable=False)  # OPTIMIZATION_RUN, OVERRIDE, APPROVAL, PUBLISH, DISRUPTION
    actor = Column(String(50), default="CHIEF_CONTROLLER")
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    justification = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
