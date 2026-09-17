# 08_DATA_DICTIONARY.md — Comprehensive Data Dictionary

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Entity Overview & Data Domains

The RailSync AI data schema is organized into 7 distinct relational domains:
1. **Geography & Topology Domain:** Corridors, Segments, Stations, Kilometer Markers.
2. **Asset & Component Domain:** Assets, Sub-components, Health Telemetry.
3. **Maintenance & Defect Domain:** Tasks, Defects, Task Dependencies, Department Catalogs.
4. **Operations & Timetable Domain:** Trains, Timetable Events, Freight Forecasts, Corridor Occupancy.
5. **Resources Domain:** Crews, Work Gangs, Heavy Machinery (Tamping Machines, Tower Wagons).
6. **Scheduling & Optimization Domain:** Candidate Windows, Task Bundles, Optimization Runs, Scheduled Blocks.
7. **Governance & Audit Domain:** Audit Events, Schedule Overrides, User Accounts, Role Assignments.

---

## 2. Relational Entity Specifications

### 2.1 Geography & Topology Domain

#### Entity: `corridors`
Represents a major railway traffic route (e.g., Delhi-Agra, Mumbai-Ahmedabad).

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique identifier for the corridor | `"COR-DEL-AGR"` | `[ENGINEERING ASSUMPTION]` |
| `name` | `VARCHAR(128)` | No | UNIQUE | Human-readable name of the corridor | `"Delhi - Agra Mainline"` | `[SOURCE-BACKED]` |
| `code` | `VARCHAR(16)` | No | UNIQUE | Short telegraphic corridor code | `"NDLS-AGC"` | `[ENGINEERING ASSUMPTION]` |
| `total_length_km` | `FLOAT` | No | $> 0.0$ | Total length in kilometers | `198.5` | `[ENGINEERING ASSUMPTION]` |
| `track_count` | `INTEGER` | No | $\ge 1$ | Number of tracks (e.g., 2 for Double Line) | `2` | `[SOURCE-BACKED]` |
| `electrification_type` | `VARCHAR(32)` | No | `25KV_AC`, `NONE` | Electrification system specification | `"25KV_AC"` | `[SOURCE-BACKED]` |
| `created_at` | `TIMESTAMP` | No | Default: UTC Now | Record creation timestamp | `"2026-09-17T20:00:00Z"` | `[ENGINEERING ASSUMPTION]` |

#### Entity: `segments`
An indivisible sub-block section of a corridor bounded by block stations or signals.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique identifier for the segment | `"SEG-DEL-AGR-004"` | `[ENGINEERING ASSUMPTION]` |
| `corridor_id` | `VARCHAR(32)` | No | FK $\to$ `corridors.id` | Parent corridor reference | `"COR-DEL-AGR"` | `[ENGINEERING ASSUMPTION]` |
| `name` | `VARCHAR(128)` | No | — | Station/block section name | `"Palwal - Kosi Kalan Up Line"` | `[SOURCE-BACKED]` |
| `start_km` | `FLOAT` | No | $\ge 0.0$ | Start kilometer post | `60.2` | `[SOURCE-BACKED]` |
| `end_km` | `FLOAT` | No | $> \text{start\_km}$ | End kilometer post | `74.8` | `[SOURCE-BACKED]` |
| `track_identifier` | `VARCHAR(16)` | No | `UP`, `DOWN`, `SINGLE`, `3RD_LINE` | Track orientation indicator | `"UP"` | `[SOURCE-BACKED]` |
| `speed_limit_kmh` | `INTEGER` | No | $10 \le x \le 200$ | Maximum permissible speed (MPS) | `130` | `[SOURCE-BACKED]` |
| `is_active` | `BOOLEAN` | No | Default: `true` | Operational availability flag | `true` | `[ENGINEERING ASSUMPTION]` |

---

### 2.2 Asset & Component Domain

