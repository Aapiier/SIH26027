# 22_DEMO_SCENARIOS.md — Deterministic Demo Scenarios for Evaluation

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Demo Execution Principles

All 9 demo scenarios are engineered for **deterministic, instant, offline reproducibility** during the Smart India Hackathon jury evaluation.

- **Fixed Random Seed:** `seed=42` guarantees consistent scenario topology and numbers.
- **Duration:** The entire 9-scenario narrative can be demonstrated in **5 to 7 minutes**.
- **No Cloud Required:** Runs 100% locally on a single laptop (`localhost:5173` / `localhost:8000`).

---

## 2. The 9 Scripted Evaluation Scenarios

### Scenario 1: The Current Failure Mode — Uncoordinated Manual Requests
- **Domain Context:** Engineering, S&T, and TRD request separate maintenance blocks on the Delhi-Agra corridor near Palwal (Km 60–65).
- **User Action:** Click "View Legacy Uncoordinated BDMS Simulation" on the Command Dashboard.
- **System Display:** Shows 3 separate track shutdowns on consecutive days (Monday, Tuesday, Wednesday), causing 8 hours of cumulative train disruption and 3 freight train cancellations.
- **Narrative Value:** Visually demonstrates the core operational problem statement of SIH26027.

---

### Scenario 2: Intelligent Multi-Department Task Bundling
- **Domain Context:** RailSync AI synchronizes TMS, SMMS, and TDMS defects for the same Palwal sector.
- **User Action:** Click "Sync External Data" $\to$ Click "Run Optimization Engine".
- **System Display:**
  1. The Bundling Engine detects spatial proximity ($2.5\text{ km}$) and power isolation compatibility.
  2. The CP-SAT solver fits all 3 tasks concurrently into a single 3.5-hour night shadow block (`BLK-20260918-DEL-01`).
  3. Metric updates: Track closures reduced from 3 to 1; cumulative downtime reduced by $4.5\text{ hours}$.
- **Narrative Value:** Demonstrates the core AI bundling value proposition.

---

### Scenario 3: Critical Defect Priority Escalation & SHAP Explanation
- **Domain Context:** TMS reports an urgent ultrasonic rail fracture alert (USFD IMR defect `TMS-DEL-0941`).
- **User Action:** Navigate to the Task Queue $\to$ Click on Task `TMS-DEL-0941`.
- **System Display:**
  1. Priority badge flashes `98.0 / 100` (`EMERGENCY`).
  2. SHAP Waterfall breakdown highlights: Safety Rule Escalation (+50 pts), Asset Criticality (+22 pts), Heavy Traffic Corridor (+18 pts).
  3. The Gantt chart reveals the task is automatically allocated to the very first available candidate gap tonight (02:00 UTC).
- **Narrative Value:** Proves explainability and safety-first prioritization.

---

### Scenario 4: Train Conflict Avoidance & Safety Buffer Preservation
- **Domain Context:** A prospective maintenance window is evaluated during the morning peak traffic window.
- **User Action:** Hover over the candidate gap between 06:00 and 08:30 on Segment-04.
- **System Display:**
  1. The Candidate Window Engine displays a red warning: "Infeasible: Train #12002 (Bhopal Shatabdi Express) traverses segment at 06:15 UTC."
  2. Demonstrates the mandatory 15-minute setup and clearance safety buffers.
  3. The solver automatically selects the safe off-peak window at 11:30 UTC instead.
- **Narrative Value:** Proves mathematically certified passenger train safety.

---

### Scenario 5: Heavy Machinery & Crew Bottleneck Management
- **Domain Context:** Two departments demand the single available Tamping Machine #01 on different corridors during the same night shift.
- **User Action:** Inspect resource allocation view for Tamping Machine #01.
- **System Display:**
  1. CP-SAT enforces Hard Constraint #7 (Disjunctive Resource Non-Overlap).
  2. The higher-priority track geometry defect receives the machine; the lower-priority routine task is shifted to the subsequent shift.
- **Narrative Value:** Demonstrates constraint-based resource leveling.

---

### Scenario 6: Disruption Response & Targeted Localized Re-Optimization
- **Domain Context:** Live COA feed reports that Freight Train #BOXN-22 is delayed by 75 minutes, blocking an approved shadow block.
- **User Action:** Click "Simulate Disruption: Train Delay +75m" $\to$ Click "Execute Targeted Re-Optimization".
- **System Display:**
  1. The impacted block is dynamically flagged `STALE_NEEDS_REPLAN`.
  2. Unaffected approved blocks on all other corridors remain locked and stable.
  3. Localized replanner resolves a revised non-conflicting shadow block in $0.4\text{ seconds}$.
  4. Plan Diff modal highlights exact before/after changes requiring Chief Controller confirmation.
- **Narrative Value:** Shows real-time agility and schedule stability without mass disruption.

---

### Scenario 7: Infeasible Task Diagnostics & Remediation Advisor
- **Domain Context:** A heavy ballast cleaning task requires 300 continuous minutes on a saturated suburban corridor where the maximum train headway gap is 120 minutes.
- **User Action:** Navigate to "Conflicts & Exceptions" view.
- **System Display:**
  1. Task `TSK-BCM-008` is clearly flagged as `UNSCHEDULED`.
  2. Root-Cause Diagnostic: `DURATION_EXCEEDS_GAP (Requested: 300m, Max Available Gap: 120m)`.
  3. Actionable Remediation Suggestion: "Split task into two 150m phases or request special Sunday mega-block."
- **Narrative Value:** Highlights transparent infeasibility handling rather than silent failure.

---

### Scenario 8: Weekly Operational Plan & Possession Order Export
- **Domain Context:** The Chief Controller reviews the validated 7-day master schedule.
- **User Action:** Click "Chief Controller Approve" $\to$ Click "Export Operational CSV".
- **System Display:**
  1. Schedule transitions from `RECOMMENDED` $\to$ `APPROVED` $\to$ `PUBLISHED`.
  2. Generates formal downloadable CSV possession orders with sanitized strings and cryptographic SHA-256 audit seal.
- **Narrative Value:** Shows formal operational delivery for real-world deployment.

---

### Scenario 9: Monthly Strategic Capacity Forecast & Corridor Heatmap
- **Domain Context:** Division headquarters assesses 30-day maintenance backlog trends and resource pressure.
- **User Action:** Navigate to "Monthly Strategic Plan" view.
- **System Display:**
  1. Interactive 4-week corridor congestion heatmap.
  2. Projected Asset Availability curve rising from $90.1\% \to 95.8\%$ as the defect backlog is cleared.
  3. Resource deficit alert forecasting a 15% shortfall in OHE Tower Wagon capacity in Week 3.
- **Narrative Value:** Demonstrates multi-horizon executive intelligence.
