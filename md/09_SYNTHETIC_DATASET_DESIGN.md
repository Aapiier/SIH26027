# 09_SYNTHETIC_DATASET_DESIGN.md — Synthetic Dataset Design & Generator Specification

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Purpose & Simulation Philosophy

Because live operational data feeds from Indian Railways production systems (CRIS TMS, SMMS, TDMS, and COA) are air-gapped and protected by enterprise security protocols, **RailSync AI** relies on a high-fidelity, deterministic synthetic dataset generator (`ml_models/mock_data_gen.py`).

### Simulation Design Principles:
1. **Realistic Physical & Operational Topology:** Corridors, segments, assets, and trains mimic Indian Railways mainline trunk routes (e.g., Delhi-Agra, Mumbai-Vadodara).
2. **Deterministic Reproducibility:** Uses a fixed random seed (`seed=42`) to ensure identical dataset generation across developer machines, CI/CD runners, and hackathon evaluation environments.
3. **Correlated Relationships:** Defects are intentionally correlated with asset age, past failure rates, and train traffic density.
4. **Intentional Edge Cases & Infeasibilities:** The generator deliberately injects resource bottlenecks, impossible durations, and timetable congestion to thoroughly test the constraint solver's infeasibility diagnostics.

---

## 2. Dataset Scale & Parameters

| Parameter | Default Hackathon Demo Scale | Enterprise Benchmark Scale | Configuration Parameter |
| :--- | :--- | :--- | :--- |
| **Corridors** | 5 Trunk Corridors | 12 Network Corridors | `NUM_CORRIDORS = 5` |
| **Segments** | 40 Block Sections (8 per corridor) | 120 Block Sections | `SEGMENTS_PER_CORRIDOR = 8` |
| **Total Route Length** | ~1,000 Route Kilometers | ~3,500 Route Kilometers | `AVG_SEGMENT_KM = 25.0` |
| **Fixed Infrastructure Assets** | 1,200 Registered Assets | 5,000 Registered Assets | `ASSETS_PER_SEGMENT = 30` |
| **Maintenance & Defect Tasks** | 1,500 Pending Tasks | 6,000 Pending Tasks | `TOTAL_TASKS = 1500` |
| **Scheduled Passenger Trains** | 250 Train Runs (7-Day Horizon) | 1,000 Train Runs | `TRAINS_PER_DAY = 35` |
| **Goods Train Forecasts** | 100 Freight Windows | 400 Freight Windows | `FREIGHT_PATHS_PER_DAY = 15` |
| **Department Gangs & Crews** | 60 Specialized Crews | 180 Specialized Crews | `CREWS_PER_DEPT = 20` |
| **Heavy Track Machinery** | 10 Tamping Machines, 8 Tower Wagons | 30 Tampers, 25 Tower Wagons | `MACHINERY_COUNT = 18` |
| **Operational Planning Horizon** | 7 Days (Tactical Schedule) | 14 Days | `WEEKLY_HORIZON_DAYS = 7` |
| **Strategic Forecast Horizon** | 30 Days (Monthly View) | 90 Days | `MONTHLY_HORIZON_DAYS = 30` |

---

## 3. Departmental Defect Distributions & Attributes

### Proportions by Department:
- **Track (TMS / Civil Engineering):** $45\%$ of total tasks (geometry exceedances, USFD weld flaws, tamping).
- **Signaling (SMMS / S&T):** $30\%$ of total tasks (point motors, track circuits, signals, telecom cables).
- **Electrification (TDMS / TRD):** $25\%$ of total tasks (OHE contact wire wear, insulators, power substations).

### Severity & Overdue Distributions:
- **Critical Severity:** $15\%$ (Requires block within 24–48 hours; safety risk).
- **Major Severity:** $40\%$ (Requires block within 3–7 days).
- **Minor / Preventive Severity:** $45\%$ (Routine inspection; deadline within 14–30 days).
- **Overdue Backlog:** $12\%$ of generated tasks are intentionally generated with `reported_at` timestamps such that `due_date < current_simulation_time`.

---

## 4. The 20 Intentional Correlated Scenarios

The synthetic generator embeds 20 specific deterministic test scenarios to exercise all core optimization and AI capabilities:

```text
1. [Happy Bundle]: High-severity TMS rail defect (Km 42.1) and TDMS insulator replacement (Km 43.5) on same segment with a 4-hour night gap.
2. [Triple Bundle]: ENG tamping, SIG point calibration, and TRD mast alignment on Segment-02 within a 3.5-hour shadow block.
3. [Safety Rule Escalation]: USFD detected transverse rail fracture; rule gate forces priority to 98.0 regardless of ML inference.
4. [Emergency Insertion]: New critical defect reported at Hour 36, triggering dynamic localized replanning.
5. [Train Bottleneck]: Peak morning passenger rush (06:00 - 10:00) with zero candidate gaps ≥ 90 minutes.
6. [Duration Infeasibility]: Heavy ballast cleaning task requiring 300 minutes generated on a corridor where max gap is 180 minutes.
7. [Resource Bottleneck]: 3 track tamping tasks on different corridors demanding the same single available Tamping Machine.
8. [Crew Concurrency]: 2 S&T tasks scheduled concurrently in adjacent segments demanding the exact same S&T Work Gang #3.
9. [Electrical Isolation Conflict]: TRD task requiring 25kV power cutoff overlapping with electric locomotive passenger train.
10. [Freight Delay Disruption]: Freight train #BOXN-42 delayed by 90 minutes, invalidating an approved candidate shadow block.
11. [Cross-Segment Spanning Task]: Rail grinding task spanning across Segment-04 and Segment-05 simultaneously.
12. [Incompatible Task Co-existence]: Track lifting/tamping generated concurrently with delicate optical fiber cable splicing.
13. [Precedence Dependency]: Track deep screening task that must strictly precede track tamping and alignment.
14. [Overdue Age Acceleration]: Routine task overdue by 21 days with priority automatically escalated from 35.0 to 82.0.
15. [Missing Chainage Anomaly]: TMS row generated with null kilometer post to test the Data Quality Quarantine Gate.
16. [Negative Duration Glitch]: Defect generated with duration = -45 min to verify range rejection.
17. [Duplicate Defect Report]: Identical TMS defect emitted in two consecutive sync files to test SHA-256 deduplication.
18. [Day-Night Shift Preference]: TRD insulator wash preferred during daylight hours (08:00 - 16:00) vs. Track tamping at night.
19. [High-Speed Corridor Protection]: Segment with 160 km/h speed limit requiring mandatory 20-minute clearance buffer instead of 15m.
20. [Isolated Branch Line]: Low-traffic single-track corridor with 8-hour continuous shadow blocks for long-duration maintenance.
```

---

## 5. Generator Architecture & Code Contract

```python
# Conceptual signature of the mock generator: ml_models/mock_data_gen.py
def generate_synthetic_dataset(
    seed: int = 42,
    output_dir: str = "data/synthetic",
    num_corridors: int = 5,
    num_tasks: int = 1500,
    num_trains: int = 250,
    horizon_days: int = 7
) -> DatasetGenerationSummary:
    """
    Generates deterministic, relational synthetic datasets for:
    - corridors.csv
    - segments.csv
    - assets.csv
    - tms_defects.csv
    - smms_defects.csv
    - tdms_defects.csv
    - coa_timetables.csv
    - freight_forecasts.json
    - resources.csv
    """
    pass
```
