# RailSync AI — Multi-Scenario Stress & Reliability Test Report

**Project**: SIH26027 — AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways  
**System**: RailSync AI  
**Stage**: Stage 5 — Multi-Scenario Stress Testing & Reliability Hardening  
**Evaluation Date**: 2026-09-18  
**Environment**: Python 3.12, SQLite In-Memory Isolation (`sqlite:///:memory:`), OR-Tools CP-SAT v9.8+, Pytest 9.1  

---

## Executive Summary

Stage 5 executed **10 comprehensive deterministic operational stress scenarios** across the entire RailSync AI decision-support stack. Testing was conducted using an **isolated, ephemeral in-memory database framework** (`backend/app/pipeline/scenario_runner.py`), guaranteeing zero state pollution of the canonical baseline data.

All 10 operational stress scenarios passed 100% of mathematical and operational invariant checks. The automated regression test suite expanded to **29 passing tests (0 failures)** in 25.58 seconds.

---

## 1. Testing Methodology & Isolation Framework

To ensure that stress testing does not corrupt or pollute the canonical production/demo database (`data/railsync.db`), the `ScenarioRunner` spins up an ephemeral in-memory SQLite database (`sqlite:///:memory:`) for each scenario run:

```
[Canonical CSV Baseline]
           ↓
[In-Memory Isolated SQLite Session]
           ↓
[Deterministic Scenario Mutation]
           ↓
[Timetable Gap Extraction (Candidate Windows)]
           ↓
[Two-Tier AI/Rule Prioritization]
           ↓
[OR-Tools CP-SAT Constrained Solver]
           ↓
[Sentinel Independent Schedule Validator]
           ↓
[Mathematical Invariant Verification & Digest Audit]
           ↓
[Session Tear-Down / Zero Database Pollution]
```

---

## 2. 10 Deterministic Stress Scenarios: Summary & Invariant Results

| Scenario ID | Scenario Name | Operational Stress Applied | Key Expected Invariants | Measured Result | Verdict |
|---|---|---|---|---|---|
| **SCN-01** | **Mega Block** | Heavy multi-department demand on `GZB-ALJN` (6 compatible ENG, S&T, TRD tasks). | 100% Track NoOverlap, Multi-dept joint bundle formed, Sentinel PASSED. | 32 tasks scheduled, 10 bundles (including cross-dept), 29.2h saved, Sentinel `PASSED`. | **PASS** |
| **SCN-02** | **Safety-Critical Escalation** | `RAIL_FRACTURE_RISK` emergency defect competing with routine maintenance. | Tier 1 safety gate guarantees 100% slot allocation, Priority $\ge 95.0$, Sentinel `PASSED`. | Emergency scheduled unconditionally, Priority score $= 98.0$, Sentinel `PASSED`. | **PASS** |
| **SCN-03** | **Freight Squeeze** | 10 high-frequency freight train movements injected into daytime hours. | Timetable gaps shrink, zero train clashes, feasible tasks scheduled, Sentinel `PASSED`. | Gaps safely contracted, 0 train/block conflicts detected, Sentinel `PASSED`. | **PASS** |
| **SCN-04** | **Machinery Transit Conflict** | `TAMPING_01` demanded simultaneously on `NDLS-GZB` and `CNB-PRYJ` (>300km apart). | Disjunctive transit buffer enforced, corrupted transit flagged by Sentinel `FAILED`. | CP-SAT transit separated, Sentinel caught negative test collision, Sentinel `PASSED`. | **PASS** |
| **SCN-05** | **Power Block Isolation** | OHE power cut (`power_block_required=True`) on electrified 25kV line `ALJN-TDL`. | TRD power block synchronized with track work, zero unbundled clashes, Sentinel `PASSED`. | Synchronized power block, 0 electrical conflicts, Sentinel `PASSED`. | **PASS** |
| **SCN-06** | **Train Delay Disruption** | 45-minute delay on Train 22436 on `NDLS-GZB` triggering warm-start re-solver. | Collided blocks rescheduled, unaffected blocks preserved, revised plan Sentinel `PASSED`. | Targeted re-solve in 0.05s, unaffected blocks intact, new plan Sentinel `PASSED`. | **PASS** |
| **SCN-07** | **No Feasible Window** | 8-hour continuous work request in a 2-hour maximum daytime timetable gap. | Task cleanly marked `UNSCHEDULED`, root cause accurately diagnosed, Sentinel `PASSED`. | Task `UNSCHEDULED`, Root Cause: `MAX_GAP_INSUFFICIENT`, Sentinel `PASSED`. | **PASS** |
| **SCN-08** | **Resource Starvation** | 4 heavy tasks simultaneously demanding a single scarce machine unit (`BCM_01`). | Machine exclusivity respected, excess tasks deferred with `RESOURCE_BOTTLENECK`. | Maximum 1 machine active, 0 resource collisions, Sentinel `PASSED`. | **PASS** |
| **SCN-09** | **Bundle Compatibility** | Mix of compatible pair on `GZB-ALJN` and incompatible task on distant `CNB-PRYJ`. | Compatible pair forms unified bundle, incompatible task isolated, Sentinel `PASSED`. | Valid bundle formed, distant task isolated, Sentinel `PASSED`. | **PASS** |
| **SCN-10** | **Horizon Boundary Gaps** | Maintenance tasks positioned at horizon edges ($t=0$, trailing end, exact-fit). | Boundary windows extracted without off-by-one truncation, exact-fit tasks scheduled. | Initial $t=0$ window scheduled cleanly, Sentinel `PASSED`. | **PASS** |

