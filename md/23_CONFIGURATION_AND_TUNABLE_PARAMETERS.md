# 23_CONFIGURATION_AND_TUNABLE_PARAMETERS.md — Centralized Configuration & Tunable Parameters

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Configuration Philosophy & Zero Magic Numbers

All operational parameters, safety buffers, ML thresholds, solver weights, and network dimensions in RailSync AI are defined in centralized, validated configuration modules (`backend/app/config.py` and `.env`) rather than scattered as hardcoded literals in source code.

---

## 2. Master Parameter Registry

| Parameter Name | Default Value | Data Type | Units / Range | Location / Env Var | Operational Impact Description |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `SETUP_BUFFER_MINUTES` | `15` | `int` | Minutes ($5 \dots 60$) | `CONFIG.SETUP_BUFFER_MINUTES` | Safety preparation buffer before work begins; prevents collision with preceding train. |
| `CLEARANCE_BUFFER_MINUTES` | `15` | `int` | Minutes ($5 \dots 60$) | `CONFIG.CLEARANCE_BUFFER_MINUTES`| Track clearing buffer after work ends; ensures track is clear before succeeding train. |
| `MIN_CANDIDATE_GAP_MINUTES` | `90` | `int` | Minutes ($30 \dots 240$)| `CONFIG.MIN_CANDIDATE_GAP_MINUTES`| Minimum net timetable gap required to qualify as an actionable candidate shadow block. |
| `MAX_BUNDLE_SPATIAL_KM` | `5.0` | `float` | Kilometers ($1.0 \dots 20.0$) | `CONFIG.MAX_BUNDLE_SPATIAL_KM` | Maximum spatial separation allowed between tasks bundled into a single block possession. |
| `MAX_TASKS_PER_BUNDLE` | `5` | `int` | Count ($2 \dots 10$) | `CONFIG.MAX_TASKS_PER_BUNDLE` | Maximum number of departmental tasks that can be safely supervised in one block. |
| `SOLVER_TIME_LIMIT_SEC` | `30` | `int` | Seconds ($5 \dots 300$) | `CONFIG.SOLVER_TIME_LIMIT_SEC` | Maximum CP-SAT search time before returning the best feasible solution found. |
| `SOLVER_NUM_THREADS` | `4` | `int` | CPU Cores ($1 \dots 16$) | `CONFIG.SOLVER_NUM_THREADS` | Multi-threading worker count for parallel deterministic search. |
| `WEIGHT_UNSCHEDULED_TASK` | `100.0`| `float`| Weight ($10.0 \dots 500.0$) | `CONFIG.WEIGHT_UNSCHEDULED_TASK` | Multiplier for $(1 - y_t) \cdot \mathcal{P}_t^2$; prioritizes completing high-urgency tasks. |
| `WEIGHT_ASSET_DOWNTIME` | `25.0` | `float` | Weight ($1.0 \dots 100.0$) | `CONFIG.WEIGHT_ASSET_DOWNTIME` | Penalty per block-minute weighted by corridor traffic density. |
| `BONUS_TASK_BUNDLING` | `40.0` | `float` | Reward ($0.0 \dots 200.0$) | `CONFIG.BONUS_TASK_BUNDLING` | Reward subtracted from objective for every additional task bundled into a possession. |
| `WEIGHT_FREIGHT_DISRUPTION`| `20.0` | `float` | Penalty ($1.0 \dots 100.0$) | `CONFIG.WEIGHT_FREIGHT_DISRUPTION` | Penalty incurred when candidate window intersects a probabilistic freight path. |
| `WEIGHT_OVERDUE_DELAY` | `35.0` | `float` | Penalty ($1.0 \dots 100.0$) | `CONFIG.WEIGHT_OVERDUE_DELAY` | Penalty per hour a task is scheduled past its mandatory compliance deadline. |
| `WEIGHT_SCHEDULE_STABILITY`| `15.0` | `float` | Penalty ($0.0 \dots 100.0$) | `CONFIG.WEIGHT_SCHEDULE_STABILITY`| Penalty for modifying previously approved schedule blocks during re-optimization. |
| `EMERGENCY_PRIORITY_THRESHOLD`| `90.0`| `float`| Score ($80.0 \dots 100.0$)| `CONFIG.EMERGENCY_PRIORITY_THRESHOLD`| Priority score at or above which tasks are classified as `EMERGENCY`. |
| `HIGH_PRIORITY_THRESHOLD` | `70.0` | `float` | Score ($50.0 \dots 89.9$)| `CONFIG.HIGH_PRIORITY_THRESHOLD` | Priority score threshold for `HIGH` tier classification. |
| `WEEKLY_HORIZON_DAYS` | `7` | `int` | Days ($3 \dots 14$) | `CONFIG.WEEKLY_HORIZON_DAYS` | Duration of the granular operational tactical schedule. |
| `MONTHLY_HORIZON_DAYS` | `30` | `int` | Days ($14 \dots 90$) | `CONFIG.MONTHLY_HORIZON_DAYS` | Duration of the strategic capacity forecast view. |
| `RANDOM_SEED` | `42` | `int` | Integer | `CONFIG.RANDOM_SEED` | Seed for synthetic dataset generator and model training reproducibility. |
| `DATABASE_URL` | `sqlite:///./railsync.db` | `str` | URI | `DATABASE_URL` env var | Relational database connection string (SQLite or PostgreSQL). |
| `JWT_SECRET_KEY` | `dev-secret-key-railsync-2026` | `str` | Secret Key | `JWT_SECRET_KEY` env var | Secret token for signing local authentication session tokens. |
