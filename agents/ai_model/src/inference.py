"""
inference.py
Inference pipeline for AUREV Guard AI agents.
- Loads trained models (IsolationForest + RandomForestClassifier).
- Runs anomaly detection and supervised risk prediction.
- Generates SHAP explainability plots for transparency.
"""

import os
import joblib
import pandas as pd
import shap
import matplotlib.pyplot as plt

from agents.ai_model.src.utils import MODEL_DIR, logger

# --- Base features expected by models ---
BASE_FEATURES = [
    "tx_count_24h",
    "total_value_24h",
    "largest_value_24h",
    "std_value_24h",
    "unique_counterparts_24h",
    "entropy_of_destinations",
    "share_of_daily_volume",
    "relative_max_vs_global",
]


# --- Load models ---
def load_models():
    rf_path = os.path.join(MODEL_DIR, "randomforest.pkl")
    iso_path = os.path.join(MODEL_DIR, "isolationforest.pkl")

    if not os.path.exists(rf_path):
        raise FileNotFoundError(f"RandomForest model not found at {rf_path}")
    if not os.path.exists(iso_path):
        raise FileNotFoundError(f"IsolationForest model not found at {iso_path}")

    rf_model = joblib.load(rf_path)
    iso_model = joblib.load(iso_path)
    explainer = shap.TreeExplainer(rf_model)

    logger.info("✅ Models loaded successfully")
    return rf_model, iso_model, explainer


# --- Anomaly detection ---
def detect_anomaly(iso_model, features: pd.DataFrame):
    """
    Run IsolationForest anomaly detection.
    Returns anomaly score and binary flag.
    """
    score = float(iso_model.decision_function(features[BASE_FEATURES])[0])
    is_anomaly = 1 if score < 0 else 0
    logger.debug(f"Anomaly detection: score={score}, is_anomaly={is_anomaly}")
    return score, is_anomaly


# --- Risk prediction ---
def predict_risk(rf_model, features: pd.DataFrame):
    """
    Run RandomForest risk prediction.
    Returns predicted label and probability of risk.
    """
    y_pred = int(rf_model.predict(features[BASE_FEATURES])[0])
    y_prob = float(rf_model.predict_proba(features[BASE_FEATURES])[0][1])
    logger.debug(f"Risk prediction: y_pred={y_pred}, y_prob={y_prob}")
    return y_pred, y_prob


# --- Explainability ---
def explain_prediction(explainer, features: pd.DataFrame, save_path: str | None = None):
    """
    Generate SHAP force plot for prediction explanation.
    If save_path is provided, saves the plot as an image.
    """
    shap_values = explainer.shap_values(features[BASE_FEATURES])

    # Classification returns list [class0, class1]
    if isinstance(shap_values, list):
        shap_to_use = shap_values[1][0, :]
        expected_val = explainer.expected_value[1]
    else:
        shap_to_use = shap_values[0, :]
        expected_val = explainer.expected_value

    force_plot = shap.force_plot(
        expected_val,
        shap_to_use,
        features[BASE_FEATURES].iloc[0, :],
        matplotlib=True,
        show=False,
    )

    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        logger.info(f"💡 SHAP force plot saved to {save_path}")
    else:
        plt.show()

    return force_plot


# --- Example usage ---
if __name__ == "__main__":
    # Load models
    rf_model, iso_model, explainer = load_models()

    # Create synthetic demo features
    demo_features = pd.DataFrame([{
        "tx_count_24h": 12,
        "total_value_24h": 5_000_000,
        "largest_value_24h": 2_000_000,
        "std_value_24h": 200_000,
        "unique_counterparts_24h": 15,
        "entropy_of_destinations": 2.5,
        "share_of_daily_volume": 0.35,
        "relative_max_vs_global": 0.8,
    }])

    # Run inference
    anomaly_score, is_anomaly = detect_anomaly(iso_model, demo_features)
    y_pred, y_prob = predict_risk(rf_model, demo_features)

    logger.info(f"🔎 Inference results: anomaly_score={anomaly_score}, is_anomaly={is_anomaly}, "
                f"predicted_risk={y_pred}, probability={y_prob:.3f}")

    # Generate SHAP explanation
    explain_prediction(explainer, demo_features, save_path=os.path.join(MODEL_DIR, "shap_demo.png"))