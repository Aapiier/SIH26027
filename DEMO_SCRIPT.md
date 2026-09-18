# RailSync AI — Live Demonstration Script
## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

> **Audience**: SIH Grand Finale Evaluators / Railway Domain Experts  
> **Duration**: 5 to 8 Minutes  
> **Interface**: Mission Tactical Control Center Dashboard (`http://localhost:5173`)  
> **Environment Note**: Evaluated on synthetic prototype datasets (Northern / North Central Railway NDLS–PRYJ corridor simulation).

---

## ⏱️ Demonstration Timeline Overview

```
[0:00 - 1:00] Step 1: System Overview & Corridor Topology
[1:00 - 2:15] Step 2: AI ML v2 Failure Risk & Tier-1 Hard Safety Gate
[2:15 - 3:45] Step 3: CP-SAT Optimization & Synchronized Multi-Department Bundling
[3:45 - 4:45] Step 4: Decision-Quality Optimization Benchmark (Greedy vs CP-SAT)
[4:45 - 5:45] Step 5: Independent Sentinel Schedule Validator & Safety Invariants
[5:45 - 7:00] Step 6: Dynamic Train Delay Disruption & Warm-Start Re-optimization
[7:00 - 8:00] Step 7: Cryptographic Audit Trail & Closing Value Summary
```

---

## Step 1: System Overview & Corridor Context (1:00)

### What to Show:
1. Open the dashboard at `http://localhost:5173`.
2. Point out the top **Header Bar**:
   - Corridor: `Northern / North Central (NDLS – PRYJ)`
   - Planning Horizon: `48 Hours (Simulated Operations)`
   - Active Plan Status: `ACTIVE` / `VALIDATED`
3. Point out the **2D Topological Corridor Map**:
   - 8 Major Junction Stations: `NDLS → ANVT → GZB → ALJN → TDL → ETW → CNB → PRYJ` (435 km).
   - Live section possession counts and station occupancy.

### What to Say:
> *"Respected Judges, Indian Railways operates over 13,000 passenger trains and 9,000 freight trains daily. Scheduling track maintenance blocks currently requires manual multi-department coordination across Engineering (P-Way), Signalling & Telecom (S&T), and Traction Distribution (TRD). Often, departments take fragmented, isolated possessions on the same section within days of each other, drastically reducing line capacity.*  
>  
> *RailSync AI automates this process through a unified pipeline: combining longitudinal predictive asset risk, deterministic safety rules, timetable shadow-window extraction, cross-department bundling, and mathematical CP-SAT constraint optimization."*

---

## Step 2: AI Predictive Risk & Tier-1 Hard Safety Gate (1:15)

### What to Show:
1. Navigate to the **Maintenance Demand Queue** (`TaskQueue`).
2. Filter by `Tier 1 Emergency`:
   - Point out `REQ-002` / `RAIL_FRACTURE_RISK` on `NDLS-GZB-UP-FAST`.
   - Score: **98.0 / 100.0** (Locked by Tier-1 Hard Safety Gate).
3. Filter by `Tier 2 Predictive`:
   - Click on an asset (e.g., `AST-005` or `AST-012`).
   - Open the **AI Explanation Drawer** (`AIExplanationPanel`).
   - Show:
     - Predicted Failure Risk: $P(\text{failure}_{14\text{d}})$.
     - Local Feature Attribution (SHAP Proxy): degradation trend, traffic load, weather, tonnage, inspection age.
     - Root-Cause Feasibility Diagnosis.

### What to Say:
> *"A key principle in railway operations is that AI must never downgrade safety. In RailSync AI, we employ a Two-Tier Safety-Gated Prioritization Engine:*  
>  
> *1. **Tier 1 (Hard Safety Gate)**: Deterministic rules immediately elevate critical flaws (like rail fractures or point detection failures) to a priority of 98.0, guaranteeing immediate scheduling.*  
> *2. **Tier 2 (Predictive Risk ML v2)**: For routine maintenance, a shallow LightGBM model trained on longitudinal asset degradation predicts the probability of failure within 14 days without target leakage, allowing controllers to proactively schedule maintenance before track degradation forces emergency speed restrictions."*

---

## Step 3: CP-SAT Optimization & Multi-Department Bundling (1:30)

### What to Show:
1. Scroll down to the **Interactive Central Gantt Possession Timeline**.
2. Point out:
   - Synchronized Multi-Department Bundles (e.g., `PLAN-...-BUNDLE-001`).
   - Multi-department badges: `[ENG]` `[S&T]` `[TRD]`.
