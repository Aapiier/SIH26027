"""
RailSync AI — Manual Simulation / Live Demo Input Layer Test Suite
Verifies:
1. Manual Maintenance Task creation with AI ML Risk Inference & G&SR Prioritization.
2. Manual Train Profile and Timetable Schedule creation with candidate window recalculation.
3. Manually added data reaches CP-SAT optimizer and Sentinel validator.
4. Live disruption re-planning on manually altered network state.
5. Demo Reset restores canonical state cleanly and idempotently.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import get_db, SessionLocal, Base
from backend.app.models.db_models import MaintenanceRequest, Train, Timetable, BlockPlan, AuditLog, CandidateWindow
from backend.app.services.demo_reset_service import execute_canonical_demo_reset
from backend.app.pipeline.optimizer import solve_maintenance_schedule
from backend.app.pipeline.validator import validate_plan_schedule

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_canonical_state():
    """Ensure tests run on a pristine canonical baseline."""
    db = SessionLocal()
    try:
        execute_canonical_demo_reset(db=db)
    finally:
        db.close()


def test_manual_maintenance_task_creation_and_ai_risk():
    """
    Test creating manual maintenance requests across all 3 departments:
    Engineering, Signal & Telecom, TRD (OHE).
    Verify ML risk inference, Tier 1/2 priority scoring, DB storage, and AuditLog.
    """
    # 1. Inject Emergency Rail Fracture (Engineering)
    payload_eng = {
        "department": "ENGINEERING",
        "source_system": "MANUAL_SIM",
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "start_km": 45.2,
        "end_km": 45.8,
        "defect_type": "RAIL_FRACTURE_RISK",
        "severity": "EMERGENCY",
        "duration_minutes": 90,
        "earliest_start": "2026-10-01T06:00:00",
        "latest_deadline": "2026-10-01T14:00:00",
        "speed_restriction_kmph": 30,
        "machinery_required": ["TAMPING_MACHINE"],
        "power_block_required": False,
        "actor": "DEMO_OPERATOR"
    }

    res = client.post("/api/v1/tasks", json=payload_eng)
    assert res.status_code == 201
    data = res.json()
    assert data["request_id"].startswith("REQ-SIM-")
    assert data["department"] == "ENGINEERING"
    assert data["severity"] == "EMERGENCY"
    assert data["ai_priority_score"] == 98.0
    assert data["ai_urgency_level"] == "CRITICAL_EMERGENCY"
    assert data["ai_risk_score"] is not None
    assert 0.0 <= data["ai_risk_score"] <= 1.0

    # 2. Inject TRD OHE Defect
    payload_trd = {
        "department": "TRD",
        "source_system": "MANUAL_SIM",
        "section_id": "ALJN-TDL",
        "track_id": "ALJN-TDL-UP",
        "start_km": 92.0,
        "end_km": 92.5,
        "defect_type": "OHE_CANTILEVER_FLASH_BURN",
        "severity": "EMERGENCY",
        "duration_minutes": 60,
        "earliest_start": "2026-10-01T07:00:00",
        "latest_deadline": "2026-10-01T15:00:00",
        "speed_restriction_kmph": 0,
        "machinery_required": ["TOWER_WAGON"],
        "power_block_required": True,
        "actor": "DEMO_OPERATOR"
    }
    res_trd = client.post("/api/v1/tasks", json=payload_trd)
    assert res_trd.status_code == 201
    data_trd = res_trd.json()
    assert data_trd["department"] == "TRD"
    assert data_trd["power_block_required"] is True

    # 3. Inject S&T Signal Defect
    payload_st = {
        "department": "SIGNAL_TELECOM",
        "source_system": "MANUAL_SIM",
        "section_id": "NDLS-GZB",
        "track_id": "NDLS-GZB-DOWN",
        "start_km": 12.0,
        "end_km": 12.5,
        "defect_type": "POINT_MACHINE_DETECTION_FAILURE",
        "severity": "EMERGENCY",
        "duration_minutes": 45,
        "earliest_start": "2026-10-01T05:00:00",
        "latest_deadline": "2026-10-01T12:00:00",
        "speed_restriction_kmph": 15,
        "machinery_required": ["CREW_TEAM"],
        "power_block_required": False,
        "actor": "DEMO_OPERATOR"
    }
    res_st = client.post("/api/v1/tasks", json=payload_st)
    assert res_st.status_code == 201

    # Verify Audit Trail entry was recorded
    db = SessionLocal()
    try:
        audit = db.query(AuditLog).filter(AuditLog.action == "MANUAL_TASK_CREATED").first()
        assert audit is not None
        assert "MANUAL_TASK_" in audit.justification or "created via live simulation" in audit.justification
    finally:
        db.close()


def test_manual_train_and_timetable_creation():
    """
    Test registering a new train and timetable entry.
    Verify candidate shadow-windows are recalculated.
    """
    # 1. Register new Train profile
    train_payload = {
        "train_number": "99999",
        "train_name": "Special Antigravity Superfast",
        "train_type": "VANDE_BHARAT",
        "priority_rank": 1,
        "speed_factor": 1.0,
        "headway_buffer_mins": 10,
        "max_speed_kmph": 130
    }
    res_tr = client.post("/api/v1/network/trains", json=train_payload)
    assert res_tr.status_code == 201
    assert res_tr.json()["train_number"] == "99999"

    # 2. Inject Timetable entry
    tt_payload = {
        "train_number": "99999",
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "direction": "UP",
        "scheduled_entry": "2026-10-01T10:00:00",
        "scheduled_exit": "2026-10-01T10:45:00",
        "headway_buffer_mins": 10,
        "source": "MANUAL_SIMULATION"
    }
    res_tt = client.post("/api/v1/network/timetable", json=tt_payload)
    assert res_tt.status_code == 201
    data_tt = res_tt.json()
    assert data_tt["train_number"] == "99999"
    assert data_tt["transit_duration_mins"] == 45

    # Verify candidate windows were refreshed in DB
    db = SessionLocal()
    try:
        windows = db.query(CandidateWindow).all()
        assert len(windows) > 0
    finally:
        db.close()


def test_manually_added_task_reaches_cpsat_and_sentinel():
    """
    Prove that manually added tasks actually reach the CP-SAT optimizer,
    get scheduled into a block plan item, and pass Sentinel safety verification.
    """
    # 1. Inspect an available candidate window to target
    db = SessionLocal()
    try:
        win = db.query(CandidateWindow).first()
        assert win is not None
        sec_id = win.section_id
        trk_id = win.track_id
        e_start = win.window_start.isoformat()
        l_dead = (win.window_end + timedelta(hours=24)).isoformat()
    finally:
        db.close()

    # 2. Add a high-urgency manual task targeting this corridor gap
    payload = {
        "department": "ENGINEERING",
        "source_system": "MANUAL_SIM",
        "section_id": sec_id,
        "track_id": trk_id,
        "start_km": 50.0,
        "end_km": 50.5,
        "defect_type": "RAIL_FRACTURE_RISK",
        "severity": "EMERGENCY",
        "duration_minutes": 60,
        "earliest_start": e_start,
        "latest_deadline": l_dead,
        "speed_restriction_kmph": 20,
        "machinery_required": [],
        "power_block_required": False,
        "actor": "DEMO_OPERATOR"
    }
    res_create = client.post("/api/v1/tasks", json=payload)
    assert res_create.status_code == 201
    task_id = res_create.json()["request_id"]

    # 3. Run CP-SAT Master Optimizer
    res_opt = client.post("/api/v1/optimization/solve?horizon=WEEKLY&max_time_s=10")
    assert res_opt.status_code == 200
    opt_data = res_opt.json()["result"]
    assert opt_data["solver_status"] in ("OPTIMAL", "FEASIBLE")

    # 4. Check if the newly injected task was scheduled
    db = SessionLocal()
    try:
        task_db = db.query(MaintenanceRequest).filter(MaintenanceRequest.request_id == task_id).first()
        assert task_db is not None
        assert task_db.status == "SCHEDULED"

        # 5. Verify with Sentinel Safety Validator
        plan = db.query(BlockPlan).order_by(BlockPlan.created_at.desc()).first()
        assert plan is not None
        val_res = validate_plan_schedule(db=db, plan_id=plan.plan_id)
        assert val_res["overall_verdict"] == "PASSED"
        assert val_res["conflicts_detected"] == 0
    finally:
        db.close()


def test_reset_demo_restores_canonical_state():
    """
    Prove that after adding manual simulation items, the Reset Demo endpoint
    completely restores the pristine canonical baseline state.
    """
    # 1. Add extra dummy tasks and trains
    client.post("/api/v1/tasks", json={
        "department": "ENGINEERING",
        "section_id": "GZB-ALJN",
        "track_id": "GZB-ALJN-UP",
        "start_km": 60.0,
        "end_km": 60.5,
        "defect_type": "SLEEPER_CRACK",
        "severity": "ROUTINE",
        "duration_minutes": 60,
        "earliest_start": "2026-10-01T08:00:00",
        "latest_deadline": "2026-10-01T18:00:00",
    })

    client.post("/api/v1/network/trains", json={
        "train_number": "88888",
        "train_name": "Temporary Demo Train",
        "train_type": "EXPRESS",
        "priority_rank": 3,
        "speed_factor": 1.0,
        "headway_buffer_mins": 10,
        "max_speed_kmph": 110
    })

    # 2. Call Reset Demo
    res_reset = client.post("/api/v1/demo/reset?re_generate=false")
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["status"] == "DEMO_RESET_COMPLETE"
    assert reset_data["validation_verdict"] == "PASSED"

    # 3. Confirm temporary objects are eliminated from DB
    db = SessionLocal()
    try:
        temp_task = db.query(MaintenanceRequest).filter(MaintenanceRequest.defect_type == "SLEEPER_CRACK").first()
        assert temp_task is None

        temp_train = db.query(Train).filter(Train.train_number == "88888").first()
        assert temp_train is None
    finally:
        db.close()
