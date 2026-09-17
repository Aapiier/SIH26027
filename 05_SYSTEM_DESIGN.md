# 05_SYSTEM_DESIGN.md — Modular System Design & Package Architecture

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Codebase Structure & Directory Layout

The repository is structured as a modular monolithic architecture with clean domain separation across backend, frontend, synthetic generation, and configuration layers.

```text
SIH26027/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint, middleware, router mount
│   │   ├── config.py                   # Centralized Pydantic BaseSettings & env loader
│   │   │
│   │   ├── api/                        # REST Route Handlers (FastAPI Routers)
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                 # Dependency injection (DB session, current user)
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── ingestion.py        # Trigger & query sync batches
│   │   │   │   ├── tasks.py            # Maintenance tasks CRUD & status
│   │   │   │   ├── priority.py         # Trigger scoring & retrieve ML explanations
│   │   │   │   ├── windows.py          # Candidate shadow-block queries
│   │   │   │   ├── bundles.py          # Candidate bundle listings
│   │   │   │   ├── optimization.py     # Submit optimization runs & fetch results
│   │   │   │   ├── schedules.py        # Schedule CRUD, overrides, approvals
│   │   │   │   ├── reoptimize.py       # Disruption response replanning endpoint
│   │   │   │   ├── metrics.py          # Uptime, downtime, and savings KPIs
│   │   │   │   ├── conflicts.py        # Infeasibility diagnostics & warnings
│   │   │   │   ├── audit.py            # Audit log queries
│   │   │   │   └── export.py           # Sanitized CSV / JSON streaming exports
│   │   │
│   │   ├── db/                         # Persistence & ORM Layer
│   │   │   ├── __init__.py
│   │   │   ├── session.py              # SQLAlchemy engine, sessionmaker, base model
│   │   │   ├── models/                 # SQLAlchemy 2.0 Declarative Models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── asset.py            # Corridors, Segments, Assets, Components
│   │   │   │   ├── task.py             # Defects, MaintenanceTasks, Dependencies
│   │   │   │   ├── timetable.py        # Trains, TrainRuns, OccupancyIntervals
│   │   │   │   ├── resource.py         # Crews, Machines, Equipment, Rosters
│   │   │   │   ├── candidate.py        # CandidateWindows, TaskBundles
│   │   │   │   ├── schedule.py         # OptimizationRuns, ScheduledBlocks, Items
│   │   │   │   └── audit.py            # AuditEvents, Users, Roles
│   │   │   └── repositories/           # Data Access Layer (Repository Pattern)
│   │   │       ├── task_repo.py
│   │   │       ├── timetable_repo.py
│   │   │       ├── candidate_repo.py
│   │   │       ├── schedule_repo.py
│   │   │       └── audit_repo.py
│   │   │
│   │   ├── schemas/                    # Pydantic Request / Response Models
│   │   │   ├── __init__.py
│   │   │   ├── task.py
│   │   │   ├── timetable.py
│   │   │   ├── candidate.py
│   │   │   ├── schedule.py
│   │   │   ├── metrics.py
│   │   │   └── audit.py
│   │   │
│   │   ├── ingestion/                  # Data Ingestion & Normalization Engine
│   │   │   ├── __init__.py
│   │   │   ├── connectors/             # Source Adapters
│   │   │   │   ├── tms_connector.py    # Track defect parser
│   │   │   │   ├── smms_connector.py   # Signal defect parser
│   │   │   │   ├── tdms_connector.py   # Electrical/OHE defect parser
│   │   │   │   └── coa_connector.py    # Train timetable parser
│   │   │   ├── normalizer.py           # Canonical schema mapping & spatial projection
│   │   │   └── data_quality.py         # 12-point validation check & health scorer
│   │   │
│   │   ├── engine/                     # Core Intelligence & Scheduling Algorithms
│   │   │   ├── __init__.py
│   │   │   ├── priority/               # Hybrid Prioritization
│   │   │   │   ├── safety_gate.py      # Hard rule escalation
│   │   │   │   ├── ml_scorer.py        # GBDT/XGBoost inference & fallback
│   │   │   │   └── explainer.py        # SHAP feature attribution generator
│   │   │   ├── windows/                # Candidate Shadow-Block Generator
│   │   │   │   ├── gap_extractor.py    # Timetable interval scanner
│   │   │   │   └── buffer_calc.py      # Setup / clearance / headway calculator
│   │   │   ├── bundling/               # Cross-Department Task Bundling
│   │   │   │   ├── spatial_cluster.py  # Geographic corridor proximity grouper
│   │   │   │   └── compatibility.py    # Isolation & tool co-existence matrix
│   │   │   ├── optimizer/              # OR-Tools CP-SAT Solver
│   │   │   │   ├── model_builder.py    # Decision variables & domain setup
│   │   │   │   ├── hard_constraints.py # 24 hard safety & operational constraints
│   │   │   │   ├── objectives.py       # 10 soft multi-objective weights
│   │   │   │   └── solver_runner.py    # CP-SAT invocation, timeout & callback
│   │   │   ├── validator/              # Independent Schedule Safety Verifier
│   │   │   │   └── schedule_checker.py # Deterministic post-solver assertion suite
│   │   │   ├── diagnostics/            # Infeasibility & Root Cause Explainer
│   │   │   │   └── conflict_tree.py    # Unscheduled task reason extractor
│   │   │   ├── horizons/               # Multi-Horizon Planning
│   │   │   │   ├── weekly_planner.py   # Granular 7-day tactical schedule generator
│   │   │   │   └── monthly_planner.py  # 30-day strategic capacity forecaster
│   │   │   └── reoptimizer/            # Targeted Disruption Replanning
│   │   │       └── replanner.py        # Impacted subgraph localized solver
│   │   │
│   │   └── utils/                      # Common Utilities
│   │       ├── logging.py              # Structured JSON logging
│   │       ├── security.py             # JWT & password hashing
│   │       └── time_utils.py           # UTC/IST conversion & interval math
│   │
│   ├── tests/                          # Automated Pytest Suite
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── property/
│   │   └── e2e/
│   ├── requirements.txt                # Backend dependencies
│   └── alembic/                        # Database migration scripts
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                    # React entrypoint
│   │   ├── App.jsx                     # Route definitions & layout wrapper
│   │   ├── index.css                   # Tailwind / custom CSS tokens
│   │   ├── api/                        # Axios / Fetch API client
│   │   │   └── client.js
│   │   ├── components/                 # Reusable UI Components
│   │   │   ├── common/                 # Header, Sidebar, MetricCard, Modal, Badge
│   │   │   ├── gantt/                  # Interactive Timeline Visualizer
│   │   │   │   ├── GanttChart.jsx
│   │   │   │   ├── TrainLayer.jsx
│   │   │   │   ├── BlockLayer.jsx
│   │   │   │   └── GapLayer.jsx
│   │   │   ├── map/                    # Network Corridor Visualizer
│   │   │   ├── tasks/                  # Task Table & SHAP Waterfall Explainer
│   │   │   ├── overrides/              # Override Modal & Justification Form
│   │   │   └── conflicts/              # Infeasibility & Diagnostic Accordion
│   │   ├── pages/                      # Application Route Views
│   │   │   ├── CommandDashboard.jsx    # Operational KPI Summary
│   │   │   ├── TaskQueue.jsx           # Filterable Maintenance Backlog
│   │   │   ├── OptimizationCenter.jsx  # Solver Controls & Parameter Tuner
│   │   │   ├── GanttSchedule.jsx       # Full-Screen Interactive Timetable
│   │   │   ├── GeographicMap.jsx       # Corridor Geospatial Status
│   │   │   ├── WeeklyPlan.jsx          # Actionable 7-Day Possession Orders
│   │   │   ├── MonthlyPlan.jsx         # 30-Day Strategic Forecast
│   │   │   ├── ConflictsExceptions.jsx # Unscheduled Task Root Causes
│   │   │   └── AuditCompliance.jsx     # Immutable Audit Log Viewer
│   │   ├── context/                    # React Context (Auth, Schedule, Filter)
│   │   └── hooks/                      # Custom React Hooks
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── data/
│   ├── synthetic/                      # Seeded synthetic CSV / JSON datasets
│   │   ├── tms_defects.csv
│   │   ├── smms_defects.csv
│   │   ├── tdms_defects.csv
│   │   ├── coa_timetables.csv
│   │   └── freight_forecasts.json
│   └── exports/                        # Generated CSV/JSON schedule exports
│
├── ml_models/                          # ML Training Scripts & Pickled Models
│   ├── train_priority.py               # XGBoost training pipeline
│   ├── evaluate_model.py               # Confusion matrix & calibration curves
│   ├── mock_data_gen.py                # Deterministic synthetic data generator
│   └── saved/                          # Serialized GBDT models & preprocessors
│       └── priority_xgb_v1.json
│
└── 00_DOCUMENTATION_INDEX.md           # Master Documentation Set (00 to 27)
```

---

## 2. Core Module Specifications

### 2.1 Ingestion & Normalization Module (`backend/app/ingestion/`)
- **Primary Class:** `IngestionPipeline`
- **Responsibilities:**
  1. Coordinate source connectors (`TMSConnector`, `SMMSConnector`, `TDMSConnector`, `COAConnector`).
  2. Parse heterogeneous formats and extract raw fields.
  3. Standardize timestamps, station chains, and department identifiers.
  4. Perform data quality checks via `DataQualityChecker` and reject invalid records safely.
- **Key Methods:**
  - `sync_all(sources: List[str]) -> IngestionSummary`
  - `normalize_task(raw_data: dict, dept: str) -> NormalizedTask`
  - `validate_batch(tasks: List[NormalizedTask]) -> QualityReport`
- **Error Handling:** Records failing validation are written to `rejected_records` with exact error codes; valid rows are committed transactionally.

### 2.2 Prioritization Engine (`backend/app/engine/priority/`)
- **Primary Class:** `HybridPriorityEngine`
- **Responsibilities:**
  1. Execute deterministic safety gate rules (`SafetyGateChecker`).
  2. If not an immediate safety emergency, run feature transformation and execute GBDT model inference (`MLScorer`).
  3. Generate SHAP waterfall feature attribution breakdown (`SHAPExplainer`).
  4. Fall back to weighted deterministic scoring if model file is corrupted or missing.
