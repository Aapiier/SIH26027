# RailSync AI — Comparative AI/ML Study

**Date:** September 18, 2026  
**Subject:** Comparative Study of Machine Learning Architectures across Reference A, Reference B, and RailSync AI (SIH26027)  
**Status:** Architectural Investigation & Design Specification (No Production Modifications)  

---

## 1. Executive Summary

This study presents a code-level, empirical investigation of the Machine Learning (AI/ML) implementations across three railway maintenance block planning systems:
1. **Reference A (`sih26027-prototype-main`):** A multi-model ensemble predicting 4 distinct operational signals (Asset Risk, Duration, Traffic Disruption, and Weather Risk) with serialized `.pkl` models.
2. **Reference B (`TRIKAAL-RAKSHA-BLOCK-main`):** A single `LightGBM` regression pipeline with `OneHotEncoder`, `joblib` serialization, and static `SHAP` TreeExplainer feature attributions.
3. **RailSync AI (Current Implementation):** An in-memory 11-dimensional `GradientBoostingRegressor` predicting continuous escalation risk integrated directly with a two-tier safety gate and OR-Tools CP-SAT objective rewards.

### Key Insights:
* **Synthetic Target Proxy Problem Across All Projects:** All three implementations suffer from synthetic target leakage, where the ML target is calculated from the exact input features via an arithmetic formula. None train on real or stochastic failure logs.
* **Solver Disconnect in Reference B:** Reference B's LightGBM model produces scores displayed in the UI, but its CP-SAT solver optimizes *solely* for saved bundling duration (`candidate["saved"]`), completely ignoring ML scores during schedule formulation.
* **Operational Signal Breadth in Reference A:** Reference A provides a broader domain vision by separating asset health risk from duration and traffic disruption prediction, but uses overly simplistic 3-to-5 feature random vectors.
* **RailSync AI's Architectural Advantage:** RailSync AI already possesses the most tightly integrated optimization bridge (ML priority directly acts as a CP-SAT selection reward) and the richest feature schema (11 domain features), but lacks model persistence and a non-leaking degradation target.

---

## 2. Reference A Model Analysis

