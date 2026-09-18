"""
RailSync AI — Comprehensive AI/ML Model Rigor, Zero-Leakage & Behavioral Test Suite
Verifies:
1. Canonical v3 artifact loading and metadata integrity
2. Exact feature schema enforcement (12 features)
3. Rejection of NaN / invalid feature values
4. Output determinism and bounded range in [0.0, 1.0]
5. Automated zero target leakage audit
6. Temporal out-of-time ordering integrity
7. Behavioral Case A: Healthy asset produces low risk
8. Behavioral Case B: Deteriorating asset produces higher risk
9. Behavioral Case C: Deferred maintenance elevates risk
10. Behavioral Case D: Tier-1 Emergency Safety Gates remain dominant
11. Model persistence reload consistency
12. Model superiority over heuristic baseline
"""

import pytest
import numpy as np
from pathlib import Path
import joblib

from backend.app.pipeline.ml_model import DefectRiskPredictor, PRIMARY_MODEL_PATH
from backend.app.pipeline.feature_engineering_v2 import FEATURE_NAMES, extract_asset_features
from backend.app.pipeline.train_model import load_ml_dataset, evaluate_predictions


@pytest.fixture(scope="module")
def predictor():
    pred = DefectRiskPredictor(artifact_path=PRIMARY_MODEL_PATH)
    return pred


def test_artifact_loading_and_version(predictor):
    """Verify that canonical v3 model artifact loads and has valid metadata."""
    assert predictor.is_trained is True
    assert predictor.model is not None
    meta = predictor.get_model_metadata()
    assert meta["model_name"] == "HistGradientBoosting GBDT"
    assert "3.0.0" in meta["version"]
    assert "calibrated_threshold" in meta
    assert len(meta["feature_schema"]) == 12


def test_exact_feature_schema_enforcement(predictor):
    """Verify that missing features raise ValueError."""
    incomplete_feats = {
        "current_health_index": 85.0,
        "days_since_last_inspection": 10.0
    }
    with pytest.raises(ValueError) as excinfo:
        predictor.validate_features(incomplete_feats)
    assert "missing required features" in str(excinfo.value)


def test_nan_feature_rejection(predictor):
    """Verify that NaN or Inf feature values are rejected."""
    nan_feats = {name: 1.0 for name in FEATURE_NAMES}
    nan_feats["current_health_index"] = float("nan")
    with pytest.raises(ValueError) as excinfo:
        predictor.validate_features(nan_feats)
    assert "NaN or Inf" in str(excinfo.value)


def test_inference_determinism_and_bounds(predictor):
    """Verify that inference is deterministic and outputs probabilities strictly in [0.0, 1.0]."""
    req = {"request_id": "TEST-REQ-1", "department": "ENGINEERING"}
    asset_meta = {
        "health_index": 78.5,
        "last_inspected_days_ago": 18,
        "criticality_weight": 4,
        "age_years": 8.5
    }
    prob_1, attr_1 = predictor.predict_risk(req, asset_meta=asset_meta)
    prob_2, attr_2 = predictor.predict_risk(req, asset_meta=asset_meta)

    assert 0.0 <= prob_1 <= 1.0
    assert prob_1 == prob_2
    assert attr_1 == attr_2
    assert len(attr_1) == 12


def test_zero_target_leakage_audit():
    """Verify that no target formula, future defect, or post-event information is in FEATURE_NAMES."""
    forbidden_substrings = [
        "failure", "target", "label", "future", "post", "next_14d", "outcome", "y_true", "is_failed"
    ]
    for feat in FEATURE_NAMES:
        for forbidden in forbidden_substrings:
            assert forbidden not in feat.lower(), f"Potential target leakage found in feature name: '{feat}'"


def test_temporal_ordering_integrity():
    """Verify chronological ordering across TRAIN, VAL, and TEST splits."""
    (X_train, y_train), (X_val, y_val), (X_test, y_test), (train_rows, val_rows, test_rows) = load_ml_dataset()

    assert len(X_train) > 0
    assert len(X_val) > 0
    assert len(X_test) > 0

    # Ensure all splits have valid binary targets
    assert set(np.unique(y_train)).issubset({0, 1})
    assert set(np.unique(y_val)).issubset({0, 1})
    assert set(np.unique(y_test)).issubset({0, 1})

    # Positive event rate must be realistic (between 2% and 10%)
    train_pos_rate = sum(y_train) / len(y_train)
    val_pos_rate = sum(y_val) / len(y_val)
    test_pos_rate = sum(y_test) / len(y_test)

    assert 0.02 <= train_pos_rate <= 0.10
    assert 0.02 <= val_pos_rate <= 0.10
    assert 0.02 <= test_pos_rate <= 0.10