#### Entity: `assets`
Physical infrastructure units installed along a corridor segment.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique asset asset tag | `"AST-TRK-DEL-0412"` | `[ENGINEERING ASSUMPTION]` |
| `segment_id` | `VARCHAR(32)` | No | FK $\to$ `segments.id` | Parent segment reference | `"SEG-DEL-AGR-004"` | `[ENGINEERING ASSUMPTION]` |
| `department` | `VARCHAR(16)` | No | `ENG`, `SIG`, `TRD` | Responsible railway department | `"ENG"` | `[SOURCE-BACKED]` |
| `asset_type` | `VARCHAR(64)` | No | `TRACK_SECTION`, `POINT_MACHINE`, `SIGNAL_POST`, `OHE_MAST`, `SUBSTATION` | Asset classification category | `"TRACK_SECTION"` | `[SOURCE-BACKED]` |
| `location_km` | `FLOAT` | No | Range in parent segment | Exact chainage kilometer mark | `64.35` | `[SOURCE-BACKED]` |
| `criticality_weight` | `FLOAT` | No | $1.0 \le x \le 5.0$ | Static baseline criticality rating | `4.5` | `[ENGINEERING ASSUMPTION]` |
| `installation_date` | `DATE` | Yes | $\le \text{Today}$ | Date asset was placed into service | `"2018-04-12"` | `[ENGINEERING ASSUMPTION]` |
| `health_status` | `VARCHAR(16)` | No | `GOOD`, `DEGRADED`, `CRITICAL` | Current health condition | `"DEGRADED"` | `[SOURCE-BACKED]` |

---

### 2.3 Maintenance & Defect Domain

#### Entity: `maintenance_tasks`
Canonical maintenance jobs and defect rectifications awaiting schedule allocation.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique maintenance task ID | `"TSK-TMS-2026-0042"` | `[ENGINEERING ASSUMPTION]` |
| `source_system` | `VARCHAR(16)` | No | `TMS`, `SMMS`, `TDMS` | Originating silo system | `"TMS"` | `[SOURCE-BACKED]` |
| `source_record_id` | `VARCHAR(64)` | No | — | Original record key in source DB | `"DEF-99412-TRACK"` | `[SOURCE-BACKED]` |
| `asset_id` | `VARCHAR(32)` | No | FK $\to$ `assets.id` | Target infrastructure asset | `"AST-TRK-DEL-0412"` | `[SOURCE-BACKED]` |
| `segment_id` | `VARCHAR(32)` | No | FK $\to$ `segments.id` | Target corridor segment | `"SEG-DEL-AGR-004"` | `[SOURCE-BACKED]` |
| `department` | `VARCHAR(16)` | No | `ENG`, `SIG`, `TRD` | Department responsible | `"ENG"` | `[SOURCE-BACKED]` |
| `defect_type` | `VARCHAR(64)` | No | E.g. `RAIL_FRACTURE`, `USFD_FLAW`, `POINT_FAILURE`, `OHE_SAG` | Specific defect classification | `"USFD_FLAW"` | `[SOURCE-BACKED]` |
| `severity` | `VARCHAR(16)` | No | `CRITICAL`, `MAJOR`, `MINOR` | Defect severity rating | `"CRITICAL"` | `[SOURCE-BACKED]` |
| `duration_minutes` | `INTEGER` | No | $15 \le x \le 480$ | Required physical block duration | `120` | `[SOURCE-BACKED]` |
| `reported_at` | `TIMESTAMP` | No | UTC/IST | Ingestion / detection timestamp | `"2026-09-15T08:30:00Z"` | `[SOURCE-BACKED]` |
| `due_date` | `TIMESTAMP` | No | $\ge \text{reported\_at}$ | Mandatory compliance deadline | `"2026-09-18T23:59:59Z"` | `[SOURCE-BACKED]` |
| `requires_power_cutoff` | `BOOLEAN` | No | Default: `false` | Whether OHE 25kV power must be isolated | `false` | `[SOURCE-BACKED]` |
| `requires_traffic_block` | `BOOLEAN` | No | Default: `true` | Whether running track must be blocked | `true` | `[SOURCE-BACKED]` |
| `required_crew_type` | `VARCHAR(64)` | No | E.g. `PWAY_GANG`, `SIG_MAINT_TEAM`, `TRD_TOWER_CREW` | Required specialized crew | `"PWAY_GANG"` | `[ENGINEERING ASSUMPTION]` |
| `required_machinery` | `VARCHAR(64)` | Yes | E.g. `TAMPING_MACHINE`, `TOWER_WAGON`, `BCM` | Required track heavy equipment | `"TAMPING_MACHINE"` | `[SOURCE-BACKED]` |
| `priority_score` | `FLOAT` | No | $0.0 \le x \le 100.0$ | Dynamic AI priority score | `88.5` | `[SOURCE-BACKED]` |
| `priority_category` | `VARCHAR(16)` | No | `EMERGENCY`, `HIGH`, `MEDIUM`, `LOW` | Priority tier | `"HIGH"` | `[ENGINEERING ASSUMPTION]` |
| `status` | `VARCHAR(16)` | No | `PENDING`, `SCHEDULED`, `COMPLETED`, `DEFERRED`, `REJECTED` | Lifecycle status | `"PENDING"` | `[SOURCE-BACKED]` |

