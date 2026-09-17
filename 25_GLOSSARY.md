# 25_GLOSSARY.md — Domain & Technical Glossary

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Railway Operations Domain Glossary

| Term | Domain | Definition | Tag |
| :--- | :--- | :--- | :--- |
| **Asset** | Infrastructure | A physical component of railway infrastructure (e.g. track panel, point motor, signal post, OHE mast) tracked for maintenance. | `[SOURCE-BACKED]` |
| **Asset Availability** | Performance | The percentage of total potential operating hours that an infrastructure asset is available for normal train traffic. | `[SOURCE-BACKED]` |
| **BDMS** | Software | Block Demand Management System: The legacy Indian Railways system where departments manually requisition track downtime. | `[SOURCE-BACKED]` |
| **Block (Possession)** | Operations | An authorized period during which train traffic is suspended on a specific track segment to allow maintenance work. | `[SOURCE-BACKED]` |
| **Block Section** | Topology | The running track portion between two consecutive block stations or automatic stop signals. | `[SOURCE-BACKED]` |
| **Candidate Window** | Scheduling | A validated time interval between train movements that satisfies minimum duration and safety buffer criteria. | `[SOURCE-BACKED]` |
| **Caution Order** | Operations | A formal notice instructing train drivers to restrict speed over a specific damaged or recently repaired track section. | `[SOURCE-BACKED]` |
| **Chainage (Kilometer Post)**| Topology | Continuous longitudinal distance measured in kilometers along a railway corridor (e.g. Km 142/10). | `[SOURCE-BACKED]` |
| **Chief Controller** | Personnel | Senior officer in the Divisional Control Office responsible for overall train punctuality and master block authorization. | `[SOURCE-BACKED]` |
| **Clearance Buffer ($T_{\text{clear}}$)**| Safety | Mandatory time buffer (e.g. 15 min) after maintenance ends before the next train enters, ensuring track is vacated. | `[SOURCE-BACKED]` |
| **COA** | Software | Control Office Application: Real-time computer system used by Indian Railways section controllers to track train runs. | `[SOURCE-BACKED]` |
| **Corridor** | Topology | A major railway route connecting key junction stations (e.g. Delhi-Agra Trunk Corridor). | `[SOURCE-BACKED]` |
| **CP-SAT** | Optimization | Google OR-Tools Constraint Programming - Satisfiability solver used for exact discrete optimization. | `[SOURCE-BACKED]` |
| **Deep Screening** | Civil Eng | Heavy track maintenance process of cleaning and filtering the ballast bed using Ballast Cleaning Machines (BCM). | `[SOURCE-BACKED]` |
| **Defect** | Maintenance | An observed structural or electrical anomaly requiring preventive or corrective intervention. | `[SOURCE-BACKED]` |
| **Disruption Penalty** | Scheduling | A mathematical penalty incurred when a proposed maintenance block threatens to delay passenger or freight train paths. | `[ENGINEERING ASSUMPTION]` |
| **Down Line** | Operations | Standard designation for the track running in the direction away from the railway zonal headquarters or origin station. | `[SOURCE-BACKED]` |
| **Downtime** | Performance | The total duration during which a track segment is closed to normal train operations for maintenance possessions. | `[SOURCE-BACKED]` |
| **Dynamic Priority** | AI/ML | A multi-factor urgency score calculated by AI that escalates dynamically as a maintenance task approaches or exceeds its deadline. | `[SOURCE-BACKED]` |
| **Freight Path Forecast** | Operations | Estimated time windows and paths for un-timetabled goods trains based on industrial freight loading demand. | `[SOURCE-BACKED]` |
| **Headway** | Operations | The minimum time or distance interval legally separating two successive trains running in the same direction on the same track. | `[SOURCE-BACKED]` |
| **Infeasibility** | Optimization | A condition where a set of tasks cannot be scheduled without violating at least one mandatory hard safety constraint. | `[ENGINEERING ASSUMPTION]` |
| **Mega Block** | Operations | An extended multi-hour track possession (typically 6 to 12 hours on Sundays) for major infrastructure overhauls. | `[SOURCE-BACKED]` |
| **Multi-Horizon Planning** | Architecture | Simultaneous generation of short-term (7-day) tactical schedules and long-term (30-day) strategic capacity forecasts. | `[SOURCE-BACKED]` |
| **OHE (Overhead Equipment)**| Electrical | The 25kV AC overhead catenary and contact wire system supplying traction power to electric locomotives. | `[SOURCE-BACKED]` |
| **Point Machine** | Signaling | An electro-mechanical motor that moves track switch rails to divert trains from one track to another. | `[SOURCE-BACKED]` |
| **Power Isolation (Cutoff)**| Safety | Formal de-energization and earthing of the 25kV OHE power supply to permit safe maintenance near catenary wires. | `[SOURCE-BACKED]` |
| **P-Way (Permanent Way)** | Civil Eng | The railway track infrastructure, comprising rails, sleepers, fasteners, ballast bed, and underlying formation. | `[SOURCE-BACKED]` |
| **Section Controller** | Personnel | Officer in the Control Office actively regulating train movements and real-time block possessions on a specific rail section. | `[SOURCE-BACKED]` |
| **Segment** | Topology | An indivisible sub-block section of a corridor bounded by block stations or automatic signals. | `[ENGINEERING ASSUMPTION]` |
| **Setup Buffer ($T_{\text{setup}}$)** | Safety | Mandatory time buffer (e.g. 15 min) after the preceding train exits before maintenance begins, ensuring possession safety. | `[SOURCE-BACKED]` |
| **Shadow Block** | Scheduling | A candidate period of naturally available corridor capacity identified from timetable/traffic gaps; not an auto authorization. | `[SOURCE-BACKED]` |
| **SHAP** | AI/ML | SHapley Additive exPlanations: Game-theoretic technique used to explain individual machine learning feature contributions. | `[SOURCE-BACKED]` |
| **SMMS** | Software | Signalling Maintenance & Management System: Indian Railways database for S&T gear failures and inspections. | `[SOURCE-BACKED]` |
| **Tamping** | Civil Eng | Mechanized compaction of track ballast beneath sleepers to restore precise vertical and lateral track alignment. | `[SOURCE-BACKED]` |
| **Task Bundling** | Scheduling | The simultaneous execution of multiple maintenance tasks from different departments within a single unified block window. | `[SOURCE-BACKED]` |
| **TDMS** | Software | Traction Distribution Management System: Indian Railways database for OHE electrical maintenance and defects. | `[SOURCE-BACKED]` |
| **TMS** | Software | Track Management System: Indian Railways web-based database for civil engineering track assets and inspection logs. | `[SOURCE-BACKED]` |
| **Tower Wagon** | Machinery | Self-propelled maintenance vehicle equipped with an elevating platform used for OHE catenary inspection and repair. | `[SOURCE-BACKED]` |
| **Track Circuit** | Signaling | Electrical circuit in rails that detects train presence and controls automatic block signaling aspects. | `[SOURCE-BACKED]` |
| **Up Line** | Operations | Standard designation for the track running towards the railway zonal headquarters or primary origin terminal. | `[SOURCE-BACKED]` |
| **USFD (Ultrasonic Testing)**| Safety | High-frequency sound wave inspection technique used to detect internal micro-fractures in rails and welds. | `[SOURCE-BACKED]` |
| **Weld Renewal** | Civil Eng | Cutting out a fatigued rail joint and executing an alumino-thermic or flash-butt weld to restore continuous rail integrity. | `[SOURCE-BACKED]` |
