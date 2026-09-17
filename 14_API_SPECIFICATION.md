# 14_API_SPECIFICATION.md — REST API & OpenAPI Specification

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. REST API Architecture & Standards

- **Base URL:** `http://127.0.0.1:8000/api/v1`
- **Specification Format:** OpenAPI 3.0 / FastAPI Auto-generated Docs (`/docs`, `/redoc`)
- **Authentication:** Bearer JWT Token (`Authorization: Bearer <token>`)
- **Content-Type:** `application/json` (UTF-8)
- **Timezone Format:** ISO-8601 UTC with explicit offset (`YYYY-MM-DDTHH:MM:SSZ`)

---

## 2. API Endpoint Registry

```
+----------------------------------------------------------------------------------------------------+
|                                    FASTAPI REST ROUTE REGISTRY                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ SYSTEM & HEALTH ]                                                                               |
|  GET    /health                              # Liveness and readiness probe                        |
|  GET    /api/v1/status                       # System component health & DB statistics             |
|                                                                                                    |
|  [ INGESTION & DATA QUALITY ]                                                                      |
|  POST   /api/v1/ingestion/sync               # Trigger sync from mock departmental repositories    |
|  GET    /api/v1/ingestion/runs               # Query historical ingestion batch logs               |
|  GET    /api/v1/data-quality/report          # Retrieve network data quality health metrics        |
|                                                                                                    |
|  [ MAINTENANCE TASKS & ASSETS ]                                                                    |
|  GET    /api/v1/tasks                        # List, search, filter pending & scheduled tasks      |
|  GET    /api/v1/tasks/{id}                   # Get detailed task record by ID                      |
|  POST   /api/v1/tasks                        # Manually create / inject a defect task              |
|  PATCH  /api/v1/tasks/{id}                   # Update task fields or lifecycle status              |
|  GET    /api/v1/tasks/{id}/explanation       # Retrieve SHAP explainability waterfall for task     |
|                                                                                                    |
|  [ PRIORITIZATION & CANDIDATE WINDOWS ]                                                            |
|  POST   /api/v1/prioritization/run           # Recompute AI priority scores across task queue      |
|  GET    /api/v1/prioritization               # List tasks ranked by dynamic priority score         |
|  GET    /api/v1/candidate-windows            # Query generated shadow blocks on corridor segments  |
|  GET    /api/v1/bundles                      # Query generated cross-departmental task bundles     |
|                                                                                                    |
|  [ OPTIMIZATION & SCHEDULES ]                                                                      |
|  POST   /api/v1/optimization/run             # Trigger OR-Tools CP-SAT block scheduling job        |
|  GET    /api/v1/optimization/runs/{id}       # Query status / logs of specific solver run          |
|  GET    /api/v1/schedules                    # List generated schedules                            |
|  GET    /api/v1/schedules/{id}               # Fetch complete schedule graph (blocks, tasks, gaps) |
|  POST   /api/v1/schedules/{id}/validate      # Run independent safety validator on schedule        |
|  POST   /api/v1/schedules/{id}/override      # Apply controller manual block adjustment            |
|  POST   /api/v1/schedules/{id}/approve       # Chief Controller sign-off (DRAFT -> APPROVED)       |
|  POST   /api/v1/schedules/{id}/publish       # Commit schedule for execution (APPROVED -> PUBLISHED)|
|  POST   /api/v1/reoptimize                   # Execute localized replanning after disruption       |
|                                                                                                    |
|  [ METRICS, CONFLICTS & AUDIT ]                                                                    |
|  GET    /api/v1/metrics                      # Real-time asset availability & downtime metrics     |
|  GET    /api/v1/conflicts                    # Unscheduled tasks & constraint diagnostics          |
|  GET    /api/v1/audit                        # Query immutable audit trail entries                 |
|  GET    /api/v1/export/csv                   # Download sanitized CSV schedule export              |
|  GET    /api/v1/export/json                  # Download structured JSON schedule export            |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Endpoint Specifications

### 3.1 `POST /api/v1/optimization/run`
Triggers an asynchronous or synchronous CP-SAT optimization job.

#### Request Body:
```json
{
  "corridor_ids": ["COR-DEL-AGR", "COR-MUM-BRC"],
  "horizon_days": 7,
  "solver_time_limit_sec": 30,
  "weights": {
    "unscheduled_task_penalty": 100.0,
    "asset_downtime_penalty": 25.0,
    "bundling_bonus": 40.0,
    "disruption_penalty": 20.0
  },
  "enforce_published_locks": true
}
```

#### Response Body (200 OK):
```json
{
  "run_id": "OPT-RUN-20260917-001",
  "status": "OPTIMAL",
  "solver_runtime_sec": 4.82,
  "schedule_id": "SCHED-20260917-01",
  "total_tasks_evaluated": 342,
  "tasks_scheduled": 328,
  "tasks_unscheduled": 14,
  "blocks_created": 84,
  "bundled_blocks_count": 52,
  "bundling_efficiency_pct": 61.9,
  "asset_availability_pct": 94.6,
  "total_block_hours_saved": 48.5,
  "hard_constraint_violations": 0,
  "validation_status": "VALIDATED"
}
```

---

### 3.2 `POST /api/v1/schedules/{id}/override`
Allows an authorized Section Controller to manually modify a block possession with real-time safety revalidation.

#### Request Body:
```json
{
  "block_id": "BLK-20260918-DEL-01",
  "action": "SHIFT_WINDOW",
  "new_start_time": "2026-09-18T02:00:00Z",
  "new_end_time": "2026-09-18T04:30:00Z",
  "reason": "Adjusting for delayed freight train #BOXN-22 path clearing"
}
```

#### Response Body (200 OK — Safe Override):
```json
{
  "success": true,
  "message": "Block shifted successfully. Zero safety violations detected.",
  "schedule_id": "SCHED-20260917-01",
  "new_version": 2,
  "audit_event_id": "AUD-EVT-20260917-0089",
  "validation_status": "PASS"
}
```

#### Response Body (400 Bad Request — Safety Conflict Detected):
```json
{
  "success": false,
  "error_code": "TRAIN_HEADWAY_CONFLICT",
  "message": "Override rejected: Proposed window overlaps with Premium Passenger Train #12002 (Bhopal Shatabdi) on Segment SEG-DEL-AGR-004 between 02:15 and 02:22 UTC.",
  "validation_status": "FAIL",
  "suggested_alternative_window": {
    "start": "2026-09-18T02:45:00Z",
    "end": "2026-09-18T05:15:00Z"
  }
}
```

---

### 3.3 `GET /api/v1/metrics`
Returns current operational availability KPIs for the command dashboard.

#### Response Body (200 OK):
```json
{
  "calculated_at": "2026-09-17T20:15:00Z",
  "planning_horizon_days": 7,
  "overall_network_availability_pct": 95.2,
  "total_corridor_track_hours": 1680.0,
  "total_maintenance_downtime_hours": 80.6,
  "block_hours_saved_by_bundling": 54.0,
  "downtime_reduction_pct": 40.1,
  "critical_task_clearance_rate_pct": 98.4,
  "average_solver_runtime_sec": 3.4,
  "corridor_breakdown": [
    {
      "corridor_id": "COR-DEL-AGR",
      "name": "Delhi - Agra Mainline",
      "availability_pct": 94.8,
      "scheduled_blocks": 28,
      "bundled_blocks": 19
    },
    {
      "corridor_id": "COR-MUM-BRC",
      "name": "Mumbai - Vadodara Trunk",
      "availability_pct": 95.6,
      "scheduled_blocks": 32,
      "bundled_blocks": 22
    }
  ]
}
```
