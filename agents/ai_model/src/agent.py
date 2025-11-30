"""
agents/ai_model/src/agent.py
FastAPI agent wrapper for AUREV Guard AI Model.
Exposes endpoints that the orchestrator calls for prediction and explainability.
"""

import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.ai_model.src.inference import load_models, detect_anomaly, predict_risk, explain_prediction
from agents.ai_model.src.utils import logger, MODEL_DIR

# ===== Models =====
try:
    rf_model, iso_model, explainer = load_models()
    logger.info("✅ AI Models loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load AI models: {e}")
    rf_model, iso_model, explainer = None, None, None

app = FastAPI(
    title="AUREV Guard AI Agent",
    version="1.0.0",
    description="AI-powered risk assessment and anomaly detection for Cardano wallets"
)

# ===== Request/Response Schemas =====
class WalletFeatures(BaseModel):
    """Wallet transaction features extracted from blockchain data"""
    wallet_address: str = Field(..., description="Cardano wallet address")
    tx_count_24h: int = Field(default=0, description="Transaction count in last 24h")
    total_value_24h: float = Field(default=0.0, description="Total transaction value in 24h (lovelace)")
    largest_value_24h: float = Field(default=0.0, description="Largest transaction in 24h")
    std_value_24h: float = Field(default=0.0, description="Std deviation of transaction values")
    unique_counterparts_24h: int = Field(default=0, description="Unique transaction partners")
    entropy_of_destinations: float = Field(default=0.0, description="Entropy of destination distribution")
    share_of_daily_volume: float = Field(default=0.0, description="Share of daily volume")
    relative_max_vs_global: float = Field(default=0.0, description="Relative max vs global max")

class PredictionResponse(BaseModel):
    """Prediction response with risk score and anomaly detection"""
    wallet_address: str
    risk_score: float = Field(..., description="Risk score 0-1 (higher = riskier)")
    risk_label: str = Field(..., description="HIGH_RISK, MEDIUM_RISK, or LOW_RISK")
    anomaly_score: float
    is_anomaly: bool
    confidence: float
    features_used: int

class ExplanationResponse(BaseModel):
    """SHAP explainability response"""
    wallet_address: str
    feature_importance: Dict[str, float]
    top_risk_drivers: List[Dict[str, Any]]
    narrative: str

class AgentResponse(BaseModel):
    """Generic agent response for orchestrator"""
    status: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# ===== Endpoints =====

@app.get("/health")
def agent_health():
    """Health check endpoint"""
    models_ok = rf_model is not None and iso_model is not None
    return {
        "status": "ready" if models_ok else "error",
        "service": "ai_model",
        "version": "1.0.0",
        "models_loaded": models_ok
    }

@app.post("/predict", response_model=AgentResponse)
def predict(features: WalletFeatures) -> AgentResponse:
    """
    Predict risk for a wallet based on transaction features.
    Called by orchestrator for risk assessment.
    """
    try:
        if not rf_model or not iso_model:
            raise HTTPException(status_code=500, detail="Models not loaded")

        # Prepare feature DataFrame (must match model training features)
        base_features = [
            "tx_count_24h",
            "total_value_24h",
            "largest_value_24h",
            "std_value_24h",
            "unique_counterparts_24h",
            "entropy_of_destinations",
            "share_of_daily_volume",
            "relative_max_vs_global",
        ]
        
        feature_dict = {f: getattr(features, f, 0) for f in base_features}
        X_live = pd.DataFrame([feature_dict])

        # Run predictions
        anomaly_score, is_anomaly = detect_anomaly(iso_model, X_live)
        y_pred, y_prob = predict_risk(rf_model, X_live)

        # Convert to risk label
        risk_label = "HIGH_RISK" if y_pred == 1 else "LOW_RISK"
        if 0.4 < y_prob < 0.6:
            risk_label = "MEDIUM_RISK"

        logger.info(
            f"🔮 AI Prediction: wallet={features.wallet_address}, "
            f"risk_score={y_prob:.3f}, anomaly={is_anomaly}"
        )

        prediction_data = {
            "wallet_address": features.wallet_address,
            "risk_score": float(y_prob),
            "risk_label": risk_label,
            "anomaly_score": float(anomaly_score),
            "is_anomaly": bool(is_anomaly),
            "confidence": float(abs(y_prob - 0.5) * 2),  # Confidence metric
            "features_used": len(base_features),
        }

        return AgentResponse(status="success", data=prediction_data)

    except Exception as e:
        logger.error(f"❌ Prediction failed: {e}")
        return AgentResponse(status="error", error=str(e))


@app.post("/explain", response_model=AgentResponse)
def explain(features: WalletFeatures) -> AgentResponse:
    """
    Generate SHAP explanation for a wallet's risk assessment.
    Returns feature importance and top risk drivers.
    """
    try:
        if not explainer:
            raise HTTPException(status_code=500, detail="Explainer not available")

        base_features = [
            "tx_count_24h",
            "total_value_24h",
            "largest_value_24h",
            "std_value_24h",
            "unique_counterparts_24h",
            "entropy_of_destinations",
            "share_of_daily_volume",
            "relative_max_vs_global",
        ]
        
        feature_dict = {f: getattr(features, f, 0) for f in base_features}
        X_live = pd.DataFrame([feature_dict])

        # Get SHAP values
        shap_values = explainer.shap_values(X_live[base_features])
        
        # Handle classification output (returns list [class0, class1])
        if isinstance(shap_values, list):
            shap_to_use = shap_values[1][0, :]  # Class 1 (high risk)
        else:
            shap_to_use = shap_values[0, :]

        # Build feature importance
        feature_importance = {
            name: float(abs(val))
            for name, val in zip(base_features, shap_to_use)
        }
        
        # Top 5 drivers
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        top_drivers = [
            {"feature": name, "impact": float(val), "value": float(getattr(features, name, 0))}
            for name, val in sorted_features[:5]
        ]

        # Generate narrative
        top_feature = sorted_features[0][0] if sorted_features else "unknown"
        narrative = (
            f"This wallet's risk profile is primarily driven by {top_feature}. "
            f"The model analyzed 8 behavioral features to generate this assessment. "
            f"Higher risk scores indicate more anomalous transaction patterns."
        )

        logger.info(f"💡 SHAP Explanation generated for {features.wallet_address}")

        explanation_data = {
            "wallet_address": features.wallet_address,
            "feature_importance": feature_importance,
            "top_risk_drivers": top_drivers,
            "narrative": narrative,
        }

        return AgentResponse(status="success", data=explanation_data)

    except Exception as e:
        logger.error(f"❌ Explanation failed: {e}")
        return AgentResponse(status="error", error=str(e))


@app.get("/metadata")
def metadata():
    """Return metadata about this agent"""
    return {
        "agent_name": "ai_model",
        "capabilities": ["predict", "explain", "health"],
        "version": "1.0.0",
        "description": "AI-powered risk assessment for Cardano wallets",
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
        "models": {
            "risk_model": "RandomForestClassifier",
            "anomaly_model": "IsolationForest",
            "explainability": "SHAP TreeExplainer"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8083, reload=True)
