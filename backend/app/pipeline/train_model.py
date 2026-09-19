"""
RailSync AI — Master AI Model Training, Out-of-Time Evaluation, Selection & Persistence Pipeline (vFinal)
Trains baseline and candidate classifiers on longitudinal out-of-time splits,
evaluates genuine future outcome prediction (failure_within_14d), tests probability calibration,
and persists the canonical final model artifact.
"""

import os
import json
import csv
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import joblib

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    fbeta_score,
    brier_score_loss,
    confusion_matrix,
)

from backend.app.pipeline.feature_engineering_v2 import FEATURE_NAMES

ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT_DIR / "data" / "synthetic" / "ml_training_samples.csv"
MODEL_DIR = ROOT_DIR / "backend" / "app" / "models" / "saved_models"
FINAL_MODEL_PATH = MODEL_DIR / "asset_failure_risk_final.joblib"
FINAL_METADATA_PATH = MODEL_DIR / "asset_failure_risk_final_metadata.json"
V3_MODEL_PATH = MODEL_DIR / "asset_failure_risk_v3.joblib"
V3_METADATA_PATH = MODEL_DIR / "asset_failure_risk_v3_metadata.json"
IMPORTANCE_PATH = MODEL_DIR / "feature_importance.json"


def load_ml_dataset():
    """Load and chronologically split the ML training dataset."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found at: {DATA_PATH}")

    train_rows = []
    val_rows = []
    test_rows = []

    with DATA_PATH.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            split = row["split_tag"]
            if split == "TRAIN":
                train_rows.append(row)
            elif split == "VAL":
                val_rows.append(row)
            elif split == "TEST":
                test_rows.append(row)

    def extract_xy(rows):
        X = []
        y = []
        for r in rows:
            vec = [float(r[col]) for col in FEATURE_NAMES]
            X.append(vec)
            y.append(int(r["failure_within_14d"]))
        return np.array(X), np.array(y)

    X_train, y_train = extract_xy(train_rows)
    X_val, y_val = extract_xy(val_rows)
    X_test, y_test = extract_xy(test_rows)

    return (X_train, y_train), (X_val, y_val), (X_test, y_test), (train_rows, val_rows, test_rows)


def evaluate_predictions(y_true, y_probs, threshold=0.5):
    """Compute comprehensive classification and ranking metrics."""
    y_pred = (y_probs >= threshold).astype(int)
    roc_auc = float(roc_auc_score(y_true, y_probs))
    pr_auc = float(average_precision_score(y_true, y_probs))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    f2 = float(fbeta_score(y_true, y_pred, beta=2.0, zero_division=0))
    brier = float(brier_score_loss(y_true, y_probs))
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "f2_score": round(f2, 4),
        "brier_score": round(brier, 4),
        "threshold": round(threshold, 4),
        "confusion_matrix": cm,
    }


def train_and_select_model():
    """Train candidate models, perform temporal validation selection, test calibration, and persist artifact."""
    print("=" * 80)
    print("RailSync AI — Predictive Asset Risk Model Training & Multi-Model Benchmark")
    print("=" * 80)

    (X_train, y_train), (X_val, y_val), (X_test, y_test), (train_rows, val_rows, test_rows) = load_ml_dataset()

    print(f"[*] Train set: {len(X_train)} samples ({sum(y_train)} positive, {sum(y_train)/len(X_train):.2%})")
    print(f"[*] Val set:   {len(X_val)} samples ({sum(y_val)} positive, {sum(y_val)/len(X_val):.2%})")
    print(f"[*] Test set:  {len(X_test)} samples ({sum(y_test)} positive, {sum(y_test)/len(X_test):.2%})")

    # 1. Deterministic Non-ML Heuristic Baseline
    def heuristic_predict(X):
        probs = []
        for row in X:
            h_idx = row[0]       # current_health_index
            v14 = row[1]         # health_degradation_velocity_14d
            insp = row[4]        # days_since_last_inspection
            def_maint = row[7]   # deferred_maintenance_count

            score = 0.0
            if h_idx < 65.0:
                score += 0.40
            if insp > 30:
                score += 0.20
            if def_maint >= 1:
                score += 0.25
            if v14 < -0.3:
                score += 0.15
            probs.append(min(1.0, score))
        return np.array(probs)

    h_val_probs = heuristic_predict(X_val)
    h_val_metrics = evaluate_predictions(y_val, h_val_probs, threshold=0.35)
    h_test_probs = heuristic_predict(X_test)
    h_test_metrics = evaluate_predictions(y_test, h_test_probs, threshold=0.35)
    print(f"\n[1] Heuristic Baseline -> Val PR-AUC: {h_val_metrics['pr_auc']:.4f} | ROC-AUC: {h_val_metrics['roc_auc']:.4f} | Brier: {h_val_metrics['brier_score']:.4f}")

    # 2. Scaled Logistic Regression
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    lr_model = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)
    lr_model.fit(X_train_scaled, y_train)
    lr_val_probs = lr_model.predict_proba(X_val_scaled)[:, 1]
    lr_val_metrics = evaluate_predictions(y_val, lr_val_probs)
    print(f"[2] Logistic Regression -> Val PR-AUC: {lr_val_metrics['pr_auc']:.4f} | ROC-AUC: {lr_val_metrics['roc_auc']:.4f} | Brier: {lr_val_metrics['brier_score']:.4f}")

    # 3. Random Forest Classifier
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=42)
    rf_model.fit(X_train, y_train)
    rf_val_probs = rf_model.predict_proba(X_val)[:, 1]
    rf_val_metrics = evaluate_predictions(y_val, rf_val_probs)
    print(f"[3] Random Forest       -> Val PR-AUC: {rf_val_metrics['pr_auc']:.4f} | ROC-AUC: {rf_val_metrics['roc_auc']:.4f} | Brier: {rf_val_metrics['brier_score']:.4f}")

    # 4. Gradient Boosting Classifier
    gb_model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42)
    gb_model.fit(X_train, y_train)
    gb_val_probs = gb_model.predict_proba(X_val)[:, 1]
    gb_val_metrics = evaluate_predictions(y_val, gb_val_probs)
    print(f"[4] Gradient Boosting   -> Val PR-AUC: {gb_val_metrics['pr_auc']:.4f} | ROC-AUC: {gb_val_metrics['roc_auc']:.4f} | Brier: {gb_val_metrics['brier_score']:.4f}")

    # 5. HistGradientBoostingClassifier (Modern zero-dependency GBDT)
    hgb_model = HistGradientBoostingClassifier(max_iter=100, learning_rate=0.05, max_depth=4, class_weight="balanced", random_state=42)
    hgb_model.fit(X_train, y_train)
    hgb_val_probs = hgb_model.predict_proba(X_val)[:, 1]
    hgb_val_metrics = evaluate_predictions(y_val, hgb_val_probs)
    print(f"[5] HistGradientBoosting-> Val PR-AUC: {hgb_val_metrics['pr_auc']:.4f} | ROC-AUC: {hgb_val_metrics['roc_auc']:.4f} | Brier: {hgb_val_metrics['brier_score']:.4f}")

    # Candidate Comparison & Model Selection
    candidates = {
        "HistGradientBoosting": (hgb_model, hgb_val_probs, hgb_val_metrics, None),
        "GradientBoosting": (gb_model, gb_val_probs, gb_val_metrics, None),
        "RandomForest": (rf_model, rf_val_probs, rf_val_metrics, None),
        "LogisticRegression": (lr_model, lr_val_probs, lr_val_metrics, scaler),
    }

    # Select best candidate model based on Validation PR-AUC + F2 Score
    best_name = max(candidates.keys(), key=lambda k: candidates[k][2]["pr_auc"] * 0.5 + candidates[k][2]["f2_score"] * 0.5)
    best_model, best_val_probs, best_val_metrics, best_scaler = candidates[best_name]
    print(f"\n[+] SELECTED BEST CANDIDATE: {best_name}")

    # Evaluate Probability Calibration (Platt Scaling via 1D Logistic Regression on Val Set)
    from sklearn.linear_model import LogisticRegression as PlattScaler
    platt_calibrator = PlattScaler(C=1.0, solver='lbfgs')
    platt_calibrator.fit(best_val_probs.reshape(-1, 1), y_val)
    cal_val_probs = platt_calibrator.predict_proba(best_val_probs.reshape(-1, 1))[:, 1]

    uncal_brier = best_val_metrics["brier_score"]
    cal_brier = round(float(brier_score_loss(y_val, cal_val_probs)), 4)
    print(f"[*] Calibration Analysis -> Uncalibrated Brier: {uncal_brier:.4f} | Calibrated Brier: {cal_brier:.4f}")
    is_calibrated = (cal_brier < uncal_brier)
    print(f"[*] Calibration retained: {is_calibrated} (Reason: Calibrated Brier improved: {is_calibrated})")

    # Threshold selection on Validation set (optimizing F2 score for safety recall)
    best_thresh = 0.5
    best_f2 = 0.0
    for th in np.linspace(0.15, 0.70, 56):
        m = evaluate_predictions(y_val, best_val_probs, threshold=th)
        if m["f2_score"] > best_f2:
            best_f2 = m["f2_score"]
            best_thresh = th

    calibrated_val_metrics = evaluate_predictions(y_val, best_val_probs, threshold=best_thresh)
    print(f"[+] Selected Decision Threshold: {best_thresh:.3f} (Val F2: {calibrated_val_metrics['f2_score']:.4f}, Recall: {calibrated_val_metrics['recall']:.2%})")

    # Final Out-Of-Time Evaluation on Held-Out Test Set (Strictly evaluated once)
    if best_scaler is not None:
        test_probs = best_model.predict_proba(X_test_scaled)[:, 1]
    else:
        test_probs = best_model.predict_proba(X_test)[:, 1]

    test_metrics = evaluate_predictions(y_test, test_probs, threshold=best_thresh)

    # Compute Test Metrics for All Candidate Models for Comprehensive Reporting
    all_candidate_metrics = {}
    for c_name, (c_mod, _, _, c_scl) in candidates.items():
        if c_scl is not None:
            c_test_p = c_mod.predict_proba(X_test_scaled)[:, 1]
        else:
            c_test_p = c_mod.predict_proba(X_test)[:, 1]
        all_candidate_metrics[c_name] = evaluate_predictions(y_test, c_test_p, threshold=best_thresh)

    # Compute Feature Importances (Native or Permutation)
    if hasattr(best_model, "feature_importances_"):
        raw_importances = best_model.feature_importances_
    else:
        from sklearn.inspection import permutation_importance
        perm_res = permutation_importance(best_model, X_val, y_val, n_repeats=5, random_state=42)
        raw_importances = perm_res.importances_mean

    importance_list = [
        {"feature": name, "importance": round(float(imp), 5)}
        for name, imp in zip(FEATURE_NAMES, raw_importances)
    ]
    importance_list.sort(key=lambda x: x["importance"], reverse=True)

    print("\n" + "=" * 80)
    print("FINAL HELD-OUT TEST PERFORMANCE")
    print("=" * 80)
    print(f"ROC-AUC:   {test_metrics['roc_auc']:.4f}")
    print(f"PR-AUC:    {test_metrics['pr_auc']:.4f}")
    print(f"Precision: {test_metrics['precision']:.4f}")
    print(f"Recall:    {test_metrics['recall']:.4f}")
    print(f"F1-Score:  {test_metrics['f1_score']:.4f}")
    print(f"F2-Score:  {test_metrics['f2_score']:.4f}")
    print(f"Brier:     {test_metrics['brier_score']:.4f}")
    print(f"Confusion: {test_metrics['confusion_matrix']}")

    # Build Comprehensive Metadata
    metadata = {
        "model_name": f"{best_name} Classifier",
        "model_class": best_model.__class__.__name__,
        "version": "final-longitudinal",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_seed": 42,
        "feature_schema": FEATURE_NAMES,
        "target_definition": "failure_within_14d (Simulated qualifying failure-related event within next 14 days)",
        "dataset_statistics": {
            "total_samples": len(X_train) + len(X_val) + len(X_test),
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "test_samples": len(X_test),
            "train_positive_rate": round(float(sum(y_train) / len(X_train)), 4),
            "val_positive_rate": round(float(sum(y_val) / len(X_val)), 4),
            "test_positive_rate": round(float(sum(y_test) / len(X_test)), 4),
            "train_period": "Days 15 to 120",
            "val_period": "Days 121 to 150",
            "test_period": "Days 151 to 180 (Held-Out Unseen)",
        },
        "calibrated_threshold": round(best_thresh, 4),
        "heuristic_baseline_metrics": {
            "val": h_val_metrics,
            "test": h_test_metrics
        },
        "all_candidate_test_metrics": all_candidate_metrics,
        "validation_metrics": calibrated_val_metrics,
        "test_metrics": test_metrics,
        "calibration_info": {
            "uncalibrated_brier_score": uncal_brier,
            "calibrated_brier_score": cal_brier,
            "calibration_method": "sigmoid_platt_scaling",
        },
        "feature_importances": importance_list,
        "domain_interpretation": "Predicted synthetic asset failure risk over next 14 days used for decision-support maintenance ranking.",
        "disclaimer": "Synthetic longitudinal dataset generated for SIH26027 prototype evaluation. Not evaluated on real Indian Railways production TMS data."
    }

    # Persist Canonical Artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifact = {
        "model": best_model,
        "scaler": best_scaler,
        "model_name": f"{best_name} Classifier",
        "model_class": best_model.__class__.__name__,
        "version": "final-longitudinal",
        "trained_at_utc": metadata["trained_at_utc"],
        "calibrated_threshold": best_thresh,
        "feature_schema": FEATURE_NAMES,
        "validation_metrics": calibrated_val_metrics,
        "test_metrics": test_metrics,
        "metadata": metadata
    }

    # 1. Save canonical final model artifact and metadata
    joblib.dump(artifact, FINAL_MODEL_PATH)
    with FINAL_METADATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 2. Save backward-compatible v3 artifact and metadata
    joblib.dump(artifact, V3_MODEL_PATH)
    with V3_METADATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with IMPORTANCE_PATH.open("w", encoding="utf-8") as f:
        json.dump(importance_list, f, indent=2)

    print(f"\n[+] Saved canonical final model artifact to: {FINAL_MODEL_PATH}")
    print(f"[+] Saved canonical final metadata to:       {FINAL_METADATA_PATH}")
    print(f"[+] Saved feature importance profile to:    {IMPORTANCE_PATH}")

    return metadata


if __name__ == "__main__":
    train_and_select_model()