3. Click on a bundled block to open the **Block Possession Inspector** (`BlockDetailModal`):
   - Show member tasks executing simultaneously under **one single track closure**.
   - Show **Possession Hours Saved** (e.g., 2.5 hours saved via synchronized bundling).
   - Show assigned heavy machinery (e.g., `BCM_01`, `CSM_01`, Tower Wagons).

### What to Say:
> *"Here is RailSync's core operational innovation: **Cross-Department Synchronized Bundling**.*  
>  
> *Instead of granting three separate 2-hour track closures to Engineering for tamping, S&T for point overhauls, and TRD for OHE catenary adjustment, RailSync identifies compatible spatial, temporal, and resource windows to execute all three tasks under a single unified possession. This drastically minimizes total track downtime while maintaining full physical separation between incompatible heavy machinery."*

---

## Step 4: Decision-Quality Optimization Benchmark (1:00)

### What to Show:
1. Click the **"Optimization Benchmark"** button in the header.
2. The **Benchmark Modal** opens with side-by-side comparison cards:
   - **Deterministic Greedy Baseline**: 35.5h modeled possession time (fragmented isolated blocks).
   - **RailSync CP-SAT Optimizer**: 25.0h modeled possession time (5 synchronized bundles).
   - **Empirical Savings**: **10.5 Hours (29.6% Reduction in Modeled Track Possession)**.
   - **Solver Runtime**: $\approx 0.05\text{s}$ (Fast exact constraint satisfaction).

### What to Say:
> *"To prove that our optimization provides tangible mathematical value, we benchmark CP-SAT against a deterministic Greedy Baseline representing traditional first-fit allocation.*  
>  
> *In our evaluated 48-hour synthetic scenario, both algorithms scheduled the same priority maintenance workload, but CP-SAT reduced total track possession from 35.5 hours down to 25.0 hours—a 29.6% reduction in corridor downtime achieved purely through intelligent bundling."*

---

## Step 5: Independent Sentinel Schedule Validator (1:00)

### What to Show:
1. Click the **"Sentinel Validator"** badge in the header.
2. The **Validator Modal** opens:
   - Verdict: **PASSED (0 Violations)**.
   - 7 Independent Integrity Verification Checks:
     1. Headway & Timetable Train Clearance ($\ge 15$ min safety buffer).
     2. Physical Track Interval Non-Overlap.
     3. Heavy Machinery Disjunctive Transit Separation.
     4. Crew Rest & Availability Constraints.
     5. 25kV OHE Traction Power Isolation Sync.
     6. Deadline & Horizon Compliance.
     7. Bundle Spatial & Departmental Compatibility.
   - Cryptographic SHA-256 Plan Fingerprint.

### What to Say:
> *"In safety-critical transportation, the optimizer cannot be trusted to grade its own homework. RailSync includes an **Independent Sentinel Validator** that executes after the solver.*  
>  
> *Sentinel re-evaluates the generated schedule against all physical safety invariants. If even one train headway conflict or machinery transit collision is detected, Sentinel flags the plan as FAILED and blocks publication."*

---

## Step 6: Dynamic Train Delay Disruption & Re-Optimization (1:15)

### What to Show:
1. Click the **"Simulate Disruption"** button in the header.
2. In the modal:
   - Select Train: `22436 (Vande Bharat Express)`.
   - Section: `NDLS-GZB`.
   - Delay: `+45 Minutes`.
3. Click **"Inject Delay & Re-Optimize"**:
   - The system detects the collision between the delayed train and maintenance window `BLK-001`.
   - The re-optimizer preserves unaffected approved blocks, re-queues the collided task, finds the next conflict-free shadow gap, and re-validates the updated schedule in **under 0.05 seconds**.
4. Show the updated Gantt and the new validated plan.

### What to Say:
> *"Real railway operations face constant dynamic disruptions. When Train 22436 is delayed by 45 minutes, RailSync detects the impending collision, locks all unaffected blocks, and warm-starts CP-SAT to reschedule only the impacted possession into the next conflict-free window within 50 milliseconds."*

---

## Step 7: Cryptographic Audit Trail & Closing (1:00)

### What to Show:
1. Scroll to the **Immutable Audit Trail** table at the bottom of the dashboard.
2. Point out:
   - Timestamped records of `DEMO_RESET`, `OPTIMIZATION_RUN`, `DISRUPTION_REOPTIMIZE`.
   - SHA-256 Hash chaining for tamper-evident compliance.

### What to Say:
> *"Every optimization run, controller override, and disruption re-solve is cryptographically recorded in our immutable audit trail for complete operational traceability.*  
>  
> *In summary, RailSync AI delivers an end-to-end, mathematically validated decision-support tool that increases corridor track availability, safeguards maintenance crews, and maximizes train throughput on high-density corridors. Thank you, and we are now ready for your questions."*
