# RailSync AI: AI-Powered Automatic Block Planning System
## Smart India Hackathon 2024 — Problem Statement SIH26027

> **AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**  
> *Ministry of Railways / Indian Railways*

---

## 📖 Executive Summary

Indian Railways manages one of the largest and densest railway networks in the world, operating over 13,000 passenger trains and 9,000 freight trains daily across 68,000+ route kilometers. Maintaining track infrastructure, signalling systems, and overhead electrical equipment requires regular track possession windows (**"Maintenance Blocks"**). 

Currently, block planning is coordinated through manual inter-departmental negotiations. This often results in:
- **Fragmented Possessions**: Engineering (P-Way), Signalling (S&T), and Electrical (TRD) taking separate, uncoordinated blocks on the same section.
- **Lost Line Capacity**: Excess corridor downtime reducing commercial train throughput.
- **Reactive Emergency Repairs**: Late detection of track wear forcing emergency speed restrictions or unplanned block cancellations.

**RailSync AI** solves this challenge with an end-to-end decision-support platform combining **longitudinal asset failure prediction**, **two-tier safety-gated prioritization**, **conflict-free timetable shadow-window extraction**, **cross-department maintenance bundling**, **exact CP-SAT mathematical optimization**, and **independent safety validation**.

---

## 🌟 Key Features & Capabilities

1. **Two-Tier Safety-Gated Prioritization**:
   - **Tier 1 (Hard Safety Gate)**: Deterministic rules automatically elevate critical flaws (e.g., rail fractures, point detection failures) to priority `98.0 / 100.0`, ensuring safety is never compromised by ML predictions.
   - **Tier 2 (Predictive Risk ML v2)**: LightGBM gradient-boosted classifier predicting 14-day asset failure probability ($P_{\text{fail}}$) from 194-day longitudinal degradation histories with zero target leakage.

2. **Cross-Department Synchronized Bundling**:
   - Automatically bundles compatible P-Way track packing, S&T point machine overhauls, and TRD 25kV OHE catenary adjustments into unified track possessions.
   - In our evaluated 48-hour synthetic scenario, bundling saved **10.5 hours (29.6%) of track possession time**.

3. **Exact Mathematical Optimization (Google OR-Tools CP-SAT)**:
   - Formulates block allocation as a Constrained Optimization Problem guaranteeing:
     - Exact interval non-overlap on physical tracks.
     - $\ge 15$-minute safety headway buffers against train paths.
     - Disjunctive heavy machinery transit routing between distant depots.
     - 25kV traction power block isolation synchronization.

4. **Independent Sentinel Schedule Validator**:
   - An isolated post-solve validation engine verifying 7 deterministic safety invariants before any schedule can be published.
   - Computes a SHA-256 cryptographic fingerprint for auditability.

5. **Dynamic Disruption & Warm-Start Re-Optimization**:
   - Injects passenger/freight train delays (e.g., Vande Bharat +45m delay), detects impacted maintenance blocks, preserves unaffected schedules, and re-solves in $<0.05$ seconds.

6. **Tactical OCC Mission Control Dashboard**:
   - Interactive React 19 UI featuring real-time KPI pods, topological corridor map, central Gantt possession timeline, AI explanation drawers (with SHAP feature attribution), benchmark comparison modals, and tamper-evident audit logs.

---

## 🏛️ System Architecture

```
Historical Asset State (TMS / SMMS / TDMS)
                ↓
    Temporal Feature Engineering (12D Lags)
                ↓
    LightGBM Asset Failure Risk Predictor (v2.0)
                ↓
    Two-Tier Safety-Gated Prioritization Engine
                ↓
    Candidate Timetable Shadow-Window Extraction (>=15m Buffers)
                ↓
    Cross-Department Maintenance Bundling Matrix
                ↓
    Google OR-Tools CP-SAT Mathematical Optimizer
                ↓
    Independent Sentinel Schedule Validator (7 Safety Checks)
                ↓
    Plan Explanation & Cryptographic SHA-256 Audit Trail
                ↓
    Tactical Dispatch OCC React Dashboard
```

---

## 📊 Optimization Benchmark (Synthetic Evaluation)

Comparative benchmark on canonical 48-hour synthetic operational window (Delhi–Prayagraj Corridor):

| Performance Metric | Deterministic Greedy Baseline | RailSync CP-SAT Optimizer | Operational Impact |
| :--- | :---: | :---: | :--- |
| **Tasks Scheduled** | 12 | 12 | 100% Demand Met |
| **Active Possessions** | 12 (Isolated) | 5 (Bundled) | **58.3% Fewer Corridor Disruptions** |
| **Total Track Possession** | 35.5 Hours | 25.0 Hours | **10.5 Hours Saved (29.6% Reduction)** |
| **Solver Runtime** | 0.008s | 0.056s | Instantaneous Exact Constraint Solve |
| **Sentinel Status** | PASSED | PASSED | 0 Physical Invariant Violations |

