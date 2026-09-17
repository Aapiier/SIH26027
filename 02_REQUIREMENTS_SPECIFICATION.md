# 02_REQUIREMENTS_SPECIFICATION.md — Functional and Non-Functional Requirements Specification

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Requirement Classification Framework

Requirements are classified according to the following conventions:
- **Functional Requirements (`FR-XXX`):** Specify exact software behaviors, algorithms, data transformations, and workflows.
- **Non-Functional Requirements (`NFR-XXX`):** Specify system qualities including performance, security, offline capability, determinism, and usability.
- **Classification Tag:**
  - `[SOURCE-BACKED]`: Directly derived from the SIH26027 problem statement.
  - `[ENGINEERING ASSUMPTION]`: Explicit engineering design choice for a robust, deterministic system.
  - `[SYNTHETIC DEMO ASSUMPTION]`: Requirement tailored for reproducible hackathon demonstration.
  - `[OPTIONAL ENHANCEMENT]`: Scalability requirement for enterprise deployment.

---

## 2. Functional Requirements Specification

### 2.1 Ingestion & Data Normalization

#### `FR-001` — TMS Data Ingestion `[SOURCE-BACKED]`
- **Description:** Ingest track maintenance requests, geometry defect logs, rail wear measurements, USFD weld inspection alerts, and tamping backlog from simulated Track Management System.
- **Input:** CSV file or JSON payload containing TMS defect records.
- **Processing:** Parse schema, validate kilometer markers, check required fields, flag null values.
- **Output:** Staged raw TMS records with unique ingestion batch ID and timestamp.
- **Acceptance Criteria:** Ingests 1,000+ TMS records without failure; flags malformed rows without crashing.
- **Test ID:** `TC-ING-001`

#### `FR-002` — SMMS Data Ingestion `[SOURCE-BACKED]`
- **Description:** Ingest signaling maintenance items, point machine health logs, track circuit failure alerts, and telecom cable upkeep tasks from simulated Signalling Maintenance & Management System.
- **Input:** CSV file or JSON payload containing SMMS defect records.
- **Processing:** Parse schema, map signal gear IDs to corridor segments, check severity codes.
- **Output:** Staged raw SMMS records with ingestion metadata.
- **Acceptance Criteria:** Correctly maps signal equipment to parent track segment IDs.
- **Test ID:** `TC-ING-002`

#### `FR-003` — TDMS Data Ingestion `[SOURCE-BACKED]`
- **Description:** Ingest Traction Distribution maintenance records, OHE wire wear, insulator inspection logs, and electrical power substation maintenance demands from simulated TDMS.
- **Input:** CSV file or JSON payload containing TDMS defect records.
- **Processing:** Parse schema, extract electrical isolation requirements (`requires_power_cutoff`), map tension logs.
- **Output:** Staged raw TDMS records with electrical isolation flags.
- **Acceptance Criteria:** Correctly flags tasks requiring power shutdowns.
- **Test ID:** `TC-ING-003`

#### `FR-004` — COA Passenger Train Timetable Ingestion `[SOURCE-BACKED]`
- **Description:** Ingest published Control Office Application passenger train schedules, station arrival/departure times, route segment traversal intervals, and train priorities.
- **Input:** CSV file or JSON payload containing scheduled train movements.
- **Processing:** Calculate corridor segment occupancy intervals $[t_{\text{entry}}, t_{\text{exit}}]$ for each train.
- **Output:** Unified train movement schedule mapped to discrete corridor segments.
- **Acceptance Criteria:** Generates time-stamped occupancy blocks for all scheduled trains across all corridors.
- **Test ID:** `TC-ING-004`

#### `FR-005` — Goods Train Traffic Forecast Ingestion `[SOURCE-BACKED]`
- **Description:** Ingest freight path forecasts and demand estimates from Control Office feeds.
- **Input:** JSON payload with freight train window forecasts, estimated speed, and uncertainty bounds.
- **Processing:** Differentiate confirmed timetables from probabilistic freight paths; apply conservative headway buffers.
- **Output:** Freight occupancy windows with uncertainty confidence scores.
- **Acceptance Criteria:** Unconfirmed freight paths do not hard-lock shadow blocks but apply weighted disruption penalties.
- **Test ID:** `TC-ING-005`

