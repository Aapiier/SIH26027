"""
RailSync AI — ML Asset Failure Risk Predictor (v2.0)
Loads the persisted next-generation trained classifier artifact (trained on longitudinal history)
and generates explainable future asset failure probabilities strictly without target formula leakage.
"""

from typing import Dict, List, Any, Tuple
from pathlib import Path
import os
import joblib
import numpy as np

from backend.app.pipeline.feature_engineering_v2 import extract_asset_features, feature_dict_to_vector, FEATURE_NAMES

MODEL_DIR = Path(__file__).resolve().parents[1] / "models" / "saved_models"
MODEL_PATH = MODEL_DIR / "asset_failure_risk_v2.joblib"


class DefectRiskPredictor:
    """
    Production ML Model Service:
    Loads pre-trained model artifact and provides calibrated failure probability predictions.
    """

    def __init__(self, artifact_path: Path = MODEL_PATH):
        self.artifact_path = artifact_path
        self.model = None
        self.scaler = None
        self.model_name = "HeuristicFallback"
        self.version = "1.0.0-fallback"
        self.calibrated_threshold = 0.40
        self.feature_names = FEATURE_NAMES
        self.is_trained = False
        self.metadata = {}

        self.load_model()

    def load_model(self) -> bool:
        """Load persisted model artifact from disk."""
        if self.artifact_path.exists():
            try:
                artifact = joblib.load(self.artifact_path)
                self.model = artifact["model"]
                self.scaler = artifact.get("scaler")
                self.model_name = artifact.get("model_name", "HistGradientBoosting")
                self.version = artifact.get("version", "2.0.0")
                self.calibrated_threshold = artifact.get("calibrated_threshold", 0.40)
                self.feature_names = artifact.get("feature_schema", FEATURE_NAMES)
                self.metadata = {
                    "model_name": self.model_name,
                    "version": self.version,
                    "trained_at_utc": artifact.get("trained_at_utc"),
                    "calibrated_threshold": self.calibrated_threshold,
                    "validation_metrics": artifact.get("validation_metrics", {}),
                    "test_metrics": artifact.get("test_metrics", {}),
                }
                self.is_trained = True
                return True
            except Exception as e:
                print(f"[!] Warning: Failed to load model artifact {self.artifact_path}: {e}")
                self.is_trained = False
        else:
            self.is_trained = False
        return False

    def predict_risk(
        self,
        req: Dict[str, Any],
        asset_meta: Dict[str, Any] = None,
        telemetry_history: List[Dict[str, Any]] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Predict probability of asset failure within 14 days P(failure_within_14d) in [0.0, 1.0]
        and compute local feature attribution.
        """
        feats = extract_asset_features(asset_meta or {}, recent_telemetry=telemetry_history)
        vec = feature_dict_to_vector(feats)

        if self.is_trained and self.model is not None:
            vec_arr = np.array([vec])
            if self.scaler is not None:
                vec_arr = self.scaler.transform(vec_arr)

            try:
                # Predict probability of class 1 (failure within 14 days)
                probs = self.model.predict_proba(vec_arr)[0]
                prob_failure = float(probs[1]) if len(probs) > 1 else float(probs[0])
            except Exception:
                prob_failure = 0.20

            pred = min(1.0, max(0.0, prob_failure))

            # Feature contribution approximation
            if hasattr(self.model, "feature_importances_"):
                importances = self.model.feature_importances_
            else:
                # Balanced weights across key degradation metrics
                importances = np.array([0.25, 0.15, 0.10, 0.10, 0.10, 0.08, 0.07, 0.05, 0.04, 0.03, 0.02, 0.01])

            attribution = {
                name: round(float(imp * abs(val)), 3)
                for name, imp, val in zip(self.feature_names, importances, vec)
            }
        else:
            # Deterministic domain fallback when model artifact is absent
            h = feats["current_health_index"]
            insp = feats["days_since_last_inspection"]
            def_maint = feats["deferred_maintenance_count"]
            vel = feats["health_degradation_velocity_14d"]

            score = 0.0
            if h < 65.0:
                score += 0.45
            if insp > 30:
                score += 0.20
            if def_maint >= 1:
                score += 0.25
            if vel < -0.3:
                score += 0.10

            pred = min(1.0, max(0.0, score))
            attribution = {name: round(float(val), 2) for name, val in feats.items()}

        return round(pred, 3), attribution

    def get_model_metadata(self) -> Dict[str, Any]:
        """Return model provenance and validation metadata."""
        return {
            "is_trained": self.is_trained,
            "model_name": self.model_name,
            "version": self.version,
            "calibrated_threshold": self.calibrated_threshold,
            "artifact_path": str(self.artifact_path),
            **self.metadata
        }