---

## 3. In-Depth Scenario Analysis & Observations

### Scenario 1: Mega Block Optimization (SCN-01)
- **Stress**: 6 new compatible maintenance requests on `GZB-ALJN` (Engineering geometry twist, S&T point machine detection, TRD insulator washing, rail grinding, axle counter testing, and contact wire wear replacement).
- **Result**: CP-SAT successfully grouped compatible tasks into synchronized multi-department possession blocks, saving **29.2 hours of track closure time** compared to sequential standalone execution.
- **Sentinel Audit**: 0 physical track collisions, 0 train path clashes.

### Scenario 2: Deterministic Safety-Critical Escalation (SCN-02)
- **Stress**: Urgent rail fracture risk defect injected during peak morning traffic.
- **Result**: Tier 1 Deterministic Hard Safety Gate immediately assigned priority score $98.0$, completely bypassing routine soft-weight trade-offs and guaranteeing immediate slot possession.
- **Sentinel Audit**: Verified within candidate gap with 15-minute headway buffers.

### Scenario 4: Heavy Machinery Disjunctive Routing & Negative Audit (SCN-04)
- **Stress**: `TAMPING_01` demanded simultaneously on sections separated by over 300 km.
- **Result**: CP-SAT solver separated the blocks by the required transit time ($T_{\text{transit}} \ge 60\text{ mins}$).
- **Negative Test**: Intentionally constructing an overlapping assignment resulted in the Sentinel Schedule Validator immediately flagging `FAILED: Machinery collision on TAMPING_01`, proving the validator is truly independent.

### Scenario 6: Disruption Simulation & Targeted Warm-Start Re-optimization (SCN-06)
- **Stress**: Train 22436 delayed by 45 minutes on `NDLS-GZB`.
- **Result**: Re-optimizer identified collided shadow windows, returned affected tasks to the queue, locked and preserved unaffected approved blocks, and re-solved the revised corridor schedule in **0.05 seconds**.
- **Audit**: Logged `DISRUPTION_REOPTIMIZE` action with SHA-256 digest to the audit trail.

### Scenario 7: Infeasible Window Diagnostic Explanation (SCN-07)
- **Stress**: Request demanding 480 continuous minutes (8 hours) of track possession on `ETW-CNB`.
- **Result**: The system gracefully refused to schedule the task, setting status to `UNSCHEDULED`. The diagnostic explanation service reported `root_cause = "MAX_GAP_INSUFFICIENT"` with the actionable recommendation: *"Reduce requested work duration to <= 120 minutes or request night possession window"*.

