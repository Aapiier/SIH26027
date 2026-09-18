# RailSync AI — Longitudinal Synthetic ML Training-Data System Design
## Architectural Specification for Defensible Predictive Maintenance & Risk Forecasting

**Project:** SIH26027 — AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways  
**Document Status:** Implemented & Verified in RailSync AI v2.0  
**Target Version:** RailSync AI v2.0 AI/ML Subsystem  

---

## 1. Executive Summary

This document presents the comprehensive architectural design for a **longitudinal synthetic ML training-data system** for RailSync AI. 

In the initial prototype, the machine learning component (`GradientBoostingRegressor`) was trained on a synthetic target derived via an algebraic formula from its own input features (severity, urgency ratio, criticality, and health index). While functionally integrated with the Google OR-Tools CP-SAT scheduler, this created **target proxy leakage** and prevented the model from demonstrating genuine predictive learning.

This design establishes a **180-day simulated historical lifecycle** across all 174 railway infrastructure assets in the Northern Corridor network. Assets experience continuous non-linear physical degradation (governed by cumulative traffic gross-million-tonnage (GMT), environmental thermal stress, and age), undergo periodic inspections and corrective interventions, and occasionally suffer discrete failure and escalation events. 

By formulating the primary ML task as predicting **`failure_within_14d`** using strictly backward-looking observation windows $[T_0, T]$ and forward-looking label windows $[T+1, T+14]$, RailSync AI eliminates target leakage, enables temporal train/validation/test splits, provides genuine SHAP explainability, and grounds the AI prior to CP-SAT block scheduling.

---

## 2. Current AI Architecture

The active RailSync AI architecture connects data ingestion, feature extraction, ML risk estimation, and mathematical optimization:

```
[Simulated TMS/SMMS/TDMS] → [Feature Extractor (11D)] → [GBR Risk Model] → [Two-Tier Gate]
                                                                                ↓
[Candidate Windows] → [Multi-Dept Bundling] → [CP-SAT Solver: Maximize (P*100 + Bundles - Delay)]
                                                                                ↓
                                                                     [Final Block Plan]
```