* **Codebase Location:** [`reference/project_reference/sih26027-prototype-main/backend/app/pipeline/module2_ml_prediction.py`](file:///reference/project_reference/sih26027-prototype-main/backend/app/pipeline/module2_ml_prediction.py)
* **Model Artifacts Directory:** `reference/project_reference/sih26027-prototype-main/backend/app/ml_artifacts`

### Models Implemented:

| Artifact Name | Algorithm Class | Input Features | Target ($y$) | Downstream Consumer |
|---|---|---|---|---|
| `asset_risk.pkl` | `GradientBoostingClassifier` (or `XGBClassifier`) | `track_wear_mm`, `catenary_wear_pct`, `signal_fault_freq`, `ballast_compaction_pct`, `joint_temp_c` (5 features) | Discretized Risk Bucket: 0=Low, 1=Med, 2=High, 3=Critical | `compute_request_priority()` $\rightarrow$ Priority score |
| `duration.pkl` | `GradientBoostingRegressor` (or `XGBRegressor`) | `declared_urgency`, `defect_type_code`, `location_km` (3 features) | Expected duration in hours ($1.0\text{--}6.0\text{h}$) | Display / Candidate window sizing fallback |
| `traffic.pkl` | `GradientBoostingRegressor` (or `XGBRegressor`) | `start_time_hr`, `duration_hrs`, `train_count`, `is_night` (4 features) | Traffic Disruption Index ($0.0\text{--}100.0$) | `generate_candidate_windows()` Scorer |
| `weather.pkl` | `RandomForestClassifier` | `temperature_c`, `rainfall_mm`, `wind_speed_kmh` (3 features) | Weather Risk Level: 0=Low, 1=Medium, 2=High | Safety Engine Pre-validation Gate |

### Training, Data, & Lifecycle:
* **Training Data Generation:** 500 rows generated on-the-fly via `np.random.uniform` across fixed numerical intervals.
* **Target Derivation:** Deterministic arithmetic combinations (e.g., $y_{\text{traffic}} = 4.0 \cdot \text{trains} + 15.0 \cdot (1 - \text{is\_night}) + 2.5 \cdot \text{dur}$).
* **Serialization:** Standard Python `pickle.dump()`.
* **Inference Pattern:** Singleton class `MLPredictor.get_instance()` with deterministic fallback calculations if models fail to load.

---

## 3. Reference B Model Analysis

* **Codebase Location:** [`reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/train_model.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/train_model.py)
* **API Server:** [`reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/api_server.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/api_server.py)
* **Model Artifacts Directory:** `reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/models/`

### Model Details:
* **Artifact:** `defect_priority_lgb.pkl` ($155.8\text{ KB}$)
* **Algorithm Class:** `sklearn.pipeline.Pipeline` containing:
  1. `ColumnTransformer` with `OneHotEncoder(handle_unknown="ignore")` for `department` and `section`, and `passthrough` for numericals.
  2. `lightgbm.LGBMRegressor(n_estimators=150, learning_rate=0.05, max_depth=6, random_state=42)`.
* **Input Features (7 Features):**
  * Numerical: `severity`, `days_overdue`, `asset_age_years`, `past_failure_count`, `deferred_count`
  * Categorical: `department` (Engineering, S&T, TRD), `section` (NDLS-GZB, GZB-MTC, etc.)
* **Target Variable:** `calculated_risk_score` $\in [5.0, 100.0]$.
* **Training Dataset:** `data/synthetic/defects.csv` (350 rows generated by `scripts/generate_dataset.py`).

### Target Generation & Leakage:
In `generate_dataset.py`, the target is generated via:
$$\text{risk\_score} = 12.0 \cdot \text{severity} + 0.6 \cdot \text{days\_overdue} + 5.5 \cdot \text{past\_failures} + 7.5 \cdot \text{deferred} + 0.4 \cdot \text{asset\_age}$$
All five variables are then given directly to LightGBM as its input features.

### Explainability & Persistence:
* **SHAP Explainability:** Uses `shap.TreeExplainer` on the test split ($N=70$) to compute mean absolute SHAP values, saved to `models/feature_importance.json`. Top features: `severity` (6.18), `deferred_count` (5.76), `past_failure_count` (5.41).
* **Downstream Disconnect:** The predicted risk score is saved to Supabase/SQLite, but the CP-SAT solver ([`server/cp_sat_server.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/server/cp_sat_server.py#L160)) optimizes solely:
  $$\max \sum (\text{variable} \cdot \text{candidate["saved"]})$$
  The ML score has **zero mathematical influence** on the scheduling solver.

---

## 4. RailSync Current Model Analysis

* **Codebase Location:** [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py), [`feature_engineering.py`](file:///backend/app/pipeline/feature_engineering.py), [`prioritization.py`](file:///backend/app/pipeline/prioritization.py)

### Model Architecture:
* **Algorithm:** `GradientBoostingRegressor(n_estimators=60, learning_rate=0.08, max_depth=4, random_state=42)`
* **Input Features (11 Features):**
  `severity_level`, `department_code`, `duration_hours`, `deadline_window_hours`, `urgency_ratio`, `asset_criticality`, `degradation_risk`, `inspection_age_days`, `speed_restriction_impact`, `power_block_required`, `machinery_count`.
* **Target ($y$):** Continuous risk index $\in [0.0, 1.0]$.
* **Training Dataset:** Active SQLite database records ($N=86$ in demo).
* **Two-Tier Prioritization:**
  * **Tier 1 (Hard Safety Gate):** `EMERGENCY` defects $\rightarrow$ Fixed `98.0` (ML bypassed).
  * **Tier 1.5 (Critical Defects):** $\max(80.0, 75.0 + 20.0 \cdot \text{ml\_risk})$.
  * **Tier 2 (Routine/Urgent):** $\text{round}(75.0 \cdot \text{ml\_risk}, 1)$.
* **CP-SAT Solver Integration:** Passed directly into OR-Tools CP-SAT objective:
  $$\max \sum \left( \text{tv["present"]} \cdot \text{int}(\text{ai\_priority\_score} \cdot 100) \right) - \text{penalties} + \text{bundle\_rewards}$$

---

## 5. Side-by-Side Comparison

| Capability / Attribute | RailSync AI (Current) | Reference A (`sih26027`) | Reference B (`RAKSHA-BLOCK`) |
|---|---|---|---|
| **Primary Algorithm** | `GradientBoostingRegressor` | `GradientBoosting` + `RandomForest` Multi-Model | `LightGBM` (`LGBMRegressor`) |
| **Model Scope** | 1 unified risk model | 4 dedicated operational models | 1 defect priority model |
| **Feature Count** | **11 features** (Deepest domain feature set) | 3 to 5 features per model (15 total) | 7 features (5 numeric, 2 categorical) |
| **Categorical Handling** | Ordinal integer encoding | Hash modulo encoding | `OneHotEncoder` via `ColumnTransformer` |
| **Target Variable** | Multi-factor risk index $[0.0, 1.0]$ | 4 distinct operational targets | Defect priority score $[5.0, 100.0]$ |
| **Target Leakage** | Present (Direct linear formula) | Present (Uniform random + formula) | Present (Direct linear formula) |
| **Training Dataset** | Active database pool ($N=86$) | Random uniform vectors ($N=500$) | CSV file ($N=350$) |
| **Train/Test Split** | None in production | None in production | **80/20 split** ($N=280 / 70$) |
| **Evaluation Metrics** | Insufficient during runtime | None logged | **RMSE, MAE, $R^2$ logged** |
| **Explainability** | Dynamic $(Importance \times Value)$ | None | **SHAP TreeExplainer** (`.json`) |
| **Model Persistence** | In-memory singleton | `pickle` (`.pkl`) on disk | `joblib` (`.pkl`) on disk |
| **CP-SAT Integration** | **Direct integer reward ($P \times 100$)** | Indirect (Candidate window ranking) | **None (Ignored in CP-SAT)** |
| **Safety Gate Override**| **Yes (Tier 1 G&SR Gate = 98.0)** | Yes (`SafetyConstraintEngine`) | Partial (Rule-based urgency string) |

---

## 6. AI $\rightarrow$ Scheduling Flow Comparison

### 1. RailSync AI (Tight Hybrid Integration)
```
[Defects & Assets] → [11D Features] → [GBR Risk Model] → [Two-Tier Gate] → [Priority 0-98]
                                                                                ↓
[Candidate Windows] → [Multi-Dept Bundling] → [CP-SAT: Maximize (P*100 + Bundles - Delay)]
                                                                                ↓
                                                                     [Final Block Plan]
```

### 2. Reference A (Multi-Signal Pipeline)
```
[Asset Cond]   → [ML Model 1: Risk]     → [Priority Engine]   → [Group Weight]
[Timetables]   → [ML Model 3: Traffic]  → [Candidate Scorer]  → [Window Filter]
[Weather]      → [ML Model 4: Weather]  → [Safety Gate]       → [Permit/Reject]
[Work Request] → [ML Model 2: Duration] → [Duration Estimate]
                                                ↓
                                   [Sequential Greedy/CP-SAT] → [Final Schedule]
```

### 3. Reference B (Disconnected ML Scoring)
```
[Defects CSV] → [LightGBM Pipeline] → [Predicted Risk 5-100] → [DB Table Only]
                                                                       ↓
                                                      (Ignored by CP-SAT Solver)
                                                                       ↓
[Requests] → [Compatibility Filter] → [CP-SAT: Maximize Saved Minutes Only] → [Schedule]
```

---

## 7. Training Data Comparison

1. **RailSync AI:** Derives features directly from relational database tables (`MaintenanceRequest` joined with `Asset`). Highly contextual, but limited to the active operational request pool ($N=86$).
2. **Reference A:** Generates arbitrary uniform random arrays (`np.random.uniform`) inside `train_all_models()`. While it decouples training from active request IDs, it lacks realistic railway covariance (e.g., higher track wear should correlate with higher traffic density).
3. **Reference B:** Reads a static `data/synthetic/defects.csv` ($N=350$). Uses realistic column names (`days_overdue`, `past_failure_count`, `deferred_count`), providing a clean tabular dataset for supervised training.

---

## 8. Target / Label Comparison

All three systems exhibit the **Synthetic Target Proxy Problem**:

* **RailSync AI:** $y = 0.40 \cdot \text{sev} + 0.25 \cdot \text{urg} + 0.20 \cdot \text{crit} + 0.15 \cdot \text{deg}$.
* **Reference A:** $y_{\text{asset}} = \text{digitize}(0.35 \cdot \text{wear} + 0.25 \cdot \text{cat} + 0.25 \cdot \text{faults} + 0.15 \cdot (100 - \text{ballast}))$.
* **Reference B:** $y = 12.0 \cdot \text{sev} + 0.6 \cdot \text{days} + 5.5 \cdot \text{past\_fail} + 7.5 \cdot \text{deferred} + 0.4 \cdot \text{age}$.

### The Fundamental Limitation:
Because the target in all three repositories is an exact arithmetic linear combination of the input features, the machine learning models are merely performing non-linear polynomial regression on an engineered formula. **None of the three models are predicting genuine empirical failure probabilities.**

---

## 9. Feature Engineering Comparison

* **RailSync AI:** Extracts the most comprehensive set of operational constraints:
  * Temporal pressure: `urgency_ratio = duration_hours / deadline_window_hours`
  * Operational disruption: `speed_restriction_impact = (110 - speed_res) / 110`
  * Resource intensity: `power_block_required`, `machinery_count`
  * Asset state: `degradation_risk = (100 - health_idx) / 100`
* **Reference A:** Separates features by physical domain (track geometry, traction, signaling, traffic, weather), but encodes categorical defects via unstable hash modulos (`hash(defect_type) % 10`).
* **Reference B:** Standardizes categorical features (`department`, `section`) using `OneHotEncoder`, which avoids arbitrary ordinal ranking assumptions.

---

## 10. Model Evaluation Comparison

| Evaluation Metric | RailSync AI | Reference A | Reference B |
|---|---|---|---|
| **Train / Test Split** | Not implemented in runtime | Not implemented | **80% Train / 20% Test** |
| **Validation Strategy** | None | None | Simple Holdout Split |
| **Regression Metrics** | Insufficient | Not implemented | **RMSE (1.42), MAE (0.98), $R^2$ (0.98)** |
| **Classification Metrics**| Not applicable | Not implemented | Not applicable |
| **Feature Attribution** | Dynamic $(Imp \times Val)$ | None | **SHAP TreeExplainer Mean Values** |
| **Evaluation Rigor** | Low | Low | **Moderate** |

---

## 11. Strengths and Weaknesses

### Reference A
* **Strengths:** Excellent multi-modal domain decomposition (separates asset risk, duration risk, traffic disruption, and weather risk).
* **Weaknesses:** Unrealistic training data (pure uniform noise), weak feature sets (3–5 features), brittle hash-based categorical encoding.

### Reference B
* **Strengths:** Clean scikit-learn `Pipeline` + `ColumnTransformer` + `LightGBM` architecture, `joblib` persistence, SHAP explainability export.
* **Weaknesses:** Complete disconnect between ML predictions and CP-SAT optimization; synthetic target leakage.

### RailSync AI (Current)
* **Strengths:** Strongest feature engineering schema (11 operational features), direct CP-SAT mathematical reward integration, strict deterministic Tier 1 safety override.
* **Weaknesses:** In-memory lazy training, lack of disk serialization, synthetic formula target leakage.

---

## 12. Reusable Ideas

1. **Scikit-Learn `Pipeline` & `ColumnTransformer` (From Ref B):** Package feature extraction, one-hot encoding, and scaling into a clean, reusable estimator pipeline.
2. **Pre-Trained Disk Persistence with `joblib` (From Ref B):** Save trained model artifacts (`.joblib`) with versioning metadata rather than fitting lazily in RAM.
3. **Dedicated Traffic Disruption Signal (From Ref A):** Introduce a dedicated prediction for corridor congestion/delay impact to weight candidate shadow windows.
4. **SHAP TreeExplainer Export (From Ref B):** Formalize feature importance reporting using SHAP values for superior explainability.

---

## 13. Ideas We Should NOT Reuse

1. **Do NOT Disconnect ML from the Solver (Reject Ref B's Approach):** Having ML produce a score that is ignored by CP-SAT makes the AI purely decorative.
2. **Do NOT Use Hash Modulos for Categorical Features (Reject Ref A's Approach):** `hash(defect) % 10` introduces arbitrary collision artifacts and false ordinal rankings.
3. **Do NOT Train on Pure Uniform Random Noise (Reject Ref A's Approach):** Training on `np.random.uniform` produces models that cannot capture physical asset correlations.

---

## 14. Recommended RailSync AI Architecture

The optimal architecture for **RailSync AI (SIH26027)** combines the best engineering practices from all three implementations into a robust, defensible pipeline:

```
+-----------------------------------------------------------------------------------+
|                        1. DUAL-STREAM SYNTHETIC INGESTION                         |
|   Historical Asset Degradation Sequences (Weibull) + Live Multi-Dept Work Demands |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     2. FEATURE ENGINEERING & PREPROCESSING                        |
|   ColumnTransformer: Categorical One-Hot (Dept, Defect) + Standardized Numerics   |
+-----------------------------------------------------------------------------------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
+-----------------------------------------+ +---------------------------------------+
|     MODEL 1: ASSET DEGRADATION RISK     | |    MODEL 2: TRAFFIC DISRUPTION RISK   |
|   Gradient Boosting / LightGBM Regressor| |   LightGBM / Ridge Regressor          |
|   Predicts: Failure Risk [0.0 - 1.0]    | |   Predicts: Expected Delay (Minutes)  |
|   Persisted: asset_risk_v1.joblib       | |   Persisted: traffic_risk_v1.joblib   |
+-----------------------------------------+ +---------------------------------------+
                     |                                       |
                     +-------------------+-------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        3. TWO-TIER PRIORITIZATION ENGINE                          |
|   - Tier 1 Hard Safety Gate: Emergency/Fracture -> Absolute Priority 98.0         |
|   - Tier 2 ML Synthesis: Priority = f(ML_Risk, Asset_Criticality, Urgency)       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|               4. CP-SAT MATHEMATICAL OPTIMIZATION & SCHEDULING                    |
|   - Maximize: sum(present_i * Priority_i * 100) + Bundling_Reward                 |
|   - Minimize: sum(Traffic_Disruption_Risk * Freight_Weight) + Lateness_Penalties  |
|   - Hard Constraints: Timetable Gap Containment, Machinery Transit Buffers        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                  5. INDEPENDENT SENTINEL & EXPLAINABILITY AUDIT                   |
|   - Deterministic G&SR Compliance Validation                                      |
|   - SHAP Global Feature Importance + Local Task Attribution Breakdown            |
+-----------------------------------------------------------------------------------+
```

---

## 15. Proposed Future ML Experiments

### Experiment 1: Stochastic Asset Degradation Predictor
* **Hypothesis:** Modeling non-linear wear-out via Weibull survival distributions allows Gradient Boosting to learn genuine non-linear failure probabilities rather than an arithmetic formula proxy.
* **Input Features:** Asset age, cumulative gross tonnage (GMT), last tamping date, ultrasonic flaw history, operating temperature.
* **Target ($y$):** Simulated days-to-failure / remaining useful life (RUL).
* **Model Class:** `LGBMRegressor` or `GradientBoostingRegressor`.
* **Evaluation Metric:** Test RMSE, MAE, and $R^2$ on held-out asset lifecycle trajectories.
* **Role in RailSync:** Feeds the Tier 2 prioritization engine to identify silent high-risk assets before acute defects occur.

### Experiment 2: Corridor Traffic Disruption & Freight Impact Predictor
* **Hypothesis:** Predicting passenger and freight delay impact based on timetable density allows the optimizer to pick candidate windows that minimize network congestion.
* **Input Features:** Section ID, block duration, start hour, freight train count, passenger train count, bidirectional headway.
* **Target ($y$):** Cumulative knock-on train delay minutes.
* **Model Class:** `Ridge` or `RandomForestRegressor`.
* **Evaluation Metric:** Test $R^2$ and MAE.
* **Role in RailSync:** Injected as a penalty coefficient in the CP-SAT objective function to bias block placement toward low-impact corridors.

---

## 16. Exact Files and Functions Examined

| Purpose | Project / Repository | File Path | Function / Class |
|---|---|---|---|
| **Multi-Model ML Service** | Reference A | [`backend/app/pipeline/module2_ml_prediction.py`](file:///reference/project_reference/sih26027-prototype-main/backend/app/pipeline/module2_ml_prediction.py) | `MLPredictor`, `train_all_models()`, `predict_asset_risk()` |
| **Ref A API Integration** | Reference A | [`backend/app/routers/api.py`](file:///reference/project_reference/sih26027-prototype-main/backend/app/routers/api.py) | `get_priority_analysis_endpoint()`, `run_optimization_endpoint()` |
| **LightGBM Pipeline & Training** | Reference B | [`src/ml/train_model.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/train_model.py) | `build_pipeline()`, `load_training_data()`, `save_shap_importance()` |
| **Ref B Dataset Generation** | Reference B | [`scripts/generate_dataset.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/scripts/generate_dataset.py) | `generate_dataset()` (Calculates synthetic `calculated_risk_score`) |
| **Ref B CP-SAT Solver** | Reference B | [`server/cp_sat_server.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/server/cp_sat_server.py) | `RequestHandler.do_POST()`, `candidate_data()` |
| **Ref B ML FastAPI Server** | Reference B | [`src/ml/api_server.py`](file:///reference/project_reference/TRIKAAL-RAKSHA-BLOCK-main/src/ml/api_server.py) | `predict_priority()`, `health_check()` |
| **RailSync Feature Engineering** | RailSync AI | [`backend/app/pipeline/feature_engineering.py`](file:///backend/app/pipeline/feature_engineering.py) | `extract_request_features()`, `feature_dict_to_vector()` |
| **RailSync ML Model** | RailSync AI | [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py) | `DefectRiskPredictor`, `train_on_synthetic_pool()`, `predict_risk()` |
| **RailSync Prioritization** | RailSync AI | [`backend/app/pipeline/prioritization.py`](file:///backend/app/pipeline/prioritization.py) | `run_prioritization_pipeline()` |
| **RailSync CP-SAT Optimizer** | RailSync AI | [`backend/app/pipeline/optimizer.py`](file:///backend/app/pipeline/optimizer.py) | `solve_maintenance_schedule()` |
