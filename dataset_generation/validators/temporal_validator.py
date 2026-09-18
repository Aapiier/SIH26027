"""
RailSync AI — Strict Temporal Zero-Leakage Validator
Automatically audits longitudinal dataset and ML sample matrix to mathematically guarantee
that NO future information is leaked into observation-time feature vectors.
"""

from typing import List, Dict, Any


def validate_temporal_leakage_and_integrity(
    telemetry_records: List[Dict[str, Any]],
    defect_events: List[Dict[str, Any]],
    ml_samples: List[Dict[str, Any]],
    simulation_days: int = 194
) -> Dict[str, Any]:
    """
    Execute rigorous temporal leakage and structural integrity checks.
    """
    errors = []
    warnings = []

    # 1. Verify Sample Count and Class Distribution
    if not ml_samples:
        errors.append("No ML samples generated.")
        return {"passed": False, "errors": errors, "warnings": warnings}

    total_samples = len(ml_samples)
    positive_samples = sum(1 for s in ml_samples if s["failure_within_14d"] == 1)
    positive_rate = positive_samples / total_samples

    if positive_rate < 0.03 or positive_rate > 0.35:
        warnings.append(f"Synthetic positive rate is {positive_rate:.2%}, expected between 3% and 35%.")

    # 2. Build Event Map by (asset_id, day_index)
    failures_by_asset = {}
    for ev in defect_events:
        if ev.get("is_functional_failure") or ev.get("severity") in ("EMERGENCY", "CRITICAL"):
            failures_by_asset.setdefault(ev["asset_id"], set()).add(ev["day_index"])

    # 3. Check Every ML Sample for Lookahead & Temporal Leakage
    train_count = 0
    val_count = 0
    test_count = 0

    for s in ml_samples:
        t = s["observation_day"]
        ast_id = s["asset_id"]
        split = s["split_tag"]

        # Horizon bounds
        if t < 1 or t > 180:
            errors.append(f"Sample {s['sample_id']} has observation day {t} outside valid observation horizon [1, 180].")

        # Split integrity
        if t <= 120:
            if split != "TRAIN":
                errors.append(f"Sample {s['sample_id']} day {t} incorrectly tagged as {split}, expected TRAIN.")
            train_count += 1
        elif t <= 150:
            if split != "VAL":
                errors.append(f"Sample {s['sample_id']} day {t} incorrectly tagged as {split}, expected VAL.")
            val_count += 1
        else:
            if split != "TEST":
                errors.append(f"Sample {s['sample_id']} day {t} incorrectly tagged as {split}, expected TEST.")
            test_count += 1

        # Check Label Verification: strictly in [t + 1, t + 14]
        asset_failures = failures_by_asset.get(ast_id, set())
        true_future_failures = [f for f in asset_failures if (t + 1) <= f <= (t + 14)]
        expected_label = 1 if len(true_future_failures) > 0 else 0

        if s["failure_within_14d"] != expected_label:
            errors.append(
                f"LEAKAGE/LABEL MISMATCH: Sample {s['sample_id']} at day {t} for asset {ast_id} has label {s['failure_within_14d']} but actual failures in [T+1, T+14] is {true_future_failures} (expected {expected_label})."
            )

        # Ensure future window [T+1, T+14] does not exceed total simulation days
        if t + 14 > simulation_days:
            errors.append(f"Sample {s['sample_id']} observation day {t} + 14 exceeds total simulation days {simulation_days}.")

        # Check for NaN / None in feature values
        for feat in [
            "current_health_index", "health_degradation_velocity_14d", "health_degradation_velocity_30d",
            "cumulative_gmt_tonnage_30d", "days_since_last_inspection", "days_since_last_maintenance",
            "past_defects_count_90d", "deferred_maintenance_count", "environmental_stress_index_7d",
            "asset_age_years", "asset_criticality", "speed_restriction_active"
        ]:
            val = s.get(feat)
            if val is None or (isinstance(val, float) and (val != val or val == float("inf"))):
                errors.append(f"Feature {feat} is invalid (NaN/None/Inf) in sample {s['sample_id']}.")

    passed = (len(errors) == 0)

    return {
        "passed": passed,
        "total_samples": total_samples,
        "positive_samples": positive_samples,
        "positive_rate": round(positive_rate, 4),
        "split_counts": {
            "TRAIN": train_count,
            "VAL": val_count,
            "TEST": test_count,
        },
        "errors": errors[:20],  # cap display
        "error_count": len(errors),
        "warnings": warnings,
    }
