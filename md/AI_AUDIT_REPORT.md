# RailSync AI — AI/ML Implementation Audit

**Audit Date:** September 18, 2026  
**System:** RailSync AI (SIH26027 Prototype)  
**Scope:** Machine Learning, Feature Engineering, Prioritization, Explainability, and Solver Integration  

---

## 1. Executive Summary

This report provides an independent, code-level audit of the Artificial Intelligence and Machine Learning (AI/ML) implementation within the **RailSync AI** prototype. 

The audit reveals that RailSync AI implements a **partially integrated, hybrid AI architecture** combining a deterministic safety gate (Tier 1) with an explainable `GradientBoostingRegressor` (Tier 2) and an OR-Tools CP-SAT discrete optimization engine. While the pipeline executes end-to-end without runtime errors, the current ML training process operates on a **synthetic target proxy with direct feature leakage** rather than real-world historical asset failure logs. The ML output feeds directly into the CP-SAT objective function as a task-selection reward multiplier; however, under the current track topology and timetable constraints, hard operational feasibility gates (timetable window overlap and machine availability) heavily dominate task selection.

---

## 2. Current AI Architecture

The following diagram illustrates the exact data and execution flow of the AI/ML subsystem within RailSync AI:

```
+-----------------------------------------------------------------------------------+
|                           1. INGESTION & DATA SOURCES                             |
|  Simulated TMS (Track) | Simulated SMMS (S&T) | Simulated TDMS (TRD) | Assets DB  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                      2. FEATURE EXTRACTION & NORMALIZATION                        |
|  backend/app/pipeline/feature_engineering.py :: extract_request_features()        |
|  [11-Dimensional Feature Vector: severity, urgency_ratio, criticality, etc.]      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         3. MACHINE LEARNING RISK MODEL                            |
|  backend/app/pipeline/ml_model.py :: DefectRiskPredictor (Gradient Boosting)       |
|  - In-memory fit on synthetic pool (y = 0.40*sev + 0.25*urg + 0.20*crit + 0.15*deg)
|  - Predicts continuous defect risk score: ml_risk in [0.0, 1.0]                   |
|  - Computes feature attribution: (feature_importance * feature_value)             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                      4. TWO-TIER PRIORITIZATION ENGINE                            |
|  backend/app/pipeline/prioritization.py :: run_prioritization_pipeline()          |
|  - Tier 1 (Hard Safety Gate): Emergency/Fracture -> Score = 98.0 (ML Overridden)  |
|  - Tier 1.5 (Critical Defects): Score = max(80.0, 75.0 + ml_risk * 20.0)         |
|  - Tier 2 (Routine/Urgent): Score = ml_risk * 75.0 (Pure ML Scaling)              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         5. CP-SAT MATHEMATICAL OPTIMIZER                          |
|  backend/app/pipeline/optimizer.py :: solve_maintenance_schedule()                |
|  - Objective Reward Term: sum(tv["present"] * int(ai_priority_score * 100))       |
|  - Hard Constraints: Timetable Gap Containment, Machinery Transit Buffers         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        6. FRONTEND VISUALIZATION & AUDIT                          |
|  - Task Queue Table: Displays ai_priority_score, severity, urgency tag            |
|  - Unscheduled Explanation Modal: Explains window/resource bottlenecks            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Model Used

* **Algorithm:** `GradientBoostingRegressor` (from `sklearn.ensemble`)
* **Hyperparameters:**
  * `n_estimators`: 60
  * `learning_rate`: 0.08
  * `max_depth`: 4
  * `random_state`: 42
* **Definition Location:** [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py#L13-L39), class `DefectRiskPredictor`.
* **Instantiation:** Module-level singleton `_predictor = DefectRiskPredictor()` in [`backend/app/pipeline/prioritization.py`](file:///backend/app/pipeline/prioritization.py#L12).
* **Training Location:** [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py#L41-L68), method `train_on_synthetic_pool()`.
* **Prediction Location:** [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py#L69-L95), method `predict_risk()`.
* **Input Feature Vector (11 Features):**
  1. `severity_level` (float: 1.0 to 4.0)
  2. `department_code` (float: 1.0=ENG, 2.0=S&T, 3.0=TRD)
  3. `duration_hours` (float: duration in hours)
  4. `deadline_window_hours` (float: hours between earliest start and deadline)
  5. `urgency_ratio` (float: `duration_hours / deadline_window_hours`)
  6. `asset_criticality` (float: 1.0 to 5.0)
  7. `degradation_risk` (float: `(100.0 - health_index) / 100.0`)
  8. `inspection_age_days` (float: days since last inspection)
  9. `speed_restriction_impact` (float: `(110.0 - speed_res) / 110.0`)
  10. `power_block_required` (binary: 0.0 or 1.0)
  11. `machinery_count` (float: number of heavy machines required)
* **Target Variable ($y$):** Continuous risk index $\in [0.0, 1.0]$.
* **Exact Output:** Tuple `(ml_risk: float, feature_attribution: Dict[str, float])`.
* **Output Consumption:**
  * Consumed in `prioritization.py` to calculate `ai_priority_score` and `ai_urgency_level`.
  * Written to the database table `maintenance_requests` in columns `ai_risk_score`, `ai_priority_score`, and `ai_urgency_level`.
  * Multiplied by 100 in `optimizer.py` as an integer linear reward term for the CP-SAT objective function.

---

## 4. Training Data Audit

* **Source:** In-memory query of `MaintenanceRequest` and `Asset` tables from the active SQLite database (`data/synthetic/maintenance_requests.json` and `data/synthetic/assets.json`).
* **Row Count:** 86 rows in the standard demo pool.
* **Feature Count:** 11 numeric features.
* **Missing-Value Handling:** Default fallback values assigned in `feature_engineering.py` (e.g., `criticality_weight = 3.0`, `health_index = 85.0`, `deadline_window_hours = 24.0`).
* **Scaling/Normalization:** Min-max and quotient normalization in feature extraction functions (e.g., severity divided by 4, health index inverted to 0–1).
* **Train/Test Split & Cross-Validation:** **None** in the production pipeline execution. The model fits on all available active database rows ($N=86$).
* **Random Seed:** Fixed at `random_state=42`.

### Target Generation & Data Leakage Assessment
> [!WARNING]
> **Severe Target Leakage Identified (Synthetic Formula Proxy):**  
> The target variable $y$ is computed in `train_on_synthetic_pool` using the following exact linear formula:
> $$y = 0.40 \cdot \frac{\text{severity}}{4.0} + 0.25 \cdot \min(1.0, \text{urgency\_ratio}) + 0.20 \cdot \frac{\text{criticality}}{5.0} + 0.15 \cdot \text{degradation\_risk}$$
> Because all four terms (`severity_level`, `urgency_ratio`, `asset_criticality`, `degradation_risk`) are simultaneously supplied as raw input features to the `GradientBoostingRegressor`, the model is not discovering latent relationships or predicting real failure outcomes. It is approximating a closed-form deterministic arithmetic formula defined in Python.

---

## 5. Model Evaluation

### Metrics Evaluated in Diagnostic Audit (80/20 Train/Test Split on Current Pool)

| Metric | Measured Value | Meaning & Context |
|---|---|---|
| **Train $R^2$** | **0.9999** | Perfect fit due to learning the exact synthetic formula. |
| **Test $R^2$** | **0.8076** | Gradient Boosting trees approximate the continuous plane on unseen samples. |
| **Test RMSE** | **0.0655** | Root Mean Squared Error across the $[0, 1]$ risk range. |
| **Test MAE** | **0.0342** | Mean Absolute Error is ~3.4% of total risk score. |
| **ROC-AUC / Precision / Recall** | *N/A* | Not applicable (Regression model predicting continuous risk, not a binary classifier). |

### Evaluation Findings
1. **ML evaluation is currently insufficient** in the production pipeline because no train/test split, validation score, or loss metrics are computed or logged during runtime execution.
2. The high test $R^2$ (0.808) is an artifact of synthetic target leakage, not evidence of real-world railway predictive accuracy.

---

## 6. AI $\rightarrow$ Priority Flow

The prioritization engine ([`backend/app/pipeline/prioritization.py`](file:///backend/app/pipeline/prioritization.py#L48-L69)) executes a **two-tier decision structure**:

$$\text{Priority Score} = \begin{cases} 
98.0 & \text{if } \text{Severity} = \text{EMERGENCY or safety defect (Tier 1 Gate)} \\
\max(80.0, 75.0 + 20.0 \cdot \text{ml\_risk}) & \text{if } \text{Severity} = \text{CRITICAL or flaw defect (Tier 1.5)} \\
\text{round}(75.0 \cdot \text{ml\_risk}, 1) & \text{otherwise (Tier 2 Routine / Urgent)}
\end{cases}$$

### Behavioral Implications:
* For **EMERGENCY** defects (e.g., Rail Fracture Risk), the deterministic safety gate completely overrides the ML model, assigning an unconditional score of `98.0`.
* For **CRITICAL** defects, ML modulates the score between `80.0` and `95.0`.
* For **URGENT** and **ROUTINE** tasks, ML risk dictates 100% of the score between `0.0` and `75.0`.

---

## 7. AI $\rightarrow$ CP-SAT Flow

The connection between the ML risk model and Google OR-Tools CP-SAT is implemented in [`backend/app/pipeline/optimizer.py`](file:///backend/app/pipeline/optimizer.py#L146-L150):

```python
# Multi-Objective Optimization Term in CP-SAT
for req_id, tv in task_vars.items():
    p_score = tv["request"].ai_priority_score or 50.0
    # High reward for scheduling high priority / ML-escalated tasks
    obj_terms.append(tv["present"] * int(p_score * 100))