---

### 2.4 Operations & Timetable Domain

#### Entity: `train_movements`
Scheduled passenger trains and freight paths traversing corridor segments.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique train movement key | `"TRN-12002-20260918"` | `[ENGINEERING ASSUMPTION]` |
| `train_number` | `VARCHAR(16)` | No | — | Official Indian Railways train number | `"12002"` | `[SOURCE-BACKED]` |
| `train_name` | `VARCHAR(128)` | No | — | Official train service name | `"Bhopal Shatabdi Express"` | `[SOURCE-BACKED]` |
| `train_type` | `VARCHAR(32)` | No | `PREMIUM_PASSENGER`, `MAIL_EXPRESS`, `SUBURBAN`, `GOODS_SCHEDULED`, `GOODS_FORECAST` | Train priority class | `"PREMIUM_PASSENGER"` | `[SOURCE-BACKED]` |
| `corridor_id` | `VARCHAR(32)` | No | FK $\to$ `corridors.id` | Traversed corridor | `"COR-DEL-AGR"` | `[ENGINEERING ASSUMPTION]` |
| `segment_id` | `VARCHAR(32)` | No | FK $\to$ `segments.id` | Occupied segment | `"SEG-DEL-AGR-004"` | `[ENGINEERING ASSUMPTION]` |
| `entry_time` | `TIMESTAMP` | No | ISO-8601 UTC | Segment entry timestamp | `"2026-09-18T06:15:00Z"` | `[SOURCE-BACKED]` |
| `exit_time` | `TIMESTAMP` | No | $> \text{entry\_time}$ | Segment exit timestamp | `"2026-09-18T06:23:00Z"` | `[SOURCE-BACKED]` |
| `priority_rank` | `INTEGER` | No | $1 \le x \le 5$ ($1=\text{Highest}$) | Traffic operational precedence | `1` | `[SOURCE-BACKED]` |
| `is_forecast` | `BOOLEAN` | No | Default: `false` | Freight forecast indicator | `false` | `[SOURCE-BACKED]` |

---

### 2.5 Scheduling & Optimization Domain

#### Entity: `candidate_windows`
Candidate shadow blocks identified from timetable gaps.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique candidate window ID | `"CW-DEL-AGR-004-0918-01"` | `[ENGINEERING ASSUMPTION]` |
| `segment_id` | `VARCHAR(32)` | No | FK $\to$ `segments.id` | Target corridor segment | `"SEG-DEL-AGR-004"` | `[ENGINEERING ASSUMPTION]` |
| `window_start` | `TIMESTAMP` | No | ISO-8601 UTC | Window start time (after setup buffer) | `"2026-09-18T01:30:00Z"` | `[SOURCE-BACKED]` |
| `window_end` | `TIMESTAMP` | No | $> \text{window\_start}$ | Window end time (before clear buffer) | `"2026-09-18T04:45:00Z"` | `[SOURCE-BACKED]` |
| `net_duration_min` | `INTEGER` | No | $> 0$ | Usable work duration in minutes | `195` | `[SOURCE-BACKED]` |
| `confidence_score` | `FLOAT` | No | $0.0 \le x \le 1.0$ | Reliability score (1.0 for passenger gap, 0.7 for freight) | `0.95` | `[ENGINEERING ASSUMPTION]` |