#### `FR-006` — Unified Normalization Pipeline `[SOURCE-BACKED]`
- **Description:** Normalize heterogeneous records from TMS, SMMS, TDMS, and COA into a standardized canonical relational schema.
- **Input:** Staged raw records from all ingestion sources.
- **Processing:** Standardize department codes (`ENG`, `SIG`, `TRD`), convert timestamps to ISO-8601 UTC/IST, map spatial coordinates to Corridor-Segment-Km hierarchy.
- **Output:** Validated, normalized records stored in `maintenance_tasks`, `assets`, `train_movements`.
- **Acceptance Criteria:** 100% of valid ingested records conform to the canonical database schema.
- **Test ID:** `TC-NORM-001`

#### `FR-007` — Data Quality Validation & Anomaly Detection `[ENGINEERING ASSUMPTION]`
- **Description:** Perform 12 automated data health checks (e.g., negative durations, invalid kilometer markers, missing foreign keys, overlapping impossible records).
- **Input:** Normalized task and timetable records.
- **Processing:** Run validation rules; assign record quality status (`VALID`, `FLAGGED`, `REJECTED`).
- **Output:** Data Quality Report with error codes, rejected record log, and completeness score.
- **Acceptance Criteria:** Rejects invalid records safely; logs explicit failure reasons in audit store.
- **Test ID:** `TC-VAL-001`

---

### 2.2 Intelligence & Candidate Window Engines

#### `FR-008` — Hybrid Task Prioritization Engine `[SOURCE-BACKED]`
- **Description:** Compute a dynamic priority score $\mathcal{P} \in [0, 100]$ for every pending maintenance task using a hybrid rule-based safety gate and GBDT/XGBoost tabular model.
- **Input:** Normalized task features (defect severity, asset criticality, overdue days, traffic density, failure history).
- **Processing:** Apply hard safety escalation rules $\to$ Compute ML risk score $\to$ Combine into calibrated final priority score.
- **Output:** Prioritized task record with priority score, priority class (`EMERGENCY`, `HIGH`, `MEDIUM`, `LOW`), and SHAP feature contributions.
- **Acceptance Criteria:** Safety-critical defects receive $\mathcal{P} \ge 90$ regardless of ML inference output; explainability factors are persisted.
- **Test ID:** `TC-PRI-001`

#### `FR-009` — Candidate Shadow-Block Generation Engine `[SOURCE-BACKED]`
- **Description:** Identify natural timetable gaps between scheduled passenger trains and freight paths across all corridor segments.
- **Input:** Train movement schedule, safety headway parameters, setup buffer $T_{\text{setup}}$, clearance buffer $T_{\text{clear}}$.
- **Processing:** For each segment, compute $\Delta t = t_{\text{entry}}(T_{k+1}) - t_{\text{exit}}(T_k) - (T_{\text{setup}} + T_{\text{clear}})$. If $\Delta t \ge T_{\text{min\_block}}$, emit candidate window.
- **Output:** List of verified candidate shadow-block windows per corridor segment.
- **Acceptance Criteria:** Candidate windows never overlap with scheduled train movement safety envelopes.
- **Test ID:** `TC-CWG-001`

#### `FR-010` — Cross-Department Task Bundling Engine `[SOURCE-BACKED]`
- **Description:** Identify and bundle spatially adjacent, temporally compatible maintenance tasks across Engineering, S&T, and TRD into composite block demands.
- **Input:** Prioritized task list, asset spatial coordinates, candidate windows, compatibility rules.
- **Processing:** Evaluate spatial proximity ($\le 5\text{ km}$), time window overlap, machine/crew compatibility, electrical isolation co-existence.
- **Output:** Candidate task bundles with estimated combined duration and aggregate priority.
- **Acceptance Criteria:** Incompatible tasks (e.g., simultaneous blasting and delicate optical fiber splicing) are strictly prevented from bundling.
- **Test ID:** `TC-BND-001`

---

### 2.3 Optimization & Mathematical Scheduling

#### `FR-011` — Constraint-Based Master Scheduling Engine `[SOURCE-BACKED]`
- **Description:** Formulate and solve the block scheduling problem using Google OR-Tools CP-SAT constraint programming.
- **Input:** Candidate shadow blocks, task bundles, individual tasks, resource availability constraints, objective weights.
- **Processing:** Enforce 24 hard constraints; optimize multi-objective function (minimize downtime, maximize high-priority completion, maximize bundling efficiency, minimize train disruption).
- **Output:** Optimized schedule assignment: task-to-window mappings, scheduled start/end times, allocated resources.
- **Acceptance Criteria:** Solver completes within configured timeout (e.g., $\le 30\text{s}$); zero hard constraints violated.
- **Test ID:** `TC-OPT-001`

