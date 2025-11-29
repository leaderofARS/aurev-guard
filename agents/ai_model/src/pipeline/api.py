"""
pipeline/api.py
FastAPI service for AUREV Guard AI agents.
- Loads trained models (IsolationForest + RandomForestClassifier).
- Exposes REST endpoints for prediction, anomaly detection, and explainability.
- Provides health check and metadata endpoints.
"""

import os
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

from agents.ai_model.src.inference import (
    load_models,
    detect_anomaly,
    predict_risk,
    explain_prediction,
)
from agents.ai_model.src.utils import logger, MODEL_DIR

# --- Load models once at startup ---
try:
    rf_model, iso_model, explainer = load_models()
except Exception as e:
    logger.error(f"❌ Failed to load models: {e}")
    rf_model, iso_model, explainer = None, None, None

# --- FastAPI app ---
app = FastAPI(
    title="AUREV Guard AI API",
    version="1.0",
    description="AI-powered anomaly detection and risk scoring for Cardano transactions.",
)


# --- Request schema ---
class TransactionFeatures(BaseModel):
    tx_count_24h: int
    total_value_24h: float
    largest_value_24h: float
    std_value_24h: float
    unique_counterparts_24h: int
    entropy_of_destinations: float
    share_of_daily_volume: Optional[float] = 0.0
    relative_max_vs_global: Optional[float] = 0.0


# --- Endpoints ---
@app.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    status = "ok" if rf_model and iso_model else "error"
    return {"status": status, "models_loaded": bool(rf_model and iso_model)}


@app.post("/predict")
def predict(features: TransactionFeatures):
    """
    Predict risk and anomaly for a transaction feature set.
    """
    if not rf_model or not iso_model:
        return {"error": "Models not loaded"}

    X_live = pd.DataFrame([features.dict()])

    anomaly_score, is_anomaly = detect_anomaly(iso_model, X_live)
    y_pred, y_prob = predict_risk(rf_model, X_live)

    logger.info(
        f"🔎 Prediction: risk={y_pred}, prob={y_prob:.3f}, anomaly_score={anomaly_score}, is_anomaly={is_anomaly}"
    )

    return {
        "predicted_risk": y_pred,
        "probability": y_prob,
        "anomaly_score": anomaly_score,
        "is_anomaly": is_anomaly,
    }


@app.post("/explain")
def explain(features: TransactionFeatures):
    """
    Generate SHAP explanation for a transaction.
    Saves force plot image to models/ directory.
    """
    if not explainer:
        return {"error": "Explainer not available"}

    X_live = pd.DataFrame([features.dict()])
    save_path = os.path.join(MODEL_DIR, "shap_explanation.png")
    explain_prediction(explainer, X_live, save_path=save_path)

    return {"message": "SHAP explanation generated", "path": save_path}


@app.get("/metadata")
def metadata():
    """
    Return metadata about the service.
    """
    return {
        "service": "AUREV Guard AI API",
        "version": "1.0",
        "features_expected": [
            "tx_count_24h",
            "total_value_24h",
            "largest_value_24h",
            "std_value_24h",
            "unique_counterparts_24h",
            "entropy_of_destinations",
            "share_of_daily_volume",
            "relative_max_vs_global",
        ],
    }


# --- Example run ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("agents.ai_model.src.pipeline.api:app", host="127.0.0.1", port=8000, reload=True)