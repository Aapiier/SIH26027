# 26_IMPLEMENTATION_BACKLOG.md — Detailed Engineering Implementation Backlog

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Backlog Summary & Task Structure

Each task in the implementation backlog is keyed with a unique identifier, domain epic, assigned files, dependencies, strict acceptance criteria, and status.

```text
STATUS LEGEND:
[ ] = PENDING / READY FOR IMPLEMENTATION
[-] = IN PROGRESS
[X] = COMPLETED & VERIFIED
```

---

## 2. Engineering Epics & Granular Task Matrix

### EPIC 1: DATA ENGINEERING (`EPIC-DATA`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-DATA-01` | Synthetic Generator Core | `ml_models/mock_data_gen.py` | None | Produces 5 corridors, 40 segments, 1,500 defects, 250 trains with `seed=42`. | [ ] |
| `TSK-DATA-02` | 20 Correlated Scenarios | `ml_models/mock_data_gen.py` | `TSK-DATA-01` | Embeds 20 intentional test scenarios (happy bundles, bottlenecks, glitches). | [ ] |
| `TSK-DATA-03` | Source Connectors | `backend/app/ingestion/connectors/*.py` | `TSK-DATA-01` | Parses TMS, SMMS, TDMS, and COA CSV/JSON mock feeds. | [ ] |
| `TSK-DATA-04` | Normalization Engine | `backend/app/ingestion/normalizer.py` | `TSK-DATA-03` | Converts heterogeneous raw inputs into canonical relational schemas. | [ ] |
| `TSK-DATA-05` | Data Quality Gate | `backend/app/ingestion/data_quality.py` | `TSK-DATA-04` | Enforces 12 data validation checks; safely quarantines malformed records. | [ ] |

---

### EPIC 2: DATABASE & PERSISTENCE (`EPIC-DB`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-DB-01` | SQLAlchemy Base & Session | `backend/app/db/session.py` | None | Initializes SQLAlchemy 2.0 engine with SQLite and PostgreSQL compatibility. | [ ] |
| `TSK-DB-02` | Relational Entity Models | `backend/app/db/models/*.py` | `TSK-DB-01` | Implements 11 tables with foreign keys, check constraints, and indexes. | [ ] |
| `TSK-DB-03` | Data Access Repositories | `backend/app/db/repositories/*.py` | `TSK-DB-02` | Implements clean CRUD and query methods for tasks, windows, blocks, audit. | [ ] |
| `TSK-DB-04` | Database Migrations | `backend/alembic/` | `TSK-DB-02` | Generates and executes initial schema migration cleanly. | [ ] |

---

### EPIC 3: AI & MACHINE LEARNING (`EPIC-ML`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-ML-01` | Deterministic Safety Gate | `backend/app/engine/priority/safety_gate.py` | `TSK-DB-02` | Forces priority $\ge 95.0$ for critical safety defects (fractures, red signals). | [ ] |
| `TSK-ML-02` | 15-Feature Extractor | `backend/app/engine/priority/ml_scorer.py` | `TSK-DATA-04` | Extracts 15 domain features (overdue days, traffic density, asset age). | [ ] |
| `TSK-ML-03` | XGBoost Model Training | `ml_models/train_priority.py` | `TSK-ML-02` | Trains GBDT regressor on synthetic dataset with $R^2 \ge 0.90$. | [ ] |
| `TSK-ML-04` | SHAP Explainability | `backend/app/engine/priority/explainer.py` | `TSK-ML-03` | Computes feature attribution waterfall vectors for every scored task. | [ ] |
| `TSK-ML-05` | Deterministic Fallback | `backend/app/engine/priority/safety_gate.py` | `TSK-ML-01` | Falls back gracefully to weighted formula if model binary is missing. | [ ] |

---

### EPIC 4: CANDIDATE WINDOWS & BUNDLING (`EPIC-CAND`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-CAND-01` | Timetable Gap Extractor | `backend/app/engine/windows/gap_extractor.py` | `TSK-DB-03` | Scans segment occupancies, applies 15m buffers, emits candidate windows. | [ ] |
| `TSK-CAND-02` | Spatial Clustering Grouper | `backend/app/engine/bundling/spatial_cluster.py` | `TSK-CAND-01` | Clusters co-located tasks within $\le 5.0\text{ km}$ threshold. | [ ] |
| `TSK-CAND-03` | Compatibility Matrix | `backend/app/engine/bundling/compatibility.py` | `TSK-CAND-02` | Enforces electrical isolation and department tool co-existence rules. | [ ] |

---

### EPIC 5: CONSTRAINT OPTIMIZATION (`EPIC-OPT`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-OPT-01` | CP-SAT Decision Model | `backend/app/engine/optimizer/model_builder.py` | `TSK-CAND-03` | Defines boolean, integer, and interval decision variables in OR-Tools. | [ ] |
| `TSK-OPT-02` | 24 Hard Constraints | `backend/app/engine/optimizer/hard_constraints.py`| `TSK-OPT-01` | Implements all 24 hard constraints mathematically in CP-SAT model. | [ ] |
| `TSK-OPT-03` | 10 Soft Objectives | `backend/app/engine/optimizer/objectives.py` | `TSK-OPT-01` | Formulates composite multi-objective minimization function. | [ ] |
| `TSK-OPT-04` | CP-SAT Solver Runner | `backend/app/engine/optimizer/solver_runner.py` | `TSK-OPT-02` | Executes solver with 30s timeout; extracts scheduled block objects. | [ ] |
| `TSK-OPT-05` | Safety Validator | `backend/app/engine/validator/schedule_checker.py`| `TSK-OPT-04` | Independently verifies schedule against safety buffers and headways. | [ ] |
| `TSK-OPT-06` | Infeasibility Diagnostics | `backend/app/engine/diagnostics/conflict_tree.py` | `TSK-OPT-04` | Emits root-cause explanations for all unscheduled tasks. | [ ] |
| `TSK-OPT-07` | Targeted Re-Optimizer | `backend/app/engine/reoptimizer/replanner.py` | `TSK-OPT-04` | Re-optimizes impacted corridor subgraph upon train delay in $\le 5\text{s}$. | [ ] |

---

### EPIC 6: BACKEND APIS & SERVICES (`EPIC-API`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-API-01` | FastAPI App & Middleware | `backend/app/main.py`, `config.py` | `TSK-DB-01` | Configures CORS, exception handlers, and structured JSON logging. | [ ] |
| `TSK-API-02` | Ingestion Endpoints | `backend/app/api/v1/ingestion.py` | `TSK-DATA-05` | Exposes `POST /sync` and `GET /runs` with schema validation. | [ ] |
| `TSK-API-03` | Tasks & Priority APIs | `backend/app/api/v1/tasks.py`, `priority.py` | `TSK-ML-04` | Exposes task filtering, CRUD, and SHAP explanation endpoints. | [ ] |
| `TSK-API-04` | Optimization & Schedules | `backend/app/api/v1/optimization.py`, `schedules.py`| `TSK-OPT-05` | Exposes `/run`, `/schedules/{id}`, `/override`, `/approve`. | [ ] |
| `TSK-API-05` | Metrics & Audit APIs | `backend/app/api/v1/metrics.py`, `audit.py` | `TSK-OPT-04` | Computes availability KPIs; exposes immutable audit query route. | [ ] |
| `TSK-API-06` | Sanitized Export APIs | `backend/app/api/v1/export.py` | `TSK-API-04` | Generates CSV/JSON exports with CSV injection sanitization. | [ ] |

---

### EPIC 7: FRONTEND DASHBOARD (`EPIC-UI`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-UI-01` | React App & Design System | `frontend/src/App.jsx`, `index.css` | None | Configures Tailwind color tokens (Amber, Green, Blue) and routing. | [ ] |
| `TSK-UI-02` | Command Dashboard | `frontend/src/pages/CommandDashboard.jsx` | `TSK-API-05` | Renders KPI tiles, sync trigger button, and corridor health tables. | [ ] |
| `TSK-UI-03` | Task Queue & SHAP Modal | `frontend/src/pages/TaskQueue.jsx` | `TSK-API-03` | Filterable backlog table with interactive priority waterfall popover. | [ ] |
| `TSK-UI-04` | Interactive Gantt Canvas | `frontend/src/components/gantt/*.jsx` | `TSK-API-04` | Renders train graphs, candidate gaps, and scheduled blocks together. | [ ] |
| `TSK-UI-05` | Drag-to-Override Modal | `frontend/src/components/overrides/*.jsx` | `TSK-API-04` | Allows block shifting with real-time safety conflict warnings. | [ ] |
| `TSK-UI-06` | Conflicts & Exceptions | `frontend/src/pages/ConflictsExceptions.jsx` | `TSK-API-04` | Displays unscheduled tasks with root-cause chips and suggestions. | [ ] |
| `TSK-UI-07` | Weekly & Monthly Plans | `frontend/src/pages/WeeklyPlan.jsx`, `MonthlyPlan.jsx`| `TSK-API-04` | Displays actionable possession orders and 30-day capacity heatmaps. | [ ] |
| `TSK-UI-08` | Audit & Compliance Log | `frontend/src/pages/AuditCompliance.jsx` | `TSK-API-05` | Renders tamper-evident table of all overrides and approvals. | [ ] |

---

### EPIC 8: TESTING & DEMO HARDENING (`EPIC-QA`)

| Task ID | Task Title | Target Files / Modules | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TSK-QA-01` | Unit Test Suite | `backend/tests/unit/test_*.py` | `TSK-API-06` | Achieves $\ge 85\%$ test coverage across normalization, ML, and solver. | [ ] |
| `TSK-QA-02` | Integration Test Suite | `backend/tests/integration/test_*.py` | `TSK-API-06` | End-to-end testing: Ingestion $\to$ Priority $\to$ Solver $\to$ API. | [ ] |
| `TSK-QA-03` | Property-Based Invariants| `backend/tests/property/test_invariants.py`| `TSK-OPT-05` | Hypothesis tests assert zero train collisions and ordered durations. | [ ] |
| `TSK-QA-04` | 9 Scripted Demo Tests | `backend/tests/e2e/test_demo_scenarios.py` | `TSK-QA-02` | Verifies all 9 evaluation scenarios execute deterministically offline. | [ ] |
