# RailSync AI: AI-Powered Automatic Block Planning System
## Smart India Hackathon 2024 — Problem Statement SIH26027

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![OR-Tools](https://img.shields.io/badge/CP--SAT-OR--Tools_v9.9-4285F4?style=flat&logo=google&logoColor=white)](https://developers.google.com/optimization)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-HistGradientBoosting_v3.0-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-61%20Passed-brightgreen?style=flat&logo=pytest&logoColor=white)](backend/tests/)

> **"AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"**  
> *Ministry of Railways / Indian Railways*  
> **Corridor:** Bilaspur – Nagpur (BSP–NGP), South East Central Railway (SECR) — 8 Stations, 7 Track Sections, 16 Tracks, 174 Assets, 120 Trains.

---

## 📖 Executive Summary

Indian Railways manages one of the world's densest railway networks, operating over 13,000 passenger and 9,000 freight trains daily across 68,000+ route kilometers. Routine and emergency maintenance of permanent way tracks, signaling, and 25kV traction overhead equipment (OHE) requires reserving track segments (**"Maintenance Blocks"**).

Currently, block scheduling involves manual inter-departmental negotiations that often lead to:
1. **Fragmented Possessions**: Track (P-Way), Signaling (S&T), and Electrical (TRD) taking separate, uncoordinated blocks on the same track.
2. **Lost Line Capacity**: Excess corridor downtime reducing commercial train throughput and punctuality.
3. **Reactive Emergency Repairs**: Late detection of degradation forcing emergency speed restrictions or unplanned block cancellations.

**RailSync AI** solves this challenge with an end-to-end decision-support platform combining **longitudinal asset failure prediction**, **two-tier safety-gated prioritization**, **conflict-free timetable shadow-window extraction**, **cross-department maintenance bundling**, **exact CP-SAT mathematical optimization**, **explainable opportunity evaluation**, and **independent safety validation**.

---

## 🏛️ System Architecture & Pipeline Flow

RailSync AI separates predictive intelligence from safety-critical scheduling. The AI model produces a risk signal; the deterministic safety, bundling, and optimization layers remain authoritative.

```
Multi-System Ingestion (TMS / SMMS / TDMS / COA / FOIS)
                          ↓
      Zero-Leakage Temporal Feature Engineering (12D Lags)
                          ↓
  HistGradientBoosting GBDT Asset Failure Risk Predictor (v3.0)
                          ↓
      Safety-Gated Multi-Tier Prioritization Engine
        ├── Tier 1: Emergency Hard Safety Gate (Dominant)
        └── Tier 2 / 3: ML Risk-Weighted Preventive Ranking
                          ↓
      Feasible Shadow-Window Extraction (≥15m Train Buffers)
                          ↓
      Cross-Department Maintenance Bundling Matrix
                          ↓
      Google OR-Tools CP-SAT Mathematical Optimizer
                          ↓
      Maintenance Opportunity Engine (Explainable 0–100 Score)
                          ↓
      Independent Sentinel Safety Validator (7 Physical Invariants)
                          ↓
      Tamper-Evident SHA-256 Audit Trail & OCC React Dashboard
```

---

## 🌟 Core Capabilities & Features

### 1. Multi-Department Data Ingestion & Normalization
- Normalizes maintenance defect work orders across Track (`ENGINEERING` / TMS), Signaling (`SIGNAL_TELECOM` / SMMS), and Traction (`TRD` / TDMS).
- Ingests sectional train timetable occupancies and goods/freight forecasts across 8 stations and 7 inter-station sections.

### 2. Predictive Asset Failure Risk Model (`HistGradientBoosting GBDT v3.0`)
- Predicts $P(\text{failure\_within\_14d})$ (the probability of an asset experiencing an emergency defect, breakdown, or mandatory emergency speed restriction within the subsequent 14 days).
- Evaluates 12 strictly backward-looking temporal degradation features with **zero target formula leakage**.
- Validated via **out-of-time temporal validation** (Train: Days 0–500, Val: Days 501–615, Test: Days 616–730).
- Outperforms deterministic heuristic baseline by **+39.9% test PR-AUC** (Test PR-AUC `0.0785` vs Baseline `0.0561`).

### 3. Safety-Gated Multi-Tier Prioritization
- **Tier 1 (Hard Safety Gate)**: Critical flaws (rail fractures, point failures, mandatory emergency speed restrictions) are locked into Tier 1 (`base_score = 90.0`, `tier = 1`). ML failure risk cannot downgrade or displace a safety-critical defect.
- **Tier 2 / Tier 3 (Preventive & Routine)**: Priority scores dynamically rank preventive tasks using asset health, degradation velocity, inspection gaps, and ML failure risk.

### 4. Cross-Department Maintenance Bundling
- Synchronizes compatible Engineering (track tamping), S&T (point overhaul), and TRD (OHE catenary inspection) work orders on the same section into unified track possessions.
- Enforces departmental compatibility matrices while preventing simultaneous physical obstruction.

### 5. Exact Mathematical Optimization (Google OR-Tools CP-SAT)
- Formulates block scheduling as a Constrained Optimization Problem guaranteeing:
  - Exact interval non-overlap on physical tracks.
  - $\ge 15$-minute safety headway buffers against scheduled train occupancies.
  - Disjunctive transit routing buffers for shared heavy machinery (e.g. BCM / CSM tampers).
  - 25kV traction power block isolation synchronization.

### 6. Maintenance Opportunity Engine ("Why this Window?")
- Computes an explainable **0–100 Opportunity Score** for every candidate block window answering: *"Why is this specific slot the most operationally valuable?"*
- Provides an exact mathematical breakdown:
  $$\text{Opportunity Score} = \text{Base Value} + \text{Risk Value} + \text{Bundling Benefit} + \text{Urgency Value} - \text{Traffic Penalty} - \text{Possession Cost}$$
- Identifies alternative and suboptimal window candidates.

### 7. Independent Sentinel Safety Validator
- Fully isolated post-solve validation engine evaluating 100% of scheduled blocks against 7 physical invariants:
  1. Train headway and sectional occupancy clashes.
  2. Physical track-level simultaneous overlap.
  3. Heavy machinery routing conflicts and transit gap violations.
  4. Candidate window containment.
  5. Earliest start and latest deadline compliance.
  6. Multi-department bundle internal compatibility.
  7. Power block isolation consistency.
- Computes a tamper-evident **SHA-256 cryptographic verification fingerprint** for every validated plan.

### 8. Multi-Horizon Planning (Weekly & Monthly)
- **Weekly Tactical Block Planning**: 48-hour to 7-day high-resolution operational scheduling matching exact train headways.
- **Monthly Strategic Corridor Forecasting**: 30-day corridor-level macro-block forecasting based on cumulative GMT tonnage and degradation projections.

### 9. Dynamic Disruption & Event-Driven Re-planning
- Injects real-time train delay perturbations (e.g., Train #12834 +45m delay).
- Identifies collided maintenance blocks, preserves unaffected schedule slots, and re-optimizes affected tasks in $<0.1$ seconds.

### 10. Human Controller Override & Cryptographic Audit Trail
- Allows operational controllers to adjust block start/end times with instant conflict validation.
- Records all actions (`OPTIMIZE`, `OVERRIDE`, `DISRUPTION`, `RESET`) in an immutable SHA-256 chained audit log.

### 11. One-Click Canonical Demo Reset
- Provides idempotent environment recovery (`POST /api/v1/demo/reset`) that wipes test modifications, re-ingests canonical datasets, runs prioritization, solves the master schedule, and validates with Sentinel in $<2$ seconds.

---

## 📊 Empirical Optimization Benchmark (Synthetic Evaluation)

Comparative benchmark on canonical 48-hour synthetic operational window on the Bilaspur–Nagpur Corridor:

| Metric | Deterministic Greedy Baseline | RailSync CP-SAT Optimizer | Operational Benefit |
| :--- | :---: | :---: | :--- |
| **Tasks Scheduled** | 12 | 12 | 100% Maintenance Demand Met |
| **Active Track Blocks** | 12 (Isolated) | 5 (Bundled) | **58.3% Fewer Corridor Disruptions** |
| **Total Track Possession** | 35.5 Hours | 25.0 Hours | **10.5 Hours Saved (29.6% Reduction)** |
| **Multi-Dept Bundles** | 0 | 2 Cross-Department | Synchronized P-Way + S&T + TRD |
| **Solver Runtime** | 0.008s | 0.048s | Sub-second Exact Solution |
| **Sentinel Safety Status** | PASSED | PASSED | 0 Invariant Violations (SHA-256 Verified) |

---

## 🔬 Deterministic Stress Testing Scenarios

All 10 deterministic operational scenarios execute under in-memory isolation in [`backend/tests/test_scenario_stress.py`](backend/tests/test_scenario_stress.py):

| Scenario ID | Scenario Name | Core Condition Tested | Result |
| :--- | :--- | :--- | :---: |
| **SCN-01** | **Mega Block** | Multi-department high-density corridor bundling | **PASSED** |
| **SCN-02** | **Safety Escalation** | Critical rail fracture hard safety gate dominance | **PASSED** |
| **SCN-03** | **Freight Squeeze** | High-density freight traffic gap contraction | **PASSED** |
| **SCN-04** | **Machine Transit** | Multi-depot tamper transit buffers & conflict detection | **PASSED** |
| **SCN-05** | **Power Isolation** | 25kV OHE power block isolation synchronization | **PASSED** |
| **SCN-06** | **Train Disruption** | 45-minute passenger train delay targeted re-optimization | **PASSED** |
| **SCN-07** | **No Feasible Window** | Long-duration work with zero viable gaps diagnosed cleanly | **PASSED** |
| **SCN-08** | **Resource Scarcity** | Heavy machinery machine allocation constraints | **PASSED** |
| **SCN-09** | **Bundle Compatibility**| Departmental compatibility matrix verification | **PASSED** |
| **SCN-10** | **Horizon Boundary** | Boundary window edge cases without task drop | **PASSED** |

---

## 🛠️ Technology Stack

| Layer | Technology | Key Components / Libraries |
| :--- | :--- | :--- |
| **Backend REST API** | Python 3.12 | FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, SQLite |
| **Optimization Engine** | Python / C++ | Google OR-Tools CP-SAT (Constraint Programming) |
| **Predictive AI / ML** | Python | `scikit-learn` (HistGradientBoostingClassifier, StandardScaler), Joblib, NumPy |
| **Safety Validation** | Python | Sentinel Engine, Hashlib (SHA-256 Fingerprinting) |
| **Frontend UI** | TypeScript / React 19 | Vite, Tailwind CSS, Lucide React, Custom SVG Gantt & Topological Map |
| **Test Framework** | Python | Pytest, FastAPI TestClient, AnyIO (61 Automated Tests) |

---

## 📁 Repository Directory Structure

```
SIH26027/
├── backend/
│   ├── app/
│   │   ├── models/                 # SQLAlchemy DB models & saved model artifacts
│   │   │   └── saved_models/       # Canonical asset_failure_risk_v3.joblib & metadata.json
│   │   ├── pipeline/               # Ingestion, Feature Eng, ML, Prioritization, Solver, Validator
│   │   ├── routers/                # FastAPI Endpoints (Tasks, Schedules, Metrics, Opportunity, Demo)
│   │   ├── schemas/                # Pydantic Request/Response validation schemas
│   │   ├── services/               # Explanation, Opportunity, Audit, and Demo Reset services
│   │   └── main.py                 # Application root & CORS configuration
│   └── tests/                      # 61 Pytest automated tests across 14 modules
├── data/
│   ├── synthetic/                  # Canonical CSV datasets (Telemetry, Defects, Timetable, Assets)
│   └── railsync.db                 # Canonical SQLite database
├── dataset_generation/             # Longitudinal degradation & traffic simulator
├── frontend/
│   ├── src/
│   │   ├── components/             # React views, Gantt chart, OpportunityDrawer, AI panels
│   │   ├── services/               # REST API client
│   │   ├── types.ts                # TypeScript domain definitions
│   │   └── App.tsx                 # Master OCC Dashboard layout
│   ├── package.json
│   └── vite.config.ts
├── md/                             # Comprehensive 28-chapter engineering documentation
├── scripts/
│   ├── reset_demo.py               # CLI tool for one-command canonical database reset
│   └── run_demo_pipeline.py        # Master pipeline execution runner
└── README.md                       # Root Project Overview & SIH Verification
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Python 3.12+**
- **Node.js 18+ & npm**

### 1. Backend Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy ortools scikit-learn pydantic pytest httpx

# Start the FastAPI server (runs on http://127.0.0.1:8000)
py -3.12 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory and install dependencies
cd frontend
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## 🧪 Automated Testing & Verification

### Run Full Backend Test Suite (61 Automated Tests)
```bash
py -3.12 -m pytest backend/tests/ -v
```
*Expected: `61 passed in ~39s` (100% pass rate across AI rigor, optimization, Sentinel validation, stress scenarios, and reset idempotency).*

### Run Production Frontend Build
```bash
cd frontend && npm run build
```
*Expected: Clean production build with zero TypeScript or lint errors.*

### CLI Canonical Demo Reset
```bash
py -3.12 scripts/reset_demo.py
```

---

## 🎬 5-Minute SIH Demonstration Sequence

1. **RESET DEMO** (Top Header): Click *"Reset Demo"* → Confirm dialog. Canonical database and initial state are restored.
2. **CORRIDOR OVERVIEW**: Observe Corridor (*Bilaspur – Nagpur BSP-NGP*), Active Model (*HistGradientBoosting GBDT v3.0*), and initial 99.4% asset availability.
3. **MAINTENANCE QUEUE & AI ASSET RISK**:
   - Navigate to *"Maintenance"*. Click *"Prioritize Requests"* to compute safety-gated AI priority rankings.
   - Click on a high-risk work order (e.g., *Turnout 12A Packing*). Inspect the *"AI Explanation Panel"* to verify predicted synthetic failure risk ($P(\text{failure\_within\_14d})$) and Contributing Factor attributions.
4. **BLOCK PLAN & OPTIMIZATION**:
   - Navigate to *"Block Plan"*. Click *"Generate Optimized Plan"*.
   - Observe the CP-SAT engine scheduling synchronized multi-department bundled blocks on the interactive Gantt chart.
5. **OPPORTUNITY ENGINE ("Why this Window?")**:
   - Click *"Why this Window?"* on a scheduled block item.
   - Inspect the explainable 0–100 Opportunity Score, mathematical breakdown (+Risk Value, +Bundling Benefit, -Traffic Penalty), and candidate slot alternatives.
6. **INDEPENDENT SENTINEL VALIDATION**:
   - Click *"Validate Plan"*. Sentinel independently evaluates 100% of blocks against train timetables; displays **PASSED** verdict with cryptographic SHA-256 hash.
7. **PLANNING COMPARISON (BENCHMARK)**:
   - Click *"Planning Comparison"*. Side-by-side modal demonstrates CP-SAT track possession savings over the Greedy Baseline.
8. **DISRUPTION & RE-PLANNING**:
   - Navigate to *"Disruptions"*. Inject a 45-minute delay on Train #12834 (*Gitanjali Express*).
   - System flags the collided block. Click *"Re-plan Schedule"* to execute targeted slot re-optimization while preserving undisturbed blocks.
9. **AUDIT TRAIL & PUBLISH**:
   - Navigate to *"Audit Trail"* to view immutable cryptographic logs of all optimization, override, and disruption events.
   - Click *"Publish for Simulation"* to lock the plan.

---

## ⚠️ Scientific & Operational Disclaimer

*RailSync AI is an engineering decision-support prototype developed for Smart India Hackathon 2024 (Problem Statement SIH26027). All operational results, asset health metrics, failure probabilities, and optimization benchmarks were evaluated under deterministic synthetic simulation of the Bilaspur–Nagpur railway corridor. The system is not connected to live Indian Railways production operational networks (CRIS / COA / FOIS / TMS / SMMS / TDMS).*