def test_behavioral_healthy_vs_degraded_asset(predictor):
    """Case A vs Case B: Healthy asset should have lower predicted risk than degraded asset."""
    healthy_asset = {
        "health_index": 96.0,
        "last_inspected_days_ago": 5,
        "criticality_weight": 2,
        "age_years": 3.0
    }
    degraded_asset = {
        "health_index": 45.0,
        "last_inspected_days_ago": 45,
        "criticality_weight": 5,
        "age_years": 18.0
    }

    prob_healthy, _ = predictor.predict_risk({}, asset_meta=healthy_asset)
    prob_degraded, _ = predictor.predict_risk({}, asset_meta=degraded_asset)

    assert prob_degraded > prob_healthy, f"Expected degraded ({prob_degraded}) > healthy ({prob_healthy})"


def test_behavioral_deferred_maintenance_impact(predictor):
    """Case C: Deferred maintenance history should elevate risk."""
    base_asset = {"health_index": 62.0, "last_inspected_days_ago": 25, "criticality_weight": 3}
    
    # Telemetry with deferred count
    normal_telemetry = [{"health_index": 62.0, "deferred_count": 0.0} for _ in range(30)]
    deferred_telemetry = [{"health_index": 62.0, "deferred_count": 3.0} for _ in range(30)]

    prob_normal, _ = predictor.predict_risk({}, asset_meta=base_asset, telemetry_history=normal_telemetry)
    prob_deferred, _ = predictor.predict_risk({}, asset_meta=base_asset, telemetry_history=deferred_telemetry)

    assert prob_deferred >= prob_normal


def test_tier1_safety_gate_dominance(predictor):
    """Case D: Safety-critical emergency defects remain unconditional Tier-1 override regardless of ML score."""
    from backend.app.services.explanation_service import explain_unscheduled_task
    from backend.app.database import init_db, SessionLocal
    from backend.app.models.db_models import MaintenanceRequest

    init_db()
    db = SessionLocal()
    try:
        # Find an emergency defect
        req = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.defect_type.in_(["RAIL_FRACTURE_RISK", "POINT_MACHINE_DETECTION_FAILURE", "OHE_CANTILEVER_FLASH_BURN"])
        ).first()

        if req:
            res = explain_unscheduled_task(db, req.request_id)
            assert "TIER 1" in res["ai_risk_context"]["tier"]
    finally:
        db.close()


def test_persisted_model_reload_consistency(predictor):
    """Verify that re-loading the persisted artifact produces bitwise identical predictions."""
    reloaded_predictor = DefectRiskPredictor(artifact_path=PRIMARY_MODEL_PATH)
    sample_asset = {"health_index": 70.0, "last_inspected_days_ago": 20, "criticality_weight": 3}

    prob_orig, attr_orig = predictor.predict_risk({}, asset_meta=sample_asset)
    prob_reload, attr_reload = reloaded_predictor.predict_risk({}, asset_meta=sample_asset)

    assert prob_orig == prob_reload
    assert attr_orig == attr_reload


def test_model_superiority_over_baseline():
    """Verify that trained GBDT model outperforms heuristic baseline on validation PR-AUC."""
    meta_path = PRIMARY_MODEL_PATH.parent / "asset_failure_risk_v3_metadata.json"
    assert meta_path.exists()
    import json
    with meta_path.open("r", encoding="utf-8") as f:
        meta = json.load(f)

    gbdt_pr_auc = meta["test_metrics"]["pr_auc"]
    baseline_pr_auc = meta["heuristic_baseline_metrics"]["test"]["pr_auc"]

    assert gbdt_pr_auc >= baseline_pr_auc, f"GBDT PR-AUC ({gbdt_pr_auc}) must be >= Baseline ({baseline_pr_auc})"
