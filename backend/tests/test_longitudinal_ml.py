"""
Tests for RailSync AI Next-Generation Longitudinal Dataset & ML Prediction Subsystem (v2.0)
"""

import pytest
from pathlib import Path
import random
import numpy as np

from dataset_generation.generators.geography import generate_tracks
from dataset_generation.generators.assets import generate_assets
from dataset_generation.generators.longitudinal_history import simulate_longitudinal_asset_history
from dataset_generation.validators.temporal_validator import validate_temporal_leakage_and_integrity
from backend.app.pipeline.feature_engineering_v2 import extract_asset_features, feature_dict_to_vector, FEATURE_NAMES
from backend.app.pipeline.ml_model import DefectRiskPredictor


def test_longitudinal_generation_and_zero_leakage():
    """Verify deterministic longitudinal history generation and zero lookahead leakage."""
    rng = random.Random(42)
    tracks = generate_tracks(rng)
    assets = generate_assets(tracks, rng)

    telemetry, inspections, interventions, defect_events, ml_samples = simulate_longitudinal_asset_history(
        assets, simulation_days=194, rng=rng
    )

    assert len(telemetry) == 174 * 194
    assert len(ml_samples) > 0
    assert len(inspections) > 0
    assert len(interventions) > 0
    assert len(defect_events) > 0

    # Run Temporal Zero-Leakage Validator
    val_res = validate_temporal_leakage_and_integrity(
        telemetry, defect_events, ml_samples, simulation_days=194
    )

    assert val_res["passed"] is True, f"Temporal leakage detected: {val_res['errors']}"
    assert val_res["error_count"] == 0
    assert val_res["total_samples"] == len(ml_samples)
    assert 0.02 <= val_res["positive_rate"] <= 0.20


def test_ml_feature_vector_structure():
    """Verify feature vector adheres strictly to 12D schema with no NaNs."""
    dummy_asset = {
        "asset_id": "AST-TRK-1001",
        "health_index": 72.5,
        "last_inspected_days_ago": 20,
        "criticality_weight": 4,
        "age_years": 10.0,
    }
    feats = extract_asset_features(dummy_asset)
    vec = feature_dict_to_vector(feats)

    assert len(vec) == 12
    assert len(vec) == len(FEATURE_NAMES)
    assert not any(np.isnan(v) for v in vec)
    assert feats["current_health_index"] == 72.5
    assert feats["asset_criticality"] == 4.0


def test_persisted_ml_model_inference():
    """Verify pre-trained model loads and produces bounded predictions [0.0, 1.0]."""
    predictor = DefectRiskPredictor()
    assert predictor.is_trained is True
    assert "longitudinal" in predictor.version or "3.0.0" in predictor.version or "2.0.0" in predictor.version

    req_dummy = {"request_id": "REQ-TEST-001", "severity": "URGENT"}
    ast_dummy = {"asset_id": "AST-TRK-1001", "health_index": 45.0, "last_inspected_days_ago": 40}

    prob_risk, attribution = predictor.predict_risk(req_dummy, ast_dummy)

    assert 0.0 <= prob_risk <= 1.0
    assert isinstance(attribution, dict)
    assert len(attribution) == len(FEATURE_NAMES)
    assert all(k in attribution for k in FEATURE_NAMES)