---

## 🔬 10 Deterministic Stress Testing Scenarios

All 10 scenarios are automated in regression test fixtures (`backend/tests/test_scenario_stress.py`) and execute under complete in-memory database isolation (`sqlite:///:memory:`):

1. **SCN-01 Mega Block**: High-density corridor bundling (Engineering, S&T, TRD) saving 29.2h possession.
2. **SCN-02 Safety Escalation**: Hard safety gate escalation (score 98.0) protected from displacement.
3. **SCN-03 Freight Squeeze**: Dense freight traffic window contraction with 0 train/block collisions.
4. **SCN-04 Machine Transit**: Multi-depot machine movement buffers enforced; deliberate collision caught by validator.
5. **SCN-05 Power Block**: 25kV OHE isolation synchronized with track work without clash.
6. **SCN-06 Train Delay Disruption**: 45m train delay re-solved in 0.05s preserving unaffected blocks.
7. **SCN-07 No Feasible Window**: Long-duration tasks correctly diagnosed as infeasible (`MAX_GAP_INSUFFICIENT`).
8. **SCN-08 Resource Starvation**: Heavy machinery capacity strictly respected under resource scarcity.
9. **SCN-09 Bundle Compatibility**: Compatible tasks merged into unified blocks; incompatible tasks isolated.
10. **SCN-10 Horizon Boundary**: Boundary and edge-gap windows captured without silent task loss.

---

## 📂 Project Directory Structure

```
SIH26027/
├── backend/                        # FastAPI REST Backend
│   ├── app/
│   │   ├── models/                 # SQLAlchemy DB & Pydantic Schemas
│   │   ├── pipeline/               # Ingestion, ML, Prioritization, Solver, Validator
│   │   ├── routers/                # REST API Endpoints
│   │   ├── services/               # Explanation, Benchmark, Override Services
│   │   └── main.py                 # FastAPI Application Entrypoint
│   └── tests/                      # 29 Pytest Automated Tests
├── dataset_generation/             # Synthetic Railway Dataset Generators
│   ├── generators/                 # Topology, Assets, Trains, Timetable, Defects
│   └── validators/                 # Zero-Leakage & Data Quality Validators
├── frontend/                       # React 19 + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/             # Gantt, Map, AI Explanation, Modals, Audit
│   │   ├── services/               # REST API Client
│   │   └── App.tsx                 # Main Dashboard Application
├── data/
│   ├── synthetic/                  # Canonical CSV Datasets
│   └── railsync.db                 # Canonical SQLite Database
├── scripts/
│   ├── reset_demo.py               # One-Command Canonical Demo Reset
│   └── run_demo_pipeline.py        # Master End-to-End Pipeline CLI
├── DEMO_SCRIPT.md                  # 5-8 Minute Presentation Script
├── SIH_JUDGE_QA.md                 # 20 Technical Q&As for Evaluators
├── FINAL_SYSTEM_ARCHITECTURE.md    # Complete Engineering Architecture
├── FINAL_PROJECT_DOCUMENTATION.md  # Comprehensive Project Specification
├── SCENARIO_STRESS_TEST_REPORT.md  # Multi-Scenario Stress Test Report
└── STAGE5_SYSTEM_VALIDATION_REPORT.md # Stage 5 System Validation Report
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Python 3.12+**
- **Node.js 18+ & npm**

### 1. Backend Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy ortools lightgbm scikit-learn pydantic pytest

# Run the backend API server (runs on http://localhost:8000)
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

## 🛠️ Verification & Pipeline Commands

### Execute Master End-to-End Pipeline
```bash
py -3.12 scripts/run_demo_pipeline.py
```

### Reset to Clean Canonical Demo State
```bash
py -3.12 scripts/reset_demo.py
```

### Run Full Test Suite (29 Automated Tests)
```bash
py -3.12 -m pytest backend/tests/ -v
```

### Build Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## ⚠️ Scientific & Operational Disclaimer

*RailSync AI is an engineering decision-support prototype developed for Smart India Hackathon 2024 (Problem Statement SIH26027). All operational results, asset health metrics, and optimization benchmarks were evaluated under deterministic synthetic simulation of the Delhi–Prayagraj railway corridor. The system is not connected to live Indian Railways production networks (CRIS / COA / FOIS / TMS).*