```

### How Priority Influences Optimization:
1. **Reward Weight:** A task with priority score $98.0$ contributes $+9,800$ to the maximization objective when scheduled (`present == 1`), whereas a routine task with score $30.0$ contributes $+3,000$.
2. **Task Selection Under Contention:** When two tasks compete for the same track section during the same time window and cannot both be accommodated, CP-SAT will select the task with higher `ai_priority_score`.
3. **Empirical Finding on Current Dataset:** In the baseline benchmark, because timetable window slots are sparse and distributed across different track sections and durations, timetable window containment constraints (hard constraints) dominate task feasibility. In the standard scenario without artificial window bottlenecks, 16 feasible tasks are scheduled in both flat-priority and ML-priority modes.

---

## 8. Feature Importance & Explainability

### Implementation Details:
* **Attribution Method:** Computed in `ml_model.py` via native `model.feature_importances_` multiplied element-wise by the task's normalized feature vector:
  $$\text{Attribution}_i = \text{Importance}_i \times \text{FeatureValue}_i$$
* **Global Model Feature Importances (Empirical):**
  * `severity_level`: **78.61%**
  * `deadline_window_hours`: **11.03%**
  * `urgency_ratio`: **3.14%**
  * `asset_criticality`: **3.02%**
  * `degradation_risk`: **2.58%**
  * `speed_restriction_impact`: **1.16%**
  * `inspection_age_days`: **0.29%**
  * `duration_hours`: **0.10%**
  * `department_code`: **0.06%**
  * `power_block_required`: **0.00%**
  * `machinery_count`: **0.00%**
* **Frontend Delivery:** Explanations are returned via `/api/v1/tasks/{id}/explain` and displayed to operators in the UI Unscheduled Explanation Modal.

---

## 9. Synthetic Data Realism

* **Nature of Labels:** The target is a **deterministic synthetic proxy**. It combines severity, urgency, criticality, and degradation into a mathematical composite index.
* **Evaluation Context for SIH Prototype:** For an academic/hackathon demonstration, this structure is a viable proof-of-concept demonstrating how multi-modal sensor and asset data feed into a machine learning scoring pipeline. However, it should be accurately described as an *engineered risk-index regression model* rather than a model trained on historical train derailments or field failure telemetry.

---

## 10. Model Persistence

* **Current Implementation:** In-memory singleton (`_predictor = DefectRiskPredictor()`).
* **Retraining Behavior:** The model trains once lazily in memory upon the first invocation of `run_prioritization_pipeline()` and remains resident in RAM across subsequent API calls in the same Python process.
* **Saved Artifacts:** No `.joblib`, `.pkl`, or `.onnx` model files currently exist on disk.
* **Recommended Production Approach:** Pre-train the model on an extended historical defect dataset, serialize to disk (`backend/app/models/saved_models/defect_risk_v1.joblib`), and load the pre-trained artifact during FastAPI startup lifespan.

---

## 11. Frontend & API Integration

The full execution path from user interface to ML prioritization is verified as follows:

```
[UI] User clicks "Run AI Optimization" or "Prioritize Tasks" in Header.tsx
       ↓
