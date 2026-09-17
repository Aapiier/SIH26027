# 27_RUNBOOK.md — Developer, Operations & Evaluation Runbook

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. System Prerequisites

Before running RailSync AI locally:
- **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu 20.04+)
- **Python:** Version `3.10` or higher (`python --version`)
- **Node.js & npm:** Node `v18.0+` and npm `v9.0+` (`node --version`, `npm --version`)
- **Git:** Installed and available in PATH
- **Database:** SQLite (default zero-config local file `railsync.db`) or PostgreSQL 14+ (optional)

---

## 2. Quick Start: Local Deployment in 5 Steps

### Step 1: Environment Setup

```bash
# 1. Open Terminal in repository root
cd "c:\rofl\College Documents\Projects\SIH26027"

# 2. Create Python virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
# .\venv\Scripts\activate.bat
# Linux / macOS:
# source venv/bin/activate

# 4. Install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

### Step 2: Generate Deterministic Synthetic Dataset

```bash
# Generates 5 corridors, 40 segments, 1,500 defect tasks, and 250 train runs with seed=42
python ml_models/mock_data_gen.py
```

---

### Step 3: Train & Serialize AI Priority Model

```bash
# Trains XGBoost regressor and generates SHAP explainability artifacts
python ml_models/train_priority.py
```

---

### Step 4: Launch FastAPI Backend Server

```bash
# Start backend API on localhost:8000 with hot-reload
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API Root:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Alternative ReDoc UI:** `http://localhost:8000/redoc`

---

### Step 5: Launch React Control Dashboard

```bash
# Open a second terminal window
cd "c:\rofl\College Documents\Projects\SIH26027\frontend"

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```

- **Interactive Control Dashboard:** `http://localhost:5173`

---

## 3. Running Automated Tests & Verification

```bash
# 1. Run full Pytest suite with coverage report
pytest backend/tests/ -v --cov=backend/app --cov-report=term-missing

# 2. Run unit tests only
pytest backend/tests/unit/ -v

# 3. Run integration tests
pytest backend/tests/integration/ -v

# 4. Run property-based invariant tests
pytest backend/tests/property/ -v

# 5. Run scripted demo evaluation scenarios
pytest backend/tests/e2e/test_demo_scenarios.py -v
```

---

## 4. Resetting the Local Environment

To reset the database and re-generate a pristine demo environment:

```bash
# Delete local SQLite database
Remove-Item -Path "backend\railsync.db" -ErrorAction SilentlyContinue

# Re-run synthetic data generation
python ml_models/mock_data_gen.py

# Restart backend to initialize fresh schema tables
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 5. Troubleshooting & Common Issues

| Symptom | Probable Root Cause | Resolution Action |
| :--- | :--- | :--- |
| `ModuleNotFoundError: No module named 'app'` | Running uvicorn from root instead of `backend/` or missing `PYTHONPATH` | Run `cd backend` before starting `uvicorn app.main:app --reload` or set `$env:PYTHONPATH="backend"`. |
| `sqlite3.OperationalError: database is locked` | Concurrent write lock on SQLite | Restart backend process; or configure PostgreSQL connection in `.env`. |
| `FileNotFoundError: saved/priority_xgb_v1.json` | Model training script not executed | Run `python ml_models/train_priority.py` to create serialized model artifacts. |
| `CORS Error in Frontend Console` | Backend CORS origins missing `http://localhost:5173` | Verify `CORS_ORIGINS=["http://localhost:5173"]` in `backend/app/config.py`. |
| `Gantt Chart Not Rendering` | Zero scheduled blocks in database | Click "Sync External Data" followed by "Run Optimization Engine" on the dashboard. |
