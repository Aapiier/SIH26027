"""
RailSync AI — Longitudinal Synthetic Asset History & ML Sample Generator
Simulates 194 days of continuous physical degradation, inspections, maintenance interventions,
and stochastic failure events across 174 network assets without target proxy leakage.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import random
import math
import json


def simulate_longitudinal_asset_history(
    assets: List[Dict[str, Any]],
    simulation_days: int = 194,
    start_date_str: str = "2026-03-21",
    rng: random.Random = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Simulate longitudinal lifecycle history.
    Returns:
      (telemetry_records, inspections, interventions, defect_events, ml_samples)
    """
    if rng is None:
        rng = random.Random(42)

    start_date = datetime.fromisoformat(start_date_str)

    telemetry_records = []
    inspections = []
    interventions = []
    defect_events = []
    ml_samples = []

    telemetry_id_counter = 500001
    inspection_id_counter = 600001
    intervention_id_counter = 700001
    event_id_counter = 800001
    sample_id_counter = 900001

    # Initialize asset physical state trackers
    asset_states = {}
    for ast in assets:
        category = ast.get("category", "TRACK")
        # Base initial condition with physical variety
        initial_health = round(rng.uniform(78.0, 98.0), 1)
        
        if category == "TRACK":
            initial_wear = round((100.0 - initial_health) / 100.0 * 8.0, 2)  # 0 to 8 mm
        elif category == "POINT_MACHINE":
            initial_wear = round(2.0 + (100.0 - initial_health) / 100.0 * 2.0, 2)  # 2.0 to 4.0 s throw time
        elif category == "OHE":
            initial_wear = round((100.0 - initial_health) * 0.7, 1)  # 0 to 70% wear
        else: # SIGNAL
            initial_wear = round((100.0 - initial_health) / 100.0 * 5.0, 1)

        asset_states[ast["asset_id"]] = {
            "asset": ast,
            "category": category,
            "current_health": initial_health,
            "current_wear": initial_wear,
            "days_since_inspection": rng.randint(2, 20),
            "days_since_maintenance": rng.randint(5, 40),
            "deferred_count": 0,
            "past_defects_90d": [],
            "past_failures_90d": [],
            "speed_restriction_active": False,
            "age_years": round(rng.uniform(3.0, 25.0), 1),
            "criticality": float(ast.get("criticality_weight", 3.0)),
        }

    # Pre-generate daily weather patterns across corridor (seasonal variation)
    daily_weather = []
    for d in range(simulation_days):
        day_date = start_date + timedelta(days=d)
        # Seasonal temp cycle (summer peak in May/June, monsoon rain in July/August)
        month = day_date.month
        base_temp = 32.0 + 8.0 * math.sin((d / 180.0) * math.pi) + rng.uniform(-3.0, 3.0)
        is_monsoon = (month in (7, 8))
        rain_prob = 0.45 if is_monsoon else 0.08
        rainfall = round(rng.uniform(15.0, 85.0), 1) if rng.random() < rain_prob else 0.0
        thermal_shock = max(0.0, base_temp - 40.0) + (rainfall / 30.0)
        daily_weather.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "temp_c": round(base_temp, 1),
            "rainfall_mm": rainfall,
            "stress_index": round(thermal_shock, 2)
        })

    # Day-by-day continuous simulation
    for d in range(simulation_days):
        current_dt = start_date + timedelta(days=d)
        current_date_str = current_dt.strftime("%Y-%m-%d")
        w_info = daily_weather[d]

        for ast_id, state in asset_states.items():
            ast = state["asset"]
            category = state["category"]

            # 1. Operational Traffic Exposure
            traffic_gmt = round(rng.uniform(25.0, 65.0), 1)  # Daily Gross Million Tonnage proxy

            # 2. Continuous Degradation
            degradation_rate = 0.08 * (traffic_gmt / 45.0) * (1.0 + 0.02 * state["age_years"])
            if w_info["stress_index"] > 1.0:
                degradation_rate *= (1.0 + 0.25 * w_info["stress_index"])
            if state["deferred_count"] > 0:
                degradation_rate *= (1.0 + 0.15 * min(4, state["deferred_count"]))

            # Physical wear accumulation
            if category == "TRACK":
                state["current_wear"] = round(min(15.0, state["current_wear"] + degradation_rate * 0.06 + rng.uniform(0.0, 0.02)), 2)
                state["current_health"] = max(10.0, round(100.0 - (state["current_wear"] / 15.0) * 85.0 - rng.uniform(0.0, 1.0), 1))
            elif category == "POINT_MACHINE":
                state["current_wear"] = round(min(6.0, state["current_wear"] + degradation_rate * 0.02 + rng.uniform(0.0, 0.01)), 2)
                state["current_health"] = max(10.0, round(100.0 - ((state["current_wear"] - 2.0) / 4.0) * 85.0, 1))
            elif category == "OHE":
                state["current_wear"] = round(min(100.0, state["current_wear"] + degradation_rate * 0.45 + rng.uniform(0.0, 0.1)), 1)
                state["current_health"] = max(10.0, round(100.0 - state["current_wear"] * 0.85, 1))
            else: # SIGNAL
                state["current_wear"] = round(min(10.0, state["current_wear"] + degradation_rate * 0.04), 2)
                state["current_health"] = max(10.0, round(100.0 - (state["current_wear"] / 10.0) * 85.0, 1))

            state["days_since_inspection"] += 1
            state["days_since_maintenance"] += 1

            # 3. Periodic Inspections
            is_inspection_day = (state["days_since_inspection"] >= rng.randint(25, 45))
            if is_inspection_day:
                insp_score = round(state["current_health"] + rng.uniform(-2.0, 2.0), 1)
                detected_flaws = 1 if state["current_health"] < 65.0 else (2 if state["current_health"] < 45.0 else 0)
                inspections.append({
                    "inspection_id": f"INSP-{inspection_id_counter}",
                    "asset_id": ast_id,
                    "date": current_date_str,
                    "day_index": d + 1,
                    "inspection_type": "USFD_ULTRASONIC" if category == "TRACK" else ("TOWER_WAGON" if category == "OHE" else "POINT_GEAR_TEST"),
                    "measured_health": insp_score,
                    "detected_flaws": detected_flaws,
                })
                inspection_id_counter += 1
                state["days_since_inspection"] = 0

            # 4. Maintenance Interventions
            # Trigger preventive maintenance if health drops below 70 or periodically
            needs_maint = (state["current_health"] < 65.0 or state["days_since_maintenance"] >= rng.randint(55, 80))
            if needs_maint:
                # 85% chance executed, 15% chance deferred due to corridor congestion
                if rng.random() < 0.85:
                    interventions.append({
                        "intervention_id": f"INTV-{intervention_id_counter}",
                        "asset_id": ast_id,
                        "date": current_date_str,
                        "day_index": d + 1,
                        "intervention_type": "PREVENTIVE_TAMPING_OVERHAUL" if category == "TRACK" else "CORRECTIVE_ADJUSTMENT",
                        "health_before": state["current_health"],
                        "health_restored": round(min(98.0, state["current_health"] + rng.uniform(22.0, 35.0)), 1),
                    })
                    intervention_id_counter += 1
                    # Restore physical state
                    state["current_health"] = min(98.0, round(state["current_health"] + rng.uniform(22.0, 35.0), 1))
                    if category == "TRACK":
                        state["current_wear"] = max(0.5, round(state["current_wear"] * 0.4, 2))
                    elif category == "POINT_MACHINE":
                        state["current_wear"] = max(2.1, round(state["current_wear"] * 0.6, 2))
                    elif category == "OHE":
                        state["current_wear"] = max(5.0, round(state["current_wear"] * 0.5, 1))
                    state["days_since_maintenance"] = 0
                    state["deferred_count"] = 0
                    state["speed_restriction_active"] = False
                else:
                    state["deferred_count"] += 1

            # 5. Stochastic Failure / Defect Hazard Engine
            # Hazard increases non-linearly as health drops, inspection lapses, or maintenance is deferred
            base_hazard = 0.012
            health_penalty = max(0.0, (80.0 - state["current_health"]) / 30.0) ** 1.7
            insp_penalty = max(0.0, (state["days_since_inspection"] - 20) / 20.0) * 0.015
            defer_penalty = state["deferred_count"] * 0.040
            hazard_prob = min(0.40, base_hazard + health_penalty * 0.15 + insp_penalty + defer_penalty)

            if rng.random() < hazard_prob:
                is_emergency_failure = (
                    state["current_health"] < 58.0 or 
                    state["current_wear"] > 7.5 or 
                    (state["deferred_count"] >= 1 and rng.random() < 0.45) or
                    rng.random() < 0.20
                )
                sev = "EMERGENCY" if is_emergency_failure else ("CRITICAL" if state["current_health"] < 68.0 else "URGENT")
                
                defect_events.append({
                    "event_id": f"EVT-{event_id_counter}",
                    "asset_id": ast_id,
                    "date": current_date_str,
                    "day_index": d + 1,
                    "category": category,
                    "severity": sev,
                    "is_functional_failure": is_emergency_failure,
                    "health_at_event": state["current_health"],
                })
                event_id_counter += 1

                if is_emergency_failure:
                    state["past_failures_90d"].append(d + 1)
                    state["speed_restriction_active"] = True
                else:
                    state["past_defects_90d"].append(d + 1)

            # Record Daily Telemetry Snapshot
            telemetry_records.append({
                "telemetry_id": f"TEL-{telemetry_id_counter}",
                "asset_id": ast_id,
                "date": current_date_str,
                "day_index": d + 1,
                "health_index": round(state["current_health"], 1),
                "wear_metric": round(state["current_wear"], 2),
                "daily_gmt": traffic_gmt,
                "temp_c": w_info["temp_c"],
                "rainfall_mm": w_info["rainfall_mm"],
                "days_since_inspection": state["days_since_inspection"],
                "days_since_maintenance": state["days_since_maintenance"],
                "deferred_count": state["deferred_count"],
                "speed_restriction_active": 1 if state["speed_restriction_active"] else 0,
            })
            telemetry_id_counter += 1

    # -------------------------------------------------------------------------
    # 6. Extract ML Training Samples with Strict Zero-Leakage Forward Labels
    # -------------------------------------------------------------------------
    # Observation days: Day 15 to Day 180 (sampled every 3 days)
    # Forward label window: [T+1, T+14] (fully observable up to Day 194)
    # Build fast lookup of failure events by asset and day
    failures_by_asset = {}
    for ev in defect_events:
        if ev["is_functional_failure"] or ev["severity"] in ("EMERGENCY", "CRITICAL"):
            failures_by_asset.setdefault(ev["asset_id"], []).append(ev["day_index"])

    # Build telemetry lookup by (asset_id, day_index)
    tel_by_asset_day = {(r["asset_id"], r["day_index"]): r for r in telemetry_records}

    for d in range(15, 181, 3):
        obs_date_str = (start_date + timedelta(days=d - 1)).strftime("%Y-%m-%d")

        # Assign chronological split tags
        if d <= 120:
            split_tag = "TRAIN"
        elif d <= 150:
            split_tag = "VAL"
        else:
            split_tag = "TEST"

        for ast in assets:
            ast_id = ast["asset_id"]
            current_tel = tel_by_asset_day.get((ast_id, d))
            if not current_tel:
                continue

            tel_14d_ago = tel_by_asset_day.get((ast_id, max(1, d - 14)))
            tel_30d_ago = tel_by_asset_day.get((ast_id, max(1, d - 30)))

            h_curr = current_tel["health_index"]
            h_14 = tel_14d_ago["health_index"] if tel_14d_ago else h_curr
            h_30 = tel_30d_ago["health_index"] if tel_30d_ago else h_curr

            vel_14d = round((h_curr - h_14) / 14.0, 3)
            vel_30d = round((h_curr - h_30) / 30.0, 3)

            # Cumulative GMT past 30 days
            gmt_30d = sum(
                tel_by_asset_day.get((ast_id, max(1, d - i)), {}).get("daily_gmt", 40.0)
                for i in range(30)
            )

            # Environmental stress past 7 days
            env_stress_7d = sum(
                daily_weather[max(0, d - 1 - i)]["stress_index"] for i in range(7)
            ) / 7.0

            # Count past defects strictly < d (lookback 90 days)
            past_def_count = sum(
                1 for ev in defect_events 
                if ev["asset_id"] == ast_id and (d - 90 <= ev["day_index"] <= d)
            )

            # Future Label: check failures occurring strictly in [d + 1, d + 14]
            future_failures = [
                f_day for f_day in failures_by_asset.get(ast_id, [])
                if (d + 1) <= f_day <= (d + 14)
            ]
            has_failure_within_14d = 1 if len(future_failures) > 0 else 0
            days_to_next = (min(future_failures) - d) if future_failures else 999

            ml_samples.append({
                "sample_id": f"SAMP-{sample_id_counter}",
                "asset_id": ast_id,
                "observation_date": obs_date_str,
                "observation_day": d,
                "split_tag": split_tag,
                "current_health_index": round(h_curr, 1),
                "health_degradation_velocity_14d": vel_14d,
                "health_degradation_velocity_30d": vel_30d,
                "cumulative_gmt_tonnage_30d": round(gmt_30d, 1),
                "days_since_last_inspection": current_tel["days_since_inspection"],
                "days_since_last_maintenance": current_tel["days_since_maintenance"],
                "past_defects_count_90d": past_def_count,
                "deferred_maintenance_count": current_tel["deferred_count"],
                "environmental_stress_index_7d": round(env_stress_7d, 2),
                "asset_age_years": asset_states[ast_id]["age_years"],
                "asset_criticality": asset_states[ast_id]["criticality"],
                "speed_restriction_active": current_tel["speed_restriction_active"],
                "failure_within_14d": has_failure_within_14d,
                "days_to_next_failure": days_to_next,
            })
            sample_id_counter += 1

    return telemetry_records, inspections, interventions, defect_events, ml_samples
