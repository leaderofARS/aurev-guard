from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, List
import random

app = FastAPI(title="AUREV Guard AI Agent (stub)")

class PredictRequest(BaseModel):
    wallet_address: str
    features: Dict[str, Any] = {}
    include_explanation: bool = True
    include_shap: bool = False

@app.post('/predict')
async def predict(req: PredictRequest):
    # simple mock response
    risk = random.random()
    anomaly = random.random()
    resp = {
        "risk_score": risk,
        "risk_label": 'HIGH' if risk > 0.7 else ('MEDIUM' if risk > 0.4 else 'LOW'),
        "anomaly_score": anomaly,
        "is_anomaly": anomaly > 0.8,
        "confidence": 0.6 + random.random() * 0.4,
    }
    if req.include_explanation:
        fi = {k: abs(random.random()) for k in (req.features.keys() or ['tx_count_24h','total_value_24h','entropy_of_destinations'])}
        top = sorted(fi.items(), key=lambda x: -x[1])[:5]
        resp['explanation'] = {
            'feature_importance': fi,
            'top_risk_drivers': [{'feature': k, 'importance': v} for k,v in top],
            'narrative': f"Mock explanation for {req.wallet_address}."
        }
    return {"status":"success","data":resp}

@app.post('/explain')
async def explain(req: PredictRequest):
    # return explanation only
    fi = {k: abs(random.random()) for k in (req.features.keys() or ['tx_count_24h','total_value_24h','entropy_of_destinations'])}
    top = sorted(fi.items(), key=lambda x: -x[1])[:5]
    return {"status":"success","data":{
        'feature_importance': fi,
        'top_risk_drivers': [{'feature': k, 'importance': v} for k,v in top],
        'narrative': f"Mock explanation for {req.wallet_address}."
    }}

@app.get('/health')
async def health():
    return {"status":"ok"}

@app.get('/metadata')
async def metadata():
    return {
        'agent_name': 'ai_model',
        'capabilities': ['predict','explain','health'],
        'version': 'stub-0.1'
    }
