# 10_DATA_ANALYSIS_AND_PROCESSING.md — Data Analysis, Quality & Processing Pipeline

## SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways

---

## 1. Exploratory Data Analysis (EDA) Framework

The ingestion pipeline executes an automated Exploratory Data Analysis (EDA) pass over every synchronized dataset batch to detect distribution drift, missing values, and anomalies before tasks enter the optimization engine.

### Automated EDA Metric Suite:
1. **Departmental Task Mix:** Ratio of Engineering (`ENG`), Signaling (`SIG`), and Electrical (`TRD`) tasks.
2. **Defect Severity Distribution:** Proportion of `CRITICAL`, `MAJOR`, and `MINOR` tasks.
3. **Overdue Aging Analysis:** Histogram of $(t_{\text{current}} - t_{\text{due\_date}})$ in days across active tasks.
4. **Duration Histogram:** Distribution of required block durations ($15\text{ min}$ to $480\text{ min}$).
5. **Traffic Density Curve:** Hourly passenger and freight train occupancy per corridor segment.
6. **Corridor Utilization Factor:** Ratio of train movement hours to total available corridor capacity.
7. **Candidate Shadow-Block Availability:** Number and average duration of gaps $\ge 90\text{ min}$ per segment.
8. **Bundling Potential Index:** Fraction of tasks having $\ge 1$ compatible cross-departmental task within $5\text{ km}$.

---

## 2. The 12 Data Quality Validation Rules

Every raw record ingested into RailSync AI must pass through the automated **Data Quality Gate (`backend/app/ingestion/data_quality.py`)**.

| Rule ID | Validation Check | Failure Condition | System Action | Error Code | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DQ-001` | **Kilometer Chainage Bounds** | $\text{location\_km} < \text{segment.start\_km}$ or $> \text{segment.end\_km}$ | Reject record to quarantine | `ERR_INVALID_KM_CHAINAGE` | `HIGH` |
| `DQ-002` | **Timestamp Ordering** | $t_{\text{due\_date}} < t_{\text{reported\_at}}$ | Reject record to quarantine | `ERR_INVALID_TIMESTAMP_ORDER` | `HIGH` |
| `DQ-003` | **Duration Bounds** | $\text{duration\_minutes} \le 0$ or $> 720\text{ min}$ | Reject record to quarantine | `ERR_DURATION_OUT_OF_BOUNDS` | `HIGH` |
| `DQ-004` | **Department Code Validity** | $\text{dept} \notin \{\text{ENG}, \text{SIG}, \text{TRD}\}$ | Reject record to quarantine | `ERR_UNKNOWN_DEPARTMENT` | `HIGH` |
| `DQ-005` | **Severity Enum Validity** | $\text{severity} \notin \{\text{CRITICAL}, \text{MAJOR}, \text{MINOR}\}$ | Default to `MAJOR` with warning | `WARN_UNKNOWN_SEVERITY` | `MEDIUM` |
| `DQ-006` | **Orphan Asset Check** | `asset_id` not found in `assets` table | Quarantine record | `ERR_ORPHAN_ASSET_REFERENCE` | `HIGH` |
| `DQ-007` | **Corridor Segment Check** | `segment_id` not found in `segments` table | Quarantine record | `ERR_UNKNOWN_SEGMENT_ID` | `HIGH` |
| `DQ-008` | **Duplicate Task Detection** | Identical SHA-256 payload or `(source, record_id)` | Deduplicate; update sync timestamp | `INFO_DUPLICATE_RECORD` | `LOW` |
| `DQ-009` | **Train Movement Overlap** | Train entry $\ge$ train exit time | Reject timetable row | `ERR_TIMETABLE_TEMPORAL_GLITCH` | `HIGH` |
| `DQ-010` | **Missing Required Field** | Null value in non-nullable column | Reject record to quarantine | `ERR_MISSING_MANDATORY_FIELD` | `HIGH` |
| `DQ-011` | **Stale Task Detection** | Task reported $> 60\text{ days}$ ago without resolution | Flag for immediate review | `WARN_STALE_TASK_ESCALATION` | `MEDIUM` |
| `DQ-012` | **Resource Reference Check**| Required machine/crew code not in catalog | Flag for default crew assignment | `WARN_UNKNOWN_RESOURCE_CODE` | `MEDIUM` |

---

## 3. Data Processing & Cleansing Policies

```
+----------------------------------------------------------------------------------------------------+
|                                DATA PROCESSING CLASSIFICATION MATRIX                               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ 1. VALUES SAFE TO AUTOMATICALLY IMPUTE ]                                                        |
|  - Missing Machinery Type: Impute standard manual work gang for the department.                    |
|  - Missing Asset Installation Date: Impute median installation date for that asset category.       |
|  - Missing Freight Speed: Impute conservative average speed (45 km/h).                             |
|                                                                                                    |
|  [ 2. VALUES THAT MUST BE STRICTLY REJECTED (SAFETY CRITICAL) ]                                    |
|  - Missing or Invalid Kilometer Chainage / Segment ID (Cannot guess physical track location).       |
|  - Negative or Zero Maintenance Duration (Cannot allocate zero-time possession).                   |
|  - Invalid Train Timetable Entry/Exit Timestamps (Would risk catastrophic train collisions).        |
|  - Missing Electrical Isolation Flag on OHE High-Voltage Tasks (Would risk electrocution).         |
|                                                                                                    |
|  [ 3. VALUES FLAGGED FOR MANUAL CONTROLLER REVIEW ]                                                |
|  - Tasks overdue by > 30 days.                                                                     |
|  - Defect severity discrepancies between TMS description and severity category code.               |
|  - Candidate shadow blocks with net duration < 45 minutes.                                         |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Normalization Pipeline Steps

1. **Schema Parsing:** Read CSV/JSON via Pandas and Pydantic validator schemas.
2. **Timezone Standardization:** Convert all source timestamps to UTC internally; compute local Indian Standard Time (`UTC+05:30`) display strings.
3. **Spatial Projection:** Translate railway chainage markers (e.g. `Km 142/12`) to parent `segment_id` via spatial index range lookup.
4. **Category Normalization:** Map heterogeneous source strings (e.g. `"P-Way"`, `"Civil"`, `"ENG"`) to canonical enum `Department.ENG`.
5. **Deduplication Hashing:** Compute SHA-256 hash of `(source_system, source_record_id, defect_type, location_km)` to avoid duplicate task creation across repeated syncs.
6. **Data Quality Report Generation:** Compute Data Completeness Index ($DCI$) and Data Validity Index ($DVI$):

$$DCI = \frac{N_{\text{valid}} - N_{\text{missing\_fields}}}{N_{\text{total}}} \times 100\%, \quad DVI = \frac{N_{\text{valid\_records}}}{N_{\text{total\_records}}} \times 100\%$$
