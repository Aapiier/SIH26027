# Block Demand Management System

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability

## 1. Problem Statement
**Background:** Maintenance for fixed infrastructure on Indian Railways (Engineering, Traction Distribution, and Signal & Telecommunication) is currently planned in decentralized silos. Each department requests maintenance downtime (blocks) manually via the Block Demand Management System (BDMS).

**The Challenge:** The Control Office attempts to fit these uncoordinated BDMS requests into the live train traffic managed by the Control Office Application (COA). This manual, disjointed process leads to inefficient block utilization, overlapping repair requests, and unnecessary asset downtime that severely impacts train operations.

## 2. Proposed Solution
This project builds an intelligent master scheduling system that effectively replaces the manual BDMS workflow. It automatically ingests defect and maintenance data from the departmental databases (TMS, SMMS, TDMS). An AI/ML engine ranks these tasks by urgency and criticality. Then, a constraint-programming optimizer cross-references the prioritized tasks with train timetables and corridor availability from the COA. 

Instead of processing uncoordinated requests, the system automatically bundles multi-departmental repairs into natural timetable gaps ("shadow blocks"), maximizing asset uptime and ensuring reliable, uninterrupted train operations.

## 3. Integrated Data Sources
The system operates on localized, simulated data representing the following core Indian Railways systems:
*   **TMS (Track Management System):** Pulls track geometry defects, rail wear, weld failures, and overdue machine tamping constraints.
*   **SMMS (Signalling Maintenance & Management System):** Pulls signal failures, point machine malfunctions, track circuit defects, and telecom cable maintenance.
*   **TDMS (Traction Distribution Management System):** Pulls overhead equipment (OHE) defects, insulator faults, substation faults, and power supply issues.
*   **COA (Control Office Application):** Provides the "free time" windows via active passenger Train Time Tables and goods train forecasts.

## 4. Key Features
*   **AI Task Prioritization:** Uses Machine Learning algorithms to dynamically score and rank maintenance requests based on defect severity, safety risk, and age.
*   **Optimized Block Scheduling:** Uses constraint-programming to bundle geographically adjacent tasks from different departments into a single time window, eliminating repeated track closures.
*   **Multi-Horizon Planning:** Generates actionable, high-granularity short-term (weekly) schedules and strategic long-term (monthly) forecasts.
*   **Interactive UI Dashboard:** Provides control officers with visual Gantt charts of scheduled blocks, asset availability metrics, and a manual override feature for emergencies.

## 5. System Architecture

```
[ EXTERNAL DATA SIMULATION ]
   ├── TMS (Track Data)       ─────┐
   ├── SMMS (Signal Data)     ─────┼──► [ Data Ingestion Pipeline ]
   ├── TDMS (Electrical Data) ─────┤
   └── COA (Timetables)       ─────┘
                                              │
                                              ▼
[ LOCAL UNIFIED STORAGE ]          [( Local Relational DB )]
                                     ▲                 ▲
                                     │                 │
[ AI & OPTIMIZATION ENGINE ]         ▼                 ▼
                          [ AI Prioritization ]   [ Scheduling Optimizer ]
                          (Scores & Ranks)        (Bundles & Allocates)
                                                       │
                                                       ▼
[ APPLICATION LAYER ]                        [ Local Backend API ]
                                                       │
                                                       ▼
                                          [ Interactive UI Dashboard ]
                                          (Gantt Charts & Overrides)
```

## 6. Technology Stack
*   **Frontend:** React.js, Tailwind CSS, Gantt Chart Libraries
*   **Backend:** Python, FastAPI 
*   **Database:** PostgreSQL (or local SQLite for development)
*   **AI & Optimization:** Scikit-Learn/XGBoost (Prioritization), Google OR-Tools (Scheduling constraints), Pandas/NumPy (Data Processing)

## 7. Local Installation & Setup
1. Clone the repository
```bash
git clone https://github.com/Aapiier/SIH26027.git
cd SIH26027
```

2. Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Initialize the local database & run migrations
```bash
alembic upgrade head 
```

5. Start the local backend server
```bash
uvicorn main:app --reload
```

6. Start the frontend application
```bash
cd frontend
npm install
npm start
```

## 8. Usage Instructions
1. Navigate to https://localhost:3000 to access the control dashboard.
2. Click "Sync External Data" to fetch the latest synthetic defects from the local TMS, SMMS, and TDMS mock repositories.
3. Click "Run Optimization Engine" to trigger the AI prioritization and schedule generation against the current COA timetable.
4. View the unified multi-department maintenance blocks on the interactive visual timeline.
