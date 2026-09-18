# 06_END_TO_END_WORKFLOW.md — End-to-End Operational Workflows

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Operational Workflow Catalog

| Workflow ID | Workflow Name | Description | Trigger | Actors / Systems |
| :--- | :--- | :--- | :--- | :--- |
| **Workflow A** | Initial & Periodic Data Sync | Ingestion, validation, normalization, deduplication, and data quality scoring | Scheduled timer / Manual Sync click | Connectors, Normalizer, Relational DB |
| **Workflow B** | Task Prioritization & Risk Scoring | Deterministic safety gating, ML risk inference, and SHAP feature attribution | Ingestion completion / On-demand | Safety Gate, XGBoost Model, Explainer |
| **Workflow C** | Candidate Shadow-Block Generation | Timetable gap scanning, buffer subtraction, and freight path analysis | Timetable update / Prioritization | Timetable Scanner, Buffer Engine |
| **Workflow D** | Cross-Department Task Bundling | Spatial clustering ($\le 5\text{ km}$), isolation and equipment compatibility checks | Candidate window generation | Bundling Engine, Compatibility Matrix |
| **Workflow E** | Mathematical Schedule Optimization | CP-SAT model building, hard constraint solving, multi-objective optimization | Controller trigger / Batch schedule run | OR-Tools Solver, Model Builder |
| **Workflow F** | Independent Safety Validation | Post-solver deterministic verification of all safety buffers and train headways | Solver completion | Independent Safety Validator |
| **Workflow G** | Human Review, Override & Approval | Gantt visualization, conflict review, manual adjustments, audit logging | Controller action | Section Controller, Chief Controller |
| **Workflow H** | Disruption Response & Re-Optimization | Dynamic localized replanning after train delays, cancellations, or emergency defects | Disruption event / Feed alert | Replanning Engine, Auditor |
| **Workflow I** | Multi-Horizon Plan Delivery | Publication of 7-day Weekly Operational Schedule and 30-day Monthly Strategic Plan | Final approval | Export Service, Dashboard UI |

---

## 2. Sequence Diagrams & Workflow Specifications

### Workflow A: Data Ingestion, Validation & Normalization Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Controller / System Timer
    participant API as FastAPI Ingestion Router
    participant Conn as Source Connectors (TMS/SMMS/TDMS/COA)
    participant DQ as Data Quality Gate
    participant Norm as Normalization Engine
    participant DB as Relational Database
    participant Aud as Audit Logger

    User->>API: POST /api/v1/ingestion/sync
    API->>Conn: Fetch raw records from mock source repositories
    Conn-->>API: Return raw CSV/JSON records
    API->>DQ: Validate schemas, ranges & check null constraints
    alt Malformed / Invalid Records Detected
        DQ->>DB: Write to rejected_records with error codes
        DQ->>Aud: Log data quality warning event
    end
    DQ-->>API: Validated record set
    API->>Norm: Transform codes, convert chainage to segment IDs, normalize UTC/IST
    Norm->>DB: Upsert normalized tasks, assets, and timetable intervals
    API->>Aud: Commit Ingestion Batch metadata (count, checksum, duration)
    API-->>User: 200 OK (Ingestion Summary & DQ Score)
```

---

### Workflow B: Task Prioritization & Explainable Risk Scoring

```mermaid
sequenceDiagram
    autonumber
    participant TaskSvc as Task Service
    participant Gate as Safety Rule Gate
    participant ML as ML Priority Scorer (GBDT)
    participant SHAP as Explainer Engine
    participant DB as Relational Database

    TaskSvc->>DB: Fetch pending tasks (status = 'PENDING')
    loop For Each Task
        TaskSvc->>Gate: Evaluate hard safety escalation rules
        alt Critical Safety Defect (e.g., Rail Fracture, Red Signal)
            Gate-->>TaskSvc: Priority = 95.0 (EMERGENCY, Rule Forced)
        else Routine / Preventive Defect
            TaskSvc->>ML: Extract features & predict risk score
            alt ML Model Available
                ML-->>TaskSvc: Priority = 78.4 (HIGH, ML Inferred)
                TaskSvc->>SHAP: Generate feature contributions (+20 Overdue, +15 Traffic)
                SHAP-->>TaskSvc: SHAP waterfall vector
            else Model Missing / Inference Error
                TaskSvc->>Gate: Fall back to deterministic weighted formula
                Gate-->>TaskSvc: Priority = 75.0 (HIGH, Fallback Rule)
            end
        end
        TaskSvc->>DB: Update task priority score, category, and explanation JSON
    end