### Active Components:
1. **Feature Engineering ([`feature_engineering.py`](file:///backend/app/pipeline/feature_engineering.py)):** Extracts 11 continuous features (`severity_level`, `urgency_ratio`, `asset_criticality`, `degradation_risk`, etc.).
2. **Risk Predictor ([`ml_model.py`](file:///backend/app/pipeline/ml_model.py)):** `GradientBoostingRegressor(n_estimators=60, learning_rate=0.08, max_depth=4)`.
3. **Prioritization Engine ([`prioritization.py`](file:///backend/app/pipeline/prioritization.py)):** Combines Tier 1 safety overrides (`EMERGENCY` $\rightarrow 98.0$) with Tier 2 ML continuous scaling.
4. **Discrete Optimizer ([`optimizer.py`](file:///backend/app/pipeline/optimizer.py)):** CP-SAT engine maximizing priority rewards and shadow-bundling savings subject to timetable headway and machinery transit constraints.

---

## 3. Current Target Leakage Problem

### Mathematical Root Cause:
In the initial prototype, the training target $y \in [0.0, 1.0]$ is generated in `ml_model.py` via:
$$y = 0.40 \cdot \left(\frac{\text{severity}}{4.0}\right) + 0.25 \cdot \min(1.0, \text{urgency\_ratio}) + 0.20 \cdot \left(\frac{\text{criticality}}{5.0}\right) + 0.15 \cdot \text{degradation\_risk}$$

Because all four terms are simultaneously fed into the model as raw features in the vector $\mathbf{x} = [x_1, x_2, \dots, x_{11}]$, the regressor fits a closed-form algebraic formula ($R^2 = 0.9999$ on training data). 

### Consequences:
1. The model does not predict *future failures*; it reproduces an *engineered priority heuristic*.
2. Feature importance is dominated by the synthetic weights ($78.6\%$ severity, $11.0\%$ deadline window), masking physical asset dynamics.
3. No temporal dimension or historical memory exists (e.g., whether an asset has degraded rapidly over the last 14 days or had 3 deferred maintenance requests).

---

## 4. Design Goals

1. **Independent Future Target:** The target variable must represent an independently simulated future failure/escalation outcome, not an arithmetic combination of prediction-time features.
2. **Strict Backward-Looking Features:** All features for an observation at date $T$ must use data from $\le T$ only.
3. **Temporal Realism:** Asset degradation must be continuous, cumulative, and responsive to traffic exposure, age, and maintenance interventions.
4. **Preservation of Operational Data:** The current 86 active maintenance requests and 174 network assets remain intact as the operational planning horizon ($T \ge \text{Day 181}$). The new dataset forms the *historical training and validation substrate* ($T \in [\text{Day 1}, \text{Day 180}]$).
5. **Lightweight & Reproducible:** Dataset generation must execute in $<5$ seconds via fixed pseudorandom seeds without external heavy database dependencies.

---

## 5. Historical Simulation Architecture

The historical generator models the 180-day trajectory of the railway network through five interacting simulation layers:

```
+-----------------------------------------------------------------------------------+
|                        1. ASSET INFRASTRUCTURE TOPOLOGY                           |
|       174 Assets across 5 Track Sections (Tracks, Points, Signals, OHE)          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     2. TRAFFIC LOAD & ENVIRONMENTAL DRIVERS                       |
|   Daily Passenger/Freight GMT Load, Ambient Thermal Cycles, Monsoon Rain Shocks  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    3. CONTINUOUS PHYSICAL DEGRADATION ENGINE                      |
|   Non-linear wear-out: Wear_t = Wear_{t-1} + f(Traffic, Age, Stress) + Noise      |
+-----------------------------------------------------------------------------------+
                                         |
          +------------------------------+------------------------------+
          |                                                             |
          v                                                             v
+-------------------------------------+       +-------------------------------------+
|    4. INSPECTIONS & INTERVENTIONS   |       |   5. STOCHASTIC FAILURES & DEFECTS  |
|  Preventive Tamping, OHE Adjustment,|       |  Rail Flaws, Signal Drops, OHE Flashes|
|  Part Replacements, Deferral Events |       |  (Triggered when wear exceeds limit)|
+-------------------------------------+       +-------------------------------------+
          |                                                             |
          +------------------------------+------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     6. LONGITUDINAL ML FEATURE/LABEL MATRIX                       |
|  Features at T (Historical Lookback) ────> Label at [T+1, T+14] (Future Failure)  |
+-----------------------------------------------------------------------------------+
```

---

## 6. Proposed Dataset Entities

| Entity Name | Purpose | Key Fields | Relationship |
|---|---|---|---|
| **`AssetMaster`** | Static catalog of infrastructure assets | `asset_id`, `category`, `department`, `section_id`, `track_id`, `start_km`, `end_km`, `installation_year`, `base_criticality` | 1-to-Many with Daily States |
| **`AssetDailyTelemetry`** | Daily snapshot of physical condition, usage, and environment | `telemetry_id`, `asset_id`, `date`, `day_index`, `wear_metric`, `health_index`, `daily_gmt_tonnage`, `ambient_temp_c`, `rainfall_mm`, `vibration_rms` | Many-to-1 with AssetMaster |
| **`HistoricalInspection`** | Records of periodic ultrasonic, manual, and tower car inspections | `inspection_id`, `asset_id`, `date`, `inspection_type`, `measured_condition_score`, `flaws_detected_count`, `inspector_notes` | Many-to-1 with AssetMaster |
| **`HistoricalIntervention`**| Maintenance actions performed (tamping, grinding, replacement) | `intervention_id`, `asset_id`, `date`, `intervention_type`, `department`, `block_duration_hrs`, `condition_restoration_delta` | Many-to-1 with AssetMaster |
| **`HistoricalDefectEvent`** | Defect detections, speed restrictions, and critical failures | `event_id`, `asset_id`, `date`, `defect_type`, `severity`, `speed_restriction_kmph`, `is_functional_failure`, `escalation_days` | Many-to-1 with AssetMaster |
| **`MLTrainingSample`** | Standardized feature vector at time $T$ with target at $[T+1, T+14]$ | `sample_id`, `asset_id`, `observation_date`, `split_tag`, `feature_vector_json`, `failure_within_14d`, `days_to_next_failure` | 1-to-1 with (Asset, Date) |

---

## 7. Longitudinal Asset History

### Simulation Timeline Parameters:
* **Historical Horizon:** $180\text{ days}$ ($\approx 6\text{ months}$), representing April 1, 2026 ($T=1$) to September 30, 2026 ($T=180$).
* **Current Planning Horizon:** October 1, 2026 ($T=181$) onwards (matches active operational dataset).
* **Observation Frequency:** Daily snapshot per asset ($174\text{ assets} \times 180\text{ days} = 31,320\text{ asset-day records}$).
* **Sampling Rate for ML:** Weekly sliding window (every 3 to 7 days) to balance observation volume and limit serial auto-correlation ($\approx 4,500\text{ to } 7,800\text{ distinct ML training samples}$).

---

## 8. Degradation Model

Asset condition evolves dynamically based on physical asset category:

### 1. Permanent Way Track Degradation (Engineering):
$$\Delta \text{Wear}_t = \beta_{\text{track}} \cdot \left(\frac{\text{DailyGMT}_t}{50.0}\right) \cdot \left(1.0 + 0.05 \cdot \text{AgeYears}\right) \cdot \text{EnvFactor}_t + \epsilon_t$$
* Metric: `track_wear_mm` ($0.0\text{ mm}$ to $15.0\text{ mm}$, baseline tamping threshold at $8.0\text{ mm}$, critical flaw at $>12.0\text{ mm}$).

### 2. S&T Point Machine & Signaling Degradation:
$$\Delta \text{Friction}_t = \beta_{\text{sig}} \cdot \text{DailySwitchOperations}_t \cdot \left(1.0 + \frac{\text{Rainfall}_t}{100.0}\right) + \epsilon_t$$
* Metric: `point_machine_throw_time_s` ($2.0\text{s}$ nominal, $>4.5\text{s}$ failure hazard) and `signal_relay_drop_count`.

### 3. TRD OHE Catenary & Contact Wire Wear:
$$\Delta \text{OHEWear}_t = \beta_{\text{trd}} \cdot \text{DailyElectricTrains}_t \cdot \left(1.0 + 0.02 \cdot \max(0, \text{Temp}_t - 40.0)\right) + \epsilon_t$$
* Metric: `contact_wire_wear_pct` ($0\text{--}100\%$, critical spark gap at $>85\%$).

### 4. Composite Asset Health Index:
$$\text{HealthIndex}_t = \max\left(0.0, 100.0 - \gamma_{\text{wear}} \cdot \text{Wear}_t - \gamma_{\text{def}} \cdot \text{ActiveDefects}_t - \gamma_{\text{age}} \cdot \text{DaysSinceLastMaintenance}_t\right)$$

---

## 9. Maintenance Intervention Simulation

Interventions restore physical asset state and alter future degradation trajectories:

```
Condition Score
    100% |             /---\ (Post-Preventive Tamping)
         |            /     \
         |           /       \ (Gradual Wear-Out)
         |          /         \
     50% |---------/           \-------------\ (Corrective Replacement)
         |        /                           \
         |       /                             \ (Emergency Failure Level)
      0% +------+-------------------------------+------------------------> Time (Days)
             Day 45 (Scheduled Block)       Day 130 (Critical Defect)
```

### Intervention Types & Effects:
1. **Preventive Routine Tamping / Lubrication / Tensioning:** Restores $15\text{--}30\%$ of lost health index; resets `days_since_maintenance` to 0.
2. **Corrective Flaw Grinding / Part Overhaul:** Restores $50\text{--}70\%$ of asset health; clears active minor defects.
3. **Emergency Replacement (Post-Failure):** Resets wear metric to $0.0\text{ mm}$ and health index to $98.0\%$.
4. **Maintenance Deferral:** When maintenance demand is deferred due to traffic constraints, the degradation rate $\beta$ increases by $25\%$ due to compound wear.

---

## 10. Failure and Escalation Simulation

Failures are generated via a **stochastic threshold hazard model**:

$$\lambda_t(i) = \lambda_0 \cdot \exp\left(\theta_1 \cdot \frac{\text{Wear}_t}{\text{Wear}_{\text{limit}}} + \theta_2 \cdot \frac{\text{DaysSinceInspection}_t}{60} + \theta_3 \cdot \text{DeferredCount}_t + \theta_4 \cdot \text{WeatherStress}_t\right)$$

* At each day $t$, if a Bernoulli trial with probability $p_t = 1 - e^{-\lambda_t}$ succeeds:
  1. A discrete `HistoricalDefectEvent` is logged.
  2. If $\text{Wear}_t > \text{Wear}_{\text{crit}}$, an **EMERGENCY failure** is triggered (causing an emergency block demand and temporary speed restriction).
  3. Otherwise, a **MINOR defect** is logged, which escalates to critical status if unaddressed within $10\text{--}14$ days.

---

## 11. Primary ML Target

### Primary Target: **`failure_within_14d`** (Binary Classification)
* **Definition:** $y = 1$ if asset $i$ experiences an emergency defect, functional failure, or mandatory emergency speed restriction in the future window $[T+1, T+14]$. Otherwise $y = 0$.
* **Rationale for RailSync AI:**
  * Matches the operational horizon of the weekly and fortnightly corridor block planner (7 to 14 days).
  * Enables the optimizer to proactively prioritize maintenance on high-risk assets *before* an acute emergency occurs.
  * Allows calibration into a continuous failure probability $\hat{p} \in [0.0, 1.0]$ for soft CP-SAT objective weighting.

### Secondary Extension (Future Phase):
* **`remaining_useful_life_days` (RUL):** Continuous count of days until health index falls below $40.0\%$.

---

## 12. Feature Dictionary

All features are calculated using historical telemetry strictly $\le T$:

| Feature Name | Definition | Lookback Window | Available at $T$? | Leakage Risk | Physical Justification |
|---|---|---|---|---|---|
| `current_health_index` | Estimated health index at date $T$ | Current day $T$ | Yes | None | Immediate snapshot of asset integrity |
| `health_degradation_velocity_14d` | Rate of health decline: $\frac{\text{Health}_{T} - \text{Health}_{T-14}}{14}$ | Past 14 days | Yes | None | Captures accelerating asset wear |
| `health_degradation_velocity_30d` | Rate of health decline over past 30 days | Past 30 days | Yes | None | Captures medium-term degradation trends |
| `cumulative_gmt_tonnage_30d` | Total gross million tons of traffic over asset | Past 30 days | Yes | None | Dynamic proxy for operational mechanical fatigue |
| `days_since_last_inspection` | Number of days elapsed since last USFD/visual inspection | Historical | Yes | None | Captures detection latency and uncertainty |
| `days_since_last_maintenance` | Number of days elapsed since last tamping/overhaul | Historical | Yes | None | Time-in-service since restoration |
| `past_defects_count_90d` | Number of minor/major defects logged on asset | Past 90 days | Yes | None | Asset failure recurrence indicator |
| `deferred_maintenance_count` | Number of times maintenance was requested but deferred | Past 90 days | Yes | None | Measures maintenance debt |
| `environmental_stress_index_7d` | Average ambient temp shock + rainfall severity | Past 7 days | Yes | None | Weather-induced thermal expansion / track buckling |
| `asset_age_years` | Operational service age of the asset | Static | Yes | None | Long-term material fatigue baseline |
| `asset_criticality` | Section importance weight ($1\text{--}5$) | Static | Yes | None | Impact weight of section |
| `speed_restriction_active` | Binary flag if speed restriction currently active at $T$ | Current day $T$ | Yes | None | Pre-existing operational impairment |

---

## 13. Temporal Split Strategy

To guarantee strict out-of-time evaluation and prevent look-ahead bias:

```
Historical Horizon: 180 Days
[===================== TRAIN =====================][=== VAL ===][=== TEST ===]
Day 1 ─────────────────────────────────────────── Day 120 ──── Day 150 ──── Day 180
           (67% of timeline)                          (17%)          (16%)
```

1. **Training Set (Days 1 to 120):** April 1 to July 29, 2026. Used to fit preprocessor pipelines and candidate models.
2. **Validation Set (Days 121 to 150):** July 30 to August 28, 2026. Used for hyperparameter tuning and classification threshold calibration.
3. **Test Set (Days 151 to 180):** August 29 to September 30, 2026. Out-of-time benchmark strictly evaluated once.

---

## 14. Class Imbalance Strategy

* **Expected Event Distribution:** In a well-maintained railway network, severe failure events within 14 days occur in approximately $6\%\text{--}10\%$ of observation windows.
* **Techniques Applied:**
  1. **Cost-Sensitive Learning:** Set `scale_pos_weight = (N_negative / N_positive)` in LightGBM / Gradient Boosting.
  2. **Threshold Optimization:** Calibrate decision boundary $\tau$ on the validation set using Precision-Recall trade-offs (optimizing $F_{\beta}$ with $\beta=2.0$ to favor recall over precision).
  3. **Metrics Selection:** Avoid raw accuracy; evaluate using **PR-AUC**, **ROC-AUC**, and **Recall@Top-20%**.

---

## 15. Baseline Model

A deterministic rule-based baseline is required to demonstrate ML value:

```python
def heuristic_baseline_predict(features: dict) -> float:
    """Deterministic Rule-Based Failure Risk Baseline"""
    score = 0.0
    if features["current_health_index"] < 65.0:
        score += 0.40
    if features["days_since_last_inspection"] > 45:
        score += 0.25
    if features["deferred_maintenance_count"] >= 2:
        score += 0.20
    if features["health_degradation_velocity_14d"] < -0.8:
        score += 0.15
    return min(1.0, score)
```

The ML model will be evaluated against this heuristic baseline across ROC-AUC, PR-AUC, and F1-score to verify that non-linear feature interactions provide measurable predictive gain.

---

## 16. Candidate ML Models

1. **LightGBM Classifier (`LGBMClassifier`):** Primary candidate. Fast, handles tabular non-linear interactions natively, supports missing values and sample weights.
2. **HistGradientBoostingClassifier (`sklearn.ensemble`):** Robust native scikit-learn alternative with zero third-party C++ binary dependency.
3. **Random Forest Classifier (`RandomForestClassifier`):** Bagged ensemble baseline for variance reduction comparison.
4. **Logistic Regression with Standard Scaler:** Linear baseline for linear separability testing.

---

## 17. Evaluation Metrics

| Metric | Target Goal | Purpose & Rationale |
|---|---|---|
| **PR-AUC (Precision-Recall AUC)** | $> 0.65$ | Evaluates ranking quality on imbalanced failure events. |
| **ROC-AUC** | $> 0.82$ | Measures discrimination capability across all thresholds. |
| **Recall (at calibrated $\tau$)** | $> 80.0\%$ | Critical for railway safety: must catch high-risk failures. |
| **Precision (at calibrated $\tau$)** | $> 45.0\%$ | Prevents excessive false alarms and unnecessary block requests. |
| **Brier Score Calibration** | $< 0.08$ | Ensures predicted probabilities $\hat{p}$ accurately reflect true risk. |

---

## 18. Explainability Strategy

RailSync AI will implement **SHAP (SHapley Additive exPlanations)** via `shap.TreeExplainer`:

1. **Global Explainability (`models/feature_importance.json`):** Export mean absolute SHAP values across the test split to document key system-wide risk drivers.
2. **Local Explainability (Per-Asset Diagnostic):** When an asset is flagged as high-risk, compute top-3 SHAP contributors (e.g., `+0.28 degradation_velocity`, `+0.19 deferred_count`, `+0.12 cumulative_gmt`) and render them in the UI Unscheduled/Explanation modal.

---

## 19. Model Persistence Design

* **Persistence Library:** `joblib` with `zlib` compression.
* **Artifact Path:** `backend/app/models/saved_models/asset_failure_risk_v2.joblib`
* **Artifact Metadata Schema:**
  ```json
  {
    "model_name": "RailSync_Asset_Failure_Risk_Predictor",
    "version": "2.0.0",
    "algorithm": "LGBMClassifier",
    "trained_at_utc": "2026-09-18T22:00:00Z",
    "training_rows": 5200,
    "feature_schema": [
      "current_health_index", "health_degradation_velocity_14d", "health_degradation_velocity_30d",
      "cumulative_gmt_tonnage_30d", "days_since_last_inspection", "days_since_last_maintenance",
      "past_defects_count_90d", "deferred_maintenance_count", "environmental_stress_index_7d",
      "asset_age_years", "asset_criticality", "speed_restriction_active"
    ],
    "metrics": {
      "test_roc_auc": 0.864,
      "test_pr_auc": 0.712,
      "test_f1": 0.685,
      "baseline_f1": 0.490
    },
    "calibration_threshold": 0.38
  }
  ```

---

## 20. Future RailSync Integration

The resulting ML probability $\hat{p}_i = P(\text{failure within 14d})$ enters the operational pipeline as follows:

```
[Asset History Database] ──> [Feature Extraction Pipeline] ──> [Pre-Trained Risk Model]
                                                                        ↓
                                                               [Predicted Risk p_i in [0, 1]]
                                                                        ↓
                                                [Two-Tier Prioritization Engine]
                                                - If Emergency Defect: Score = 98.0 (Safety Gate)
                                                - Else: Score = round(p_i * 75.0 + Criticality * 5.0, 1)
                                                                        ↓
                                                [CP-SAT Optimization Objective]
                                                - Maximize: sum(present_i * Priority_Score_i * 100)
                                                - Constraints: Timetable Headways & Machinery Buffers
                                                                        ↓
                                                [Final Validated Master Block Plan]
```

---

## 21. Optional Traffic-Risk Model (Design Only)

* **Purpose:** Predicts expected passenger/freight train delay (in minutes) if a maintenance block is granted on section $S$ during hour $[H_1, H_2]$.
* **Input Features:** `section_id`, `start_hour`, `duration_minutes`, `scheduled_train_count`, `freight_forecast_count`, `is_peak_hours`, `single_line_flag`.
* **Target ($y$):** Simulated knock-on delay minutes $\ge 0$.
* **Model Class:** `Ridge` or `HistGradientBoostingRegressor`.
* **Optimizer Integration:** Subtracted as a penalty term in CP-SAT:
  $$\max \left[ \sum (\text{Priority}_i \cdot 100) - \mu_{\text{traffic}} \sum (\text{PredictedDelay}_i) + \text{BundlingReward} \right]$$

---

## 22. Dataset Validation & Profiling

The dataset generator will include an automated suite of validation gates:
1. **Referential Integrity:** Every daily observation must map to an existing `asset_id` and `track_id`.
2. **Chronological Monotonicity:** Dates for an asset must advance strictly sequentially without gaps or duplicates.
3. **Physical Bound Checks:**
   * `health_index` $\in [0.0, 100.0]$
   * `track_wear_mm` $\ge 0.0$
   * `gmt_tonnage` $\ge 0.0$
4. **Temporal Leakage Audit:** Automated assert verifying that no feature at date $T$ references events from date $> T$.
5. **Class Balance Check:** Ensures positive failure event rate is within $[5.0\%, 12.0\%]$.

---

## 23. Reproducibility

* **Seed Configuration:** Global generator seed `RANDOM_SEED = 42` configured in `dataset_generation/config.py`.
* **Deterministic Sequences:** All stochastic trials (degradation noise, weather shocks, failure draws) use isolated `random.Random(seed)` instances.
* **Manifest & Checksums:** Output files saved with SHA-256 integrity hashes in `data/synthetic/manifest.json`.

---

## 24. Implementation Roadmap

```
Phase 1: Generator Architecture (Next Task)
├── dataset_generation/generators/longitudinal_history.py (Generates 180-day asset history)
├── dataset_generation/validators/temporal_validator.py (Verifies zero lookahead leakage)
└── data/synthetic/asset_daily_telemetry.csv & historical_events.csv

Phase 2: ML Pipeline & Pre-Training
├── backend/app/pipeline/feature_engineering_v2.py (Historical rolling feature extractors)
├── backend/app/pipeline/train_model.py (Trains LightGBM/GBR with temporal split & SHAP)
└── backend/app/models/saved_models/asset_failure_risk_v2.joblib

Phase 3: Integration & Frontend
├── backend/app/pipeline/ml_model.py (Updated to load persisted .joblib artifact)
├── backend/app/pipeline/optimizer.py (Objective tuning with calibrated ML scores)
└── frontend/src/components/TaskQueue.tsx (Renders SHAP explainability insights)
```
