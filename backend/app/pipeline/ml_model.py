"""
RailSync AI — ML Defect Escalation Risk Model
Trains and executes an explainable gradient boosting model for predicting maintenance risk scores.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from backend.app.pipeline.feature_engineering import extract_request_features, feature_dict_to_vector


class DefectRiskPredictor:
    """
    Trained Gradient Boosting model for predicting continuous risk scores (0.0 to 1.0)
    with deterministic feature importance attribution.
    """

    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=60,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        )
        self.feature_names = [
            "severity_level",
            "department_code",
            "duration_hours",
            "deadline_window_hours",
            "urgency_ratio",
            "asset_criticality",
            "degradation_risk",
            "inspection_age_days",
            "speed_restriction_impact",
            "power_block_required",
            "machinery_count",
        ]
        self.is_trained = False

    def train_on_synthetic_pool(self, requests: List[Dict[str, Any]], assets_by_id: Dict[str, Any]):
        """
        Train the model on feature vectors derived from the synthetic request pool.
        The synthetic target is calibrated from multi-factor risk degradation.
        """
        X = []
        y = []

        for req in requests:
            ast = assets_by_id.get(req.get("asset_id"), {})
            feats = extract_request_features(req, ast)
            vec = feature_dict_to_vector(feats)
            X.append(vec)

            # Calibrated synthetic target (0.0 to 1.0)
            sev_weight = (feats["severity_level"] / 4.0) * 0.40
            urg_weight = min(1.0, feats["urgency_ratio"]) * 0.25
            crit_weight = (feats["asset_criticality"] / 5.0) * 0.20
            deg_weight = feats["degradation_risk"] * 0.15
            target_risk = min(1.0, max(0.0, sev_weight + urg_weight + crit_weight + deg_weight))
            y.append(target_risk)

        if len(X) >= 10:
            X_arr = np.array(X)
            y_arr = np.array(y)
            self.model.fit(X_arr, y_arr)
            self.is_trained = True

    def predict_risk(self, req: Dict[str, Any], asset_meta: Dict[str, Any] = None) -> Tuple[float, Dict[str, float]]:
        """
        Predict defect escalation risk (0.0 to 1.0) and compute feature importance attribution.
        """
        feats = extract_request_features(req, asset_meta)
        vec = feature_dict_to_vector(feats)

        if self.is_trained:
            pred = float(self.model.predict([vec])[0])
            pred = min(1.0, max(0.0, pred))
            
            # Feature contribution approximation
            importances = self.model.feature_importances_
            attribution = {
                name: round(float(imp * val), 3) 
                for name, imp, val in zip(self.feature_names, importances, vec)
            }
        else:
            # Deterministic fallback heuristic
            sev = feats["severity_level"] / 4.0
            crit = feats["asset_criticality"] / 5.0
            urg = min(1.0, feats["urgency_ratio"])
            pred = round(0.5 * sev + 0.3 * urg + 0.2 * crit, 3)
            attribution = {name: round(val, 2) for name, val in feats.items()}

        return round(pred, 3), attribution