#### `FR-012` — Weekly Operational Plan Generation `[SOURCE-BACKED]`
- **Description:** Generate a 7-day, high-granularity operational schedule with exact minute-level block start/end times, allocated crews, and track possessions.
- **Input:** Solver solution for rolling 7-day horizon.
- **Processing:** Format scheduled blocks into operational possession orders; link to train graphs.
- **Output:** Weekly Operational Plan object with block IDs, task manifests, and resource rosters.
- **Acceptance Criteria:** Every scheduled task has an unambiguous start time, end time, corridor segment, and assigned department gang.
- **Test ID:** `TC-MHP-001`

#### `FR-013` — Monthly Strategic Capacity Plan Generation `[SOURCE-BACKED]`
- **Description:** Generate a 30-day strategic capacity forecast highlighting maintenance volume, corridor load, resource bottlenecks, and backlog trends.
- **Input:** 30-day pending task backlog, monthly train timetables, crew availability forecasts.
- **Processing:** Aggregate task demand into weekly strategic buckets; compute corridor utilization ratios.
- **Output:** Monthly Strategic Plan with projected asset availability and deferral risk analysis.
- **Acceptance Criteria:** Accurately forecasts resource deficit hotspots over a 30-day forward window.
- **Test ID:** `TC-MHP-002`

#### `FR-014` — Independent Schedule Safety Validation `[ENGINEERING ASSUMPTION]`
- **Description:** Post-optimization verification engine that independently validates the generated schedule against all safety and operational rules before presenting it to the user.
- **Input:** Generated schedule object, canonical train timetable, resource catalog.
- **Processing:** Perform deterministic assertions: zero train overlap, zero resource double-booking, buffers preserved, duration validity.
- **Output:** Validation Certificate (`PASS` / `FAIL`) with detailed violation diagnostic log.
- **Acceptance Criteria:** Invalid schedule is blocked from being marked `RECOMMENDED` or `APPROVED`.
- **Test ID:** `TC-VAL-002`

---

### 2.4 Human-in-the-Loop, Control & Auditability

#### `FR-015` — Human Review & Override Interface `[SOURCE-BACKED]`
- **Description:** Provide Section Controllers and Chief Controllers with the ability to review, modify, shift, split, insert emergency tasks, or cancel scheduled blocks.
- **Input:** Controller modification payload via UI/API with mandatory justification text.
- **Processing:** Trigger real-time incremental re-validation of proposed changes against hard safety constraints.
- **Output:** Updated schedule version or rejection notice with explanation if change violates hard safety rules.
- **Acceptance Criteria:** Hard safety violations cannot be forced; all valid overrides increment schedule version.
- **Test ID:** `TC-OVR-001`

#### `FR-016` — Immutable Audit Logging `[SOURCE-BACKED]`
- **Description:** Maintain an append-only, tamper-resistant audit trail recording every ingestion, optimization run, manual override, approval, and publication event.
- **Input:** System events and user actions with user ID, timestamp, entity ID, old value, new value, reason.
- **Processing:** Persist audit events to relational store with cryptographic hash verification.
- **Output:** Queryable audit history accessible via API and UI.
- **Acceptance Criteria:** 100% of schedule mutations generate traceable audit entries.
- **Test ID:** `TC-AUD-001`

#### `FR-017` — Explainable AI & Infeasibility Diagnostics `[SOURCE-BACKED]`
- **Description:** Provide clear, human-understandable explanations for why a task was prioritized, why tasks were bundled, and why an unscheduled task could not fit in the current horizon.
- **Input:** Solver diagnostics, unscheduled task IDs, SHAP values, candidate window logs.
- **Processing:** Categorize unscheduled root causes (`NO_TIME_WINDOW`, `RESOURCE_CONFLICT`, `DURATION_EXCEEDS_GAP`, `DEPENDENCY_UNMET`, `ISOLATION_CONFLICT`).
- **Output:** Human-readable explanations displayed in Task Detail and Exception Queue views.
- **Acceptance Criteria:** 100% of unscheduled tasks display explicit root-cause diagnostic reasons.
- **Test ID:** `TC-EXP-001`