#### Entity: `scheduled_blocks`
Optimized or approved maintenance possession blocks.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique scheduled block identifier | `"BLK-20260918-DEL-01"` | `[ENGINEERING ASSUMPTION]` |
| `optimization_run_id` | `VARCHAR(32)` | No | FK $\to$ `optimization_runs.id` | Solver run reference | `"OPT-RUN-20260917-001"` | `[ENGINEERING ASSUMPTION]` |
| `segment_id` | `VARCHAR(32)` | No | FK $\to$ `segments.id` | Block track segment | `"SEG-DEL-AGR-004"` | `[SOURCE-BACKED]` |
| `candidate_window_id`| `VARCHAR(32)` | Yes | FK $\to$ `candidate_windows.id`| Matched shadow block window | `"CW-DEL-AGR-004-0918-01"` | `[ENGINEERING ASSUMPTION]` |
| `start_time` | `TIMESTAMP` | No | ISO-8601 UTC | Scheduled possession start | `"2026-09-18T02:00:00Z"` | `[SOURCE-BACKED]` |
| `end_time` | `TIMESTAMP` | No | $> \text{start\_time}$ | Scheduled possession end | `"2026-09-18T04:30:00Z"` | `[SOURCE-BACKED]` |
| `is_bundled` | `BOOLEAN` | No | Default: `false` | True if contains multiple departments | `true` | `[SOURCE-BACKED]` |
| `departments_involved`| `VARCHAR(64)` | No | E.g. `ENG,TRD` | Comma-separated departments | `"ENG,TRD"` | `[SOURCE-BACKED]` |
| `status` | `VARCHAR(16)` | No | `RECOMMENDED`, `APPROVED`, `PUBLISHED`, `OVERRIDDEN`, `CANCELLED` | Operational block status | `"RECOMMENDED"` | `[SOURCE-BACKED]` |
| `version` | `INTEGER` | No | Default: `1` | Incrementing version on override | `1` | `[ENGINEERING ASSUMPTION]` |

---

### 2.6 Governance & Audit Domain

#### Entity: `audit_events`
Append-only log of all user overrides, solver executions, and approval actions.

| Field Name | Data Type | Nullable | Constraints / Enums | Description | Example | Source / Tag |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | No | PRIMARY KEY | Unique audit event ID | `"AUD-EVT-20260917-0042"` | `[ENGINEERING ASSUMPTION]` |
| `event_type` | `VARCHAR(32)` | No | `INGESTION_SYNC`, `SOLVER_RUN`, `MANUAL_OVERRIDE`, `SCHEDULE_APPROVE`, `SCHEDULE_PUBLISH` | Type of audited action | `"MANUAL_OVERRIDE"` | `[SOURCE-BACKED]` |
| `entity_type` | `VARCHAR(32)` | No | `SCHEDULED_BLOCK`, `TASK`, `OPTIMIZATION_RUN` | Target entity class | `"SCHEDULED_BLOCK"` | `[ENGINEERING ASSUMPTION]` |
| `entity_id` | `VARCHAR(32)` | No | — | Target entity primary key | `"BLK-20260918-DEL-01"` | `[ENGINEERING ASSUMPTION]` |
| `user_id` | `VARCHAR(32)` | No | FK $\to$ `users.id` | User performing the action | `"USR-CTRL-007"` | `[SOURCE-BACKED]` |
| `timestamp` | `TIMESTAMP` | No | Default: UTC Now | Exact timestamp of event | `"2026-09-17T20:15:30Z"` | `[SOURCE-BACKED]` |
| `old_value_json` | `TEXT / JSON` | Yes | — | Snapshot prior to change | `{"start_time": "01:30"}` | `[ENGINEERING ASSUMPTION]` |
| `new_value_json` | `TEXT / JSON` | Yes | — | Snapshot after change | `{"start_time": "02:00"}` | `[ENGINEERING ASSUMPTION]` |
| `justification` | `TEXT` | Yes | Required on override | Human explanation for modification | `"Adjusted for delayed freight #BOXN-22"` | `[SOURCE-BACKED]` |
| `event_sha256` | `VARCHAR(64)` | No | SHA-256 hash | Tamper-evidence cryptographic hash | `"a8f5c...7e2"` | `[ENGINEERING ASSUMPTION]` |