[API] POST /api/v1/tasks/prioritize
       ↓
[Backend Pipeline] backend/app/pipeline/prioritization.py :: run_prioritization_pipeline(db)
       ↓
[ML Prediction] backend/app/pipeline/ml_model.py :: DefectRiskPredictor.predict_risk()
       ↓
[Database] Updates MaintenanceRequest columns (ai_priority_score, ai_risk_score, ai_urgency_level)
       ↓
[UI Display] TaskQueue.tsx displays:
  - Numerical AI Priority Score (e.g., 98.0, 78.4, 42.1)
  - Color-coded urgency badge (CRITICAL_EMERGENCY, HIGH_PRIORITY, ROUTINE_SCHEDULE)
  - Interactive "Explain" button triggering UnscheduledModal.tsx
```

---

## 12. Test Results

The test suite was executed against the active implementation:

```
Command: py -3.12 -m pytest backend/tests/ -v
Result: 9 passed, 0 failed, 5 deprecation warnings in 4.49s

- test_api_e2e.py ......................... PASSED
- test_candidate_windows.py .............. PASSED
- test_ingestion.py ....................... PASSED
- test_optimizer_and_validator.py ......... PASSED
- test_prioritization.py .................. PASSED
- test_reoptimization.py .................. PASSED
```

### Verification of Key Checks:
* ✅ Model trains successfully without exceptions.
* ✅ Generates bounded risk predictions in range $[0.0, 1.0]$.
* ✅ Hard safety gate guarantees emergency tasks receive $\ge 95.0$ priority.
* ✅ Feature attribution map is populated for all 86 requests.

---

## 13. Decorative vs. Meaningful AI Assessment

### Classification: **B. Partially Integrated AI**

### Justification & Evidence:
1. **Why it is not "Mostly Decorative" (Option C):**
   * The ML model is not mock code or a hardcoded stub. It is a genuine `GradientBoostingRegressor` from `scikit-learn`.
   * It extracts an 11-dimensional feature vector and produces continuous outputs.
   * Its output is not merely displayed in the UI; it is mathematically linked to the CP-SAT objective function (`obj_terms.append(tv["present"] * int(p_score * 100))`), directly dictating task value under constrained window contention.
2. **Why it is not yet "Meaningfully Integrated" (Option A):**
   * The training target is computed algebraically from the exact features given to the model (target leakage / proxy fitting).
   * The model trains in memory without persistent model versioning or serialization.
   * Under unconstrained window availability, physical feasibility constraints dominate task selection before ML scores come into play.

---

## 14. Recommended Next Step for SIH26027

### Recommended Strategy: **Option E (Combination of A, B, and D)**
1. **Preserve Two-Tier Architecture:** Retain the Tier 1 deterministic safety gate for G&SR compliance (emergencies must always take absolute precedence) while keeping CP-SAT strictly responsible for constraint satisfaction.
2. **Enhance Synthetic Failure Dataset:** Introduce a stochastic degradation simulation (e.g., non-linear Weibull asset wear-out curves and weather shock factors) to decouple the training target from a simple arithmetic sum of input features.
3. **Add Model Persistence:** Serialize the trained model to `defect_risk_gbr_v1.joblib` with versioning metadata.
4. **Transparent Presentation:** Present the AI accurately during the SIH demo as an *Explainable Multi-Factor Asset Risk & Escalation Predictor* that feeds an exact *Constraint Programming Master Block Scheduler*.

---

## 15. Exact Files and Functions

| Purpose | File | Function / Class | Role in System |
|---|---|---|---|
| **Feature Extraction** | [`backend/app/pipeline/feature_engineering.py`](file:///backend/app/pipeline/feature_engineering.py) | `extract_request_features()` | Converts raw request & asset DB records into standardized 11D feature dict |
| **Vector Serialization** | [`backend/app/pipeline/feature_engineering.py`](file:///backend/app/pipeline/feature_engineering.py) | `feature_dict_to_vector()` | Orders feature dictionary into numeric float list for scikit-learn input |
| **ML Model Definition** | [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py) | `DefectRiskPredictor` | Scikit-learn `GradientBoostingRegressor` container with feature attribution |
| **Model Training** | [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py) | `DefectRiskPredictor.train_on_synthetic_pool()` | In-memory model training on asset/request feature matrix |
| **Risk Prediction** | [`backend/app/pipeline/ml_model.py`](file:///backend/app/pipeline/ml_model.py) | `DefectRiskPredictor.predict_risk()` | Computes risk index $[0.0, 1.0]$ and element-wise feature attribution |
| **Prioritization Engine** | [`backend/app/pipeline/prioritization.py`](file:///backend/app/pipeline/prioritization.py) | `run_prioritization_pipeline()` | Applies Tier 1 Safety Gates + Tier 2 ML Scaling and updates database |
| **Optimization Engine** | [`backend/app/pipeline/optimizer.py`](file:///backend/app/pipeline/optimizer.py) | `solve_maintenance_schedule()` | Formulates CP-SAT model using `ai_priority_score * 100` as objective reward |
| **Tasks API Router** | [`backend/app/routers/tasks_router.py`](file:///backend/app/routers/tasks_router.py) | `run_prioritization()` | POST endpoint `/api/v1/tasks/prioritize` triggering pipeline execution |
| **Task Explanation API** | [`backend/app/routers/tasks_router.py`](file:///backend/app/routers/tasks_router.py) | `explain_task()` | GET endpoint `/api/v1/tasks/{id}/explain` providing feasibility diagnostics |
| **Optimization API** | [`backend/app/routers/optimization_router.py`](file:///backend/app/routers/optimization_router.py) | `run_solver()` | POST endpoint `/api/v1/optimization/solve` executing CP-SAT scheduler |
| **UI Task Ingestion Queue**| [`frontend/src/components/TaskQueue.tsx`](file:///frontend/src/components/TaskQueue.tsx) | `TaskQueue` | Renders prioritized task list, severity badges, and AI scores |
| **Prioritization Test** | [`backend/tests/test_prioritization.py`](file:///backend/tests/test_prioritization.py) | `test_prioritization_pipeline()` | Automated test verifying emergency override and score bounds |