#### `FR-018` — Plan Import & Export Capabilities `[SOURCE-BACKED]`
- **Description:** Export approved schedules, task lists, and data quality reports in standardized CSV and JSON formats compatible with legacy railway systems.
- **Input:** Export request parameters (date range, corridor, format).
- **Processing:** Serialize database entities; sanitize strings against CSV formula injection.
- **Output:** Downloadable CSV/JSON file stream.
- **Acceptance Criteria:** Exported files pass CSV injection sanitization and conform to schema.
- **Test ID:** `TC-EXP-002`

#### `FR-019` — Disruption Response & Targeted Re-Optimization `[SOURCE-BACKED]`
- **Description:** Dynamically adjust the schedule when operational disruptions occur (e.g., train delays $>30\text{ min}$, emergency rail fractures, cancelled crew).
- **Input:** Disruption event payload (delayed train ID, new defect ID, unavailable corridor).
- **Processing:** Mark affected future blocks as `STALE`; preserve unaffected approved blocks; execute targeted re-optimization on impacted scope.
- **Output:** Revised schedule comparison (Old vs. New) requiring controller confirmation.
- **Acceptance Criteria:** Re-optimizes impacted corridor within $\le 5\text{ seconds}$ without modifying unimpacted historical blocks.
- **Test ID:** `TC-DIS-001`

---

## 3. Non-Functional Requirements Specification

| Requirement ID | Quality Attribute | Specification & Acceptance Target | Tag | Test ID |
| :--- | :--- | :--- | :--- | :--- |
| `NFR-001` | **Local / Offline Execution** | System must run 100% locally on standard PC/laptop hardware without requiring active internet or external cloud APIs. | `[SOURCE-BACKED]` | `TC-NFR-001` |
| `NFR-002` | **Deterministic Reproducibility** | Given identical input datasets, fixed random seeds, and solver parameters, the system must produce identical schedules and ML scores. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-002` |
| `NFR-003` | **Optimization Performance** | Solver must compute an optimal/near-optimal 7-day schedule for 1,000+ tasks and 10 corridors in $\le 30\text{ seconds}$. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-003` |
| `NFR-004` | **API Latency** | Read endpoints must respond in $\le 200\text{ ms}$; data ingestion and normalization pipelines must process 5,000 records in $\le 3\text{ seconds}$. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-004` |
| `NFR-005` | **Data Integrity & Safety** | Zero tolerance for schedule corruption; system must never generate overlapping train-maintenance possession on the same track segment. | `[SOURCE-BACKED]` | `TC-NFR-005` |
| `NFR-006` | **Auditability & Traceability** | Every schedule state transition (DRAFT $\to$ RECOMMENDED $\to$ APPROVED $\to$ PUBLISHED) and override must be logged immutably with timestamp and user ID. | `[SOURCE-BACKED]` | `TC-NFR-006` |
| `NFR-007` | **Explainability** | All AI prioritization decisions and solver infeasibilities must be explainable in plain domain language without raw code traces. | `[SOURCE-BACKED]` | `TC-NFR-007` |
| `NFR-008` | **Security & Access Control** | Enforce Role-Based Access Control (RBAC) across three roles: `ADMIN`, `CHIEF_CONTROLLER`, and `DEPARTMENT_ENGINEER`. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-008` |
| `NFR-009` | **Input Sanitization** | All inputs (CSV imports, API payloads, override comments) must be sanitized against SQL injection, XSS, and CSV formula injection. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-009` |
| `NFR-010` | **Fault Tolerance & Fallback** | If ML model inference fails or model files are missing, system must seamlessly fall back to deterministic safety rule scoring without downtime. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-010` |
| `NFR-011` | **Timezone Correctness** | All temporal calculations and schedule representations must use explicit timezone handling (UTC internally, IST display: `UTC+05:30`). | `[ENGINEERING ASSUMPTION]` | `TC-NFR-011` |
| `NFR-012` | **Database Portability** | Backend data access layer must support PostgreSQL for enterprise deployments and SQLite for local hackathon development. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-012` |
| `NFR-013` | **Frontend Usability** | UI must render Gantt charts with 500+ items smoothly at 60 FPS with clear color coding for departments (`ENG`=Amber, `SIG`=Green, `TRD`=Blue). | `[SYNTHETIC DEMO ASSUMPTION]` | `TC-NFR-013` |
| `NFR-014` | **Maintainability & Typing** | Backend codebase must maintain $\ge 85\%$ test coverage with strict Python type annotations and Pydantic schema validation. | `[ENGINEERING ASSUMPTION]` | `TC-NFR-014` |