- **Key Methods:**
  - `score_task(task: MaintenanceTask) -> PriorityResult`
  - `batch_score(tasks: List[MaintenanceTask]) -> List[PriorityResult]`
  - `explain_score(task_id: str) -> FeatureExplanation`

### 2.3 Candidate Shadow-Block Generator (`backend/app/engine/windows/`)
- **Primary Class:** `CandidateWindowGenerator`
- **Responsibilities:**
  1. Load train movements and freight paths for each corridor segment.
  2. Scan the temporal interval $[0, T_{\text{horizon}}]$ to locate unoccupied gaps between consecutive trains.
  3. Subtract setup buffer $T_{\text{setup}}$ and clearance buffer $T_{\text{clear}}$.
  4. Verify minimum viable block duration ($T_{\text{gap}} \ge T_{\text{min\_block}}$).
- **Key Methods:**
  - `generate_windows(segment_id: str, horizon_days: int) -> List[CandidateWindow]`
  - `filter_conflicting_traffic(window: CandidateWindow) -> bool`

### 2.4 Task Bundling Engine (`backend/app/engine/bundling/`)
- **Primary Class:** `TaskBundlingEngine`
- **Responsibilities:**
  1. Cluster tasks geographically by corridor segment and proximity ($\le 5\text{ km}$).
  2. Evaluate departmental co-existence rules (e.g., track tamping + signal cable work).
  3. Verify power cutoff and electrical isolation compatibility.
  4. Construct composite `TaskBundle` objects with aggregate priority and joint duration.
- **Key Methods:**
  - `form_bundles(tasks: List[MaintenanceTask], windows: List[CandidateWindow]) -> List[TaskBundle]`
  - `check_isolation_compatibility(task_a: MaintenanceTask, task_b: MaintenanceTask) -> bool`

### 2.5 Optimization Solver (`backend/app/engine/optimizer/`)
- **Primary Class:** `BlockOptimizationSolver`
- **Responsibilities:**
  1. Instantiate Google OR-Tools `CpModel`.
  2. Create decision variables: task execution boolean $x_i$, block start/end integer variables, resource allocation booleans.
  3. Add 24 hard constraints via `HardConstraintBuilder`.
  4. Build composite multi-objective function via `ObjectiveBuilder`.
  5. Solve with deterministic multi-threading and timeout limits.
  6. Extract scheduled blocks, assigned tasks, and objective metrics.
- **Key Methods:**
  - `build_model(tasks: List[TaskBundle], windows: List[CandidateWindow]) -> CpModel`
  - `solve(time_limit_sec: int) -> OptimizationSolution`

### 2.6 Independent Schedule Validator (`backend/app/engine/validator/`)
- **Primary Class:** `IndependentScheduleValidator`
- **Responsibilities:**
  1. Perform rigorous post-solver verification on all scheduled blocks.
  2. Assert zero train headway conflicts, zero resource concurrency conflicts, and strict buffer preservation.
  3. Mark schedule status as `VALIDATED` or `REJECTED_BY_VALIDATOR`.
- **Key Methods:**
  - `verify_schedule(schedule: Schedule) -> ValidationReport`

---

## 3. Exception Taxonomy & Error Handling

```text
RailSyncException (Base)
├── DataIngestionException
│   ├── SchemaMismatchException
│   ├── CorruptPayloadException
│   └── SourceUnreachableException
├── DataQualityException
│   ├── InvalidKilometerChainageException
│   ├── NegativeDurationException
│   └── StaleDataException
├── PriorityEngineException
│   ├── ModelInferenceException (triggers fallback)
│   └── FeatureExtractionException
├── OptimizationException
│   ├── SolverTimeoutException
│   ├── InfeasibleModelException
│   └── ModelBuildException
├── ScheduleValidationException
│   ├── TrainHeadwayViolationException
│   ├── ResourceOverlapException
│   └── BufferBreachedException
└── SecurityAndOverrideException
    ├── UnauthorizedActionException
    ├── InvalidOverrideException
    └── AuditWriteException
```
