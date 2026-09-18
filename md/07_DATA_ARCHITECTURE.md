# 07_DATA_ARCHITECTURE.md — Data Architecture & Lifecycle Management

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Data Architecture Principles & Data Lifecycle

RailSync AI implements a structured, multi-layer data architecture that transforms unstructured and heterogeneous inputs from railway departmental silos into validated, actionable, and auditable operational schedules.

```mermaid
flowchart LR
    RAW["1. RAW LAYER<br/>Source Payloads & CSVs"] --> VAL["2. VALIDATED LAYER<br/>Schema & Range Checked"]
    VAL --> NORM["3. CANONICAL LAYER<br/>Standardized Relational Entities"]
    NORM --> ENR["4. ENRICHED LAYER<br/>Spatial & Traffic Cross-Joined"]
    ENR --> SCR["5. SCORED LAYER<br/>AI Priority & Risk Vectors"]
    SCR --> OPT["6. OPTIMIZATION LAYER<br/>Candidate Windows & Bundles"]
    OPT --> SCH["7. SCHEDULE LAYER<br/>Validated Master Timetable"]
    SCH --> APP["8. APPROVED LAYER<br/>Human Controller Signed"]
    APP --> EXE["9. EXECUTED LAYER<br/>Field Possession Actuals"]
    EXE --> HIS["10. HISTORICAL LAYER<br/>Archived Training & Analytics"]
```

---

## 2. The 7 Logical Data Layers

### Layer 1: Raw Ingestion Layer (`raw_ingest_records`)
- **Nature:** Immutable, append-only staging store.
- **Storage:** JSONB / Raw text columns in database or local staging directory.
- **Attributes:** `batch_id`, `source_system` (`TMS`, `SMMS`, `TDMS`, `COA`), `raw_payload`, `received_at`, `payload_hash` (SHA-256).
- **Retention:** Retained for 90 days to guarantee end-to-end replayability and audit compliance.

### Layer 2: Staged & Validated Layer
- **Nature:** Cleaned, schema-conforming records with verified types.
- **Transformations:** Null value handling, timestamp conversion to ISO-8601 UTC/IST, range verification (e.g., $0 \le \text{chainage} \le 2000$).
- **Failure Quarantine:** Rows failing validation are diverted to `rejected_records` with exact error codes (`INVALID_KM`, `MALFORMED_TIMESTAMP`, `NEGATIVE_DURATION`).

### Layer 3: Canonical / Unified Relational Layer
- **Nature:** Highly normalized relational entities adhering to strict domain relationships.
- **Core Entities:** `corridors`, `segments`, `assets`, `components`, `maintenance_tasks`, `train_movements`, `resources`.
- **Integrity Constraints:** Foreign key enforcement, unique constraints on operational keys, check constraints on enum fields.

### Layer 4: Feature & Enriched Layer
- **Nature:** Denormalized feature store optimized for AI model inference and candidate generation.
- **Features Extracted:** `overdue_days`, `failure_history_count`, `traffic_density_per_hour`, `asset_criticality_weight`, `passenger_train_count_in_horizon`.

### Layer 5: Optimization Input Layer
- **Nature:** In-memory and transient relational tables feeding the CP-SAT solver.
- **Entities:** `candidate_windows`, `task_bundles`, `resource_calendars`, `incompatibility_pairs`.
- **Properties:** Verified for temporal feasibility and safety buffers prior to solver execution.

### Layer 6: Schedule & Output Layer
- **Nature:** Solver output representations, block assignments, and performance indicators.
- **Entities:** `optimization_runs`, `scheduled_blocks`, `schedule_items`, `infeasibility_diagnostics`.
- **States:** `RECOMMENDED` $\to$ `VALIDATED` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `REVISED`.

### Layer 7: Immutable Audit & Governance Layer
- **Nature:** Tamper-resistant, append-only event log.
- **Entities:** `audit_events`, `schedule_overrides`, `data_quality_reports`.
- **Properties:** Cryptographic linking of state transitions, user identity tracking, and mandatory override justification strings.

---

## 3. Data Provenance & Lineage Tracking

Every record in the system maintains a complete provenance header:

```json
{
  "provenance": {
    "source_system": "TMS",
    "source_record_id": "TMS-DEL-2026-0941",
    "ingestion_batch_id": "ING-BATCH-20260917-001",
    "ingestion_timestamp": "2026-09-17T20:00:00+05:30",
    "payload_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "normalization_version": "1.0.0",
    "data_quality_status": "VALID",
    "last_modified_by": "SYSTEM_INGEST"
  }
}
```

---

## 4. Stale & Orphan Data Handling Policies

| Data Anomaly | Detection Mechanism | System Action & Policy | Tag |
| :--- | :--- | :--- | :--- |
| **Stale Maintenance Task** | Task created $> 30\text{ days}$ ago without updates or completion | Task urgency automatically escalates; warning flag `STALE_UNADDRESSED` attached. | `[ENGINEERING ASSUMPTION]` |
| **Orphan Asset Reference** | Defect references an asset ID not found in the asset registry | Defect is quarantined in `rejected_records` with error `ORPHAN_ASSET_REF`; alert raised in Data Health view. | `[ENGINEERING ASSUMPTION]` |
| **Stale Train Timetable** | Timetable version effective date is older than current schedule horizon | System blocks optimization run and warns user: "Timetable out of sync. Please sync COA." | `[SOURCE-BACKED]` |
| **Duplicate Defect Sync** | Matching SHA-256 hash or identical `(source_system, source_record_id)` | Pipeline performs idempotent upsert, updating timestamp while preserving task lifecycle state. | `[ENGINEERING ASSUMPTION]` |
