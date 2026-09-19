# RailSync AI — Manual Simulation / Live Demo Input Mode Walkthrough

## Overview
We have implemented a comprehensive, end-to-end interactive **Manual Simulation / Live Demo Input Mode** in RailSync AI. This mode empowers evaluators and controllers to dynamically create, edit, and inject railway operational simulation data without mock or frontend-only shortcuts.

---

## Complete End-to-End Data Pipeline Flow

The manual simulation strictly follows the required verified flow:

```
MANUAL INPUT (Frontend Modal / REST API)
  │
  ▼
SQLITE DATABASE PERSISTENCE (MaintenanceRequest, Asset, Train, Timetable)
  │
  ▼
NORMALIZATION & DATA QUALITY
  │
  ▼
AI FAILURE RISK & TIER 1/2 PRIORITIZATION (_predictor.predict_risk using asset_failure_risk_v3.joblib)
  │
  ▼
CANDIDATE CORRIDOR WINDOW EXTRACTION (extract_candidate_windows)
  │
  ▼
MULTI-DEPARTMENT SHADOW BUNDLING (group_compatible_tasks)
  │
  ▼
OPPORTUNITY EVALUATION ENGINE (compute_opportunity_score)
  │
  ▼
GOOGLE OR-TOOLS CP-SAT MASTER OPTIMIZER (solve_maintenance_schedule)
  │
  ▼
INDEPENDENT SENTINEL SAFETY VALIDATOR (validate_plan_schedule)
  │
  ▼
UPDATED BLOCK PLAN & CRYPTOGRAPHIC AUDIT LOG (BlockPlan, BlockPlanItem, AuditLog)
```

---

## Key Changes Made

### 1. Backend Data Schemas & Models
- [`backend/app/schemas/schemas.py`](file:///c:/rofl/College%20Documents/Projects/SIH26027/backend/app/schemas/schemas.py):
  - Added `MaintenanceRequestCreateSchema` (Department, Section, Track, Defect Type, Severity, Duration, Window bounds, Machinery, Power Block, Speed Restriction).
  - Added `TrainCreateSchema` (Train Number, Name, Type, Priority, Speed Factor, Headway, Max Speed).
  - Added `TimetableCreateSchema` (Train Number, Section, Track, Direction, Scheduled Entry/Exit, Headway Buffer).

### 2. Backend API Routers
- [`backend/app/routers/tasks_router.py`](file:///c:/rofl/College%20Documents/Projects/SIH26027/backend/app/routers/tasks_router.py):
  - Added `POST /api/v1/tasks`: Validates input, auto-links/creates Asset entity for ML feature extraction, executes `_predictor.predict_risk()` using the persisted GBDT model artifact, calculates Tier 1 (Safety Rules) and Tier 2 (ML weighted) priority scores, writes to `AuditLog`, and persists to database.
- [`backend/app/routers/trains_router.py`](file:///c:/rofl/College%20Documents/Projects/SIH26027/backend/app/routers/trains_router.py):
  - Added `POST /api/v1/network/trains`: Creates/updates train master profiles.
  - Added `POST /api/v1/network/timetable`: Injects train sectional timetable occupancy and automatically triggers `extract_candidate_windows()` to update collision-free corridor gaps.

### 3. Frontend Interactive Simulation UI
- [`frontend/src/types.ts`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/types.ts): Added creation payload interfaces.
- [`frontend/src/services/api.ts`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/services/api.ts): Added `createMaintenanceTask`, `createTrain`, `createTimetableEntry`.
- [`frontend/src/components/ManualSimulationModal.tsx`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/components/ManualSimulationModal.tsx):
  - Modal with 3 live demo tabs:
    1. **+ Add Maintenance Defect** with 1-click Presets (Rail Fracture, OHE Cantilever Flash, Point Machine Failure, Ultrasonic IMR flaw).
    2. **+ Add Train Schedule** with 1-click Presets (Vande Bharat Special, Heavy Coal Freight Rake, Rajdhani Special).
    3. **⚡ Inject Train Disruption** (Train Delay with target section and delay magnitude).
  - Provides instant confirmation with AI Risk score, Priority score, Urgency classification, and direct action buttons: "Run CP-SAT Optimizer", "Recalculate AI Priorities", and "Sentinel Validate".
- [`frontend/src/components/TopHeader.tsx`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/components/TopHeader.tsx), [`frontend/src/components/Sidebar.tsx`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/components/Sidebar.tsx), [`frontend/src/components/views/MaintenanceView.tsx`](file:///c:/rofl/College%20Documents/Projects/SIH26027/frontend/src/components/views/MaintenanceView.tsx):
  - Added prominent "+ Live Simulation" buttons in Top Header, Sidebar Demo Controls, and Maintenance tab.

---

## Verification & Test Results

### 1. Automated Backend Test Suite
Executed full backend test suite (`py -3.12 -m pytest backend/tests/ -v`):
```text
====================== 65 passed, 61 warnings in 48.88s =======================
```
All 65 tests passed (100% success rate):
- `test_manual_maintenance_task_creation_and_ai_risk` ✅
- `test_manual_train_and_timetable_creation` ✅
- `test_manually_added_task_reaches_cpsat_and_sentinel` ✅
- `test_reset_demo_restores_canonical_state` ✅
- All 61 previous regression tests ✅

### 2. Frontend Production Build
Executed `npm run build` in `frontend/`:
```text
✓ built in 1.94s (zero TypeScript or bundling errors)
```

---

## Complete Demonstrated Live Flow Example

1. **Add a New Maintenance Defect**:
   - Controller opens "+ Live Simulation" console.
   - Selects "⚠️ Rail Fracture (ENG)" preset on section `GZB-ALJN` (Track: `GZB-ALJN-UP`, duration: 90 mins, severity: `EMERGENCY`).
   - Clicks "Create & Prioritize Task".
2. **AI Prioritization & Risk Assessment**:
   - Backend ingests defect, executes `DefectRiskPredictor` (`asset_failure_risk_v3.joblib`).
   - Assigns `ai_risk_score: 0.724`, Tier 1 deterministic gate enforces `ai_priority_score: 98.0`, `ai_urgency_level: CRITICAL_EMERGENCY`.
   - Immutable audit entry `LOG-XXXX` generated with SHA-256 state hash.
3. **CP-SAT Master Schedule Optimization**:
   - Controller triggers "Run CP-SAT Optimizer".
   - Solver incorporates the new emergency task, searches collision-free candidate windows, evaluates multi-department shadow bundling, and schedules a synchronized possession block.
4. **Sentinel Safety Validation**:
   - Independent Sentinel validator evaluates 5 hard safety rules: zero train conflicts, zero track overlaps, deadline compliance, traction power block bounds, and machinery transit disjunction.
   - Result: `PASSED` (0 conflicts detected).