---

## 4. Automated Regression Test Suite Execution

All 10 scenarios have been automated as regression test fixtures in [`backend/tests/test_scenario_stress.py`](backend/tests/test_scenario_stress.py).

```
============================= test session starts =============================
platform win32 -- Python 3.12.2, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\rofl\College Documents\Projects\SIH26027
collected 29 items

backend/tests/test_api_e2e.py::test_health_endpoint PASSED               [  3%]
backend/tests/test_api_e2e.py::test_tasks_list PASSED                    [  6%]
backend/tests/test_api_e2e.py::test_network_stations PASSED              [ 10%]
backend/tests/test_api_e2e.py::test_metrics_dashboard PASSED             [ 13%]
backend/tests/test_benchmark.py::test_optimization_benchmark_execution PASSED [ 17%]
backend/tests/test_candidate_windows.py::test_candidate_window_extraction PASSED [ 20%]
backend/tests/test_ingestion.py::test_ingestion_counts PASSED            [ 24%]
backend/tests/test_longitudinal_ml.py::test_longitudinal_generation_and_zero_leakage PASSED [ 27%]
backend/tests/test_longitudinal_ml.py::test_ml_feature_vector_structure PASSED [ 31%]
backend/tests/test_longitudinal_ml.py::test_persisted_ml_model_inference PASSED [ 34%]
backend/tests/test_optimizer_and_validator.py::test_optimizer_and_validator_flow PASSED [ 37%]
backend/tests/test_optimizer_edge_cases.py::test_optimizer_handles_empty_requests PASSED [ 41%]
backend/tests/test_optimizer_edge_cases.py::test_optimizer_handles_zero_candidate_windows PASSED [ 44%]
backend/tests/test_prioritization.py::test_prioritization_pipeline PASSED [ 48%]
backend/tests/test_reoptimization.py::test_train_delay_reoptimization PASSED [ 51%]
backend/tests/test_scenario_stress.py::test_scenario_1_mega_block PASSED [ 55%]
backend/tests/test_scenario_stress.py::test_scenario_2_safety_critical_escalation PASSED [ 58%]
backend/tests/test_scenario_stress.py::test_scenario_3_freight_squeeze PASSED [ 62%]
backend/tests/test_scenario_stress.py::test_scenario_4_machinery_transit_conflict PASSED [ 65%]
backend/tests/test_scenario_stress.py::test_scenario_5_power_block_isolation PASSED [ 68%]
backend/tests/test_scenario_stress.py::test_scenario_6_train_delay_disruption PASSED [ 72%]
backend/tests/test_scenario_stress.py::test_scenario_7_no_feasible_window PASSED [ 75%]
backend/tests/test_scenario_stress.py::test_scenario_8_resource_starvation PASSED [ 79%]
backend/tests/test_scenario_stress.py::test_scenario_9_bundle_compatibility PASSED [ 82%]
backend/tests/test_scenario_stress.py::test_scenario_10_horizon_boundary_gaps PASSED [ 86%]
backend/tests/test_validator_negative.py::test_validator_detects_train_occupancy_collision PASSED [ 89%]
backend/tests/test_validator_negative.py::test_validator_detects_physical_track_overlap PASSED [ 93%]
backend/tests/test_validator_negative.py::test_validator_detects_deadline_violation PASSED [ 96%]
backend/tests/test_validator_negative.py::test_validator_detects_machinery_collision PASSED [100%]

====================== 29 passed, 24 warnings in 25.58s =======================
```

---

## 5. Known Limitations & Research Boundaries

1. **Synthetic Timetable Scope**: All tests run against simulated timetables and synthetic defect demands representing the Bilaspur–Nagpur / Delhi–Prayagraj trunk corridors.
2. **Fixed Transit Speed**: Heavy machinery movement speeds are modeled with simulated constants ($40\text{ km/h}$) rather than dynamic topological dispatch routes.
3. **No Safety Critical Direct Control**: The system is designed strictly as a prototype decision-support tool for Indian Railways Chief Controllers; all plan outputs require human review and authorization.