```

---

### Workflow C & D: Candidate Block Generation & Multi-Department Bundling

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Optimization Engine
    participant TT as Timetable Store
    participant WinGen as Candidate Window Generator
    participant BndGen as Bundling Engine
    participant DB as Relational Database

    Engine->>TT: Fetch train runs and freight forecasts for corridor
    Engine->>WinGen: Scan segment time intervals for gaps Δt ≥ T_min
    loop For Each Segment Gap
        WinGen->>WinGen: Subtract T_setup (15m) and T_clear (15m)
        WinGen->>WinGen: Check train safety headway margin
        WinGen-->>Engine: Emit verified CandidateWindow
    end
    Engine->>DB: Fetch prioritized tasks for corridor
    Engine->>BndGen: Cluster tasks by segment & proximity (≤ 5 km)
    loop For Each Cluster
        BndGen->>BndGen: Verify electrical isolation & tool co-existence
        alt Compatible Engineering + Signal + Electrical Tasks
            BndGen-->>Engine: Form composite TaskBundle (Combined duration, sum priority)
        else Incompatible Tasks
            BndGen-->>Engine: Keep as independent single tasks
        end
    end
    Engine->>DB: Persist candidate windows and bundles
```

---

### Workflow E & F: Constraint Optimization & Independent Safety Verification

```mermaid
sequenceDiagram
    autonumber
    actor Controller as Section Controller
    participant API as Optimization API
    participant Solver as OR-Tools CP-SAT Solver
    participant Val as Independent Safety Validator
    participant DB as Relational Database

    Controller->>API: POST /api/v1/optimization/run (Horizon = 7 Days)
    API->>Solver: Build model (Interval Variables, 24 Hard Constraints, 10 Objectives)
    Solver->>Solver: Solve CP-SAT (Max 30s timeout)
    alt Solver Status == OPTIMAL or FEASIBLE
        Solver-->>API: Return schedule assignment (blocks, start/end, tasks)
        API->>Val: Execute independent safety assertions
        alt Zero Safety Violations
            Val-->>API: Validation Certificate = PASS
            API->>DB: Persist schedule as 'RECOMMENDED'
            API-->>Controller: 200 OK (Schedule ID, Uptime Metrics, Gantt Ready)
        else Safety Buffer / Headway Violation Detected
            Val-->>API: Validation Certificate = FAIL (Violation Details)
            API->>DB: Flag schedule as 'REJECTED_BY_VALIDATOR'
            API-->>Controller: 500 Optimization Validation Error
        end
    else Solver Status == INFEASIBLE / TIMEOUT
        Solver-->>API: Infeasible / No Solution Found
        API->>DB: Record Infeasibility Diagnostics
        API-->>Controller: 422 Unprocessable Entity (Root-Cause Report)
    end
```

---

### Workflow G: Human Review, Manual Override & Official Approval

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Chief Controller
    participant UI as React Control Dashboard
    participant API as Schedule API
    participant Val as Independent Validator
    participant DB as Relational Database
    participant Aud as Audit Logger

    Officer->>UI: View recommended schedule on interactive Gantt
    Officer->>UI: Adjust block: Shift Block-42 by +60 min (with Reason: "Delayed Freight")
    UI->>API: POST /api/v1/schedules/{id}/override
    API->>Val: Run real-time validation on modified block
    alt Override is Safe (No train conflict)
        Val-->>API: Validated
        API->>DB: Save updated schedule (Version = Version + 1)
        API->>Aud: Log override event (User, Old Time, New Time, Reason)
        API-->>UI: 200 OK (Updated Gantt rendered)
    else Override Causes Train Conflict
        Val-->>API: Infeasible (Conflict with Train #12002 at 03:15)
        API-->>UI: 400 Bad Request (Actionable Conflict Warning)
    end
    Officer->>UI: Click "Approve & Publish Plan"
    UI->>API: POST /api/v1/schedules/{id}/approve
    API->>DB: Update status to 'APPROVED' / 'PUBLISHED'
    API->>Aud: Log publication event
    API-->>UI: 200 OK (Final Master Plan Active)
```

---

### Workflow H: Disruption Response & Targeted Re-Optimization

```mermaid
sequenceDiagram
    autonumber
    actor Dispatcher as Section Controller
    participant API as Re-Optimization API
    participant Replanner as Localized Replanning Engine
    participant DB as Relational Database
    participant Aud as Audit Logger

    Dispatcher->>API: POST /api/v1/reoptimize (Disruption: Train #12951 Delayed 90m)
    API->>DB: Identify impacted corridor segments & future blocks
    API->>Replanner: Lock past/unaffected approved blocks
    Replanner->>Replanner: Recompute candidate gaps on impacted segments
    Replanner->>Replanner: Solve localized CP-SAT model for displaced tasks
    Replanner-->>API: Revised schedule patch
    API->>DB: Save provisional schedule comparison
    API->>Aud: Log disruption event and re-optimization trigger
    API-->>Dispatcher: 200 OK (Plan Diff: Old vs. New for Review)
```
