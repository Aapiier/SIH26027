# 24_ASSUMPTIONS_LIMITATIONS_AND_NON_GOALS.md — Assumptions, Limitations & Non-Goals

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. System Assumptions

1. **Synthetic Data Realism:** All defect logs, asset registries, passenger timetables, and freight forecasts are produced by a deterministic synthetic generator (`seed=42`) modeled after Indian Railways operating topologies.
2. **Standard Double-Line Corridor Dynamics:** Corridors operate with bidirectional directional separation (Up Line and Down Line) with predefined block section boundaries.
3. **Discrete Linear Kilometer Chainage:** Assets and defects are mapped onto continuous 1D kilometer chainage along defined corridor corridors.
4. **Human Final Authority:** Section Controllers and Chief Controllers maintain legal operational responsibility for approving and publishing all possession blocks.
5. **Air-Gapped Local Environment:** The system assumes deployment on local workstations or divisional server nodes without requiring public internet access.

---

## 2. Technical & Operational Limitations

1. **Simulated Source Interfaces:** No live direct network connections to production CRIS enterprise databases are established in this hackathon prototype.
2. **Simplified Freight Path Dynamics:** Freight paths are modeled as forecast time-windows with velocity curves rather than real-time dynamic train tracking (FOIS).
3. **No Automatic Ground Crew Dispatch:** Crew rosters and machinery availability are modeled as finite capacity calendars rather than real-time GPS-tracked personnel.
4. **Synthetic ML Evaluation:** Machine learning metrics measure accuracy against the synthetic scenario generator and are not proof of real-world railway failure prediction.

---

## 3. Explicit Non-Goals (What RailSync AI Does NOT Do)

```
+----------------------------------------------------------------------------------------------------+
|                                    EXPLICIT SYSTEM NON-GOALS                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  1. NOT an Autonomous Traffic Control System:                                                      |
|     RailSync AI does NOT autonomously set signals, throw point machines, or route live trains.    |
|                                                                                                    |
|  2. NOT an Automatic Line Possession Authorization:                                                |
|     The system produces recommended plans. Actual physical track possession authority must be     |
|     granted through standard Indian Railways General & Subsidiary Rules (G&SR) protocols.          |
|                                                                                                    |
|  3. NOT a Replacement for Safety Officers or Controllers:                                         |
|     The system enhances human decision-making and eliminates manual calculation bottlenecks,       |
|     keeping human controllers in command.                                                          |
|                                                                                                    |
|  4. NOT a Certified Signaling Interlocking Logic Emulator:                                        |
|     Signaling interlocks are governed by strict safety equipment (Solid State Interlocking);       |
|     RailSync AI plans maintenance windows around those operational constraints.                    |
|                                                                                                    |
|  5. NOT an Enterprise Supply Chain Procurement Tool:                                               |
|     Spare parts ordering and inventory tracking are out of scope.                                  |
+----------------------------------------------------------------------------------------------------+
```
