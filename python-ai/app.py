from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import hashlib

app = FastAPI(title="AUREV Guard AI Stub")


class AiRequest(BaseModel):
    address: str


class AiResponse(BaseModel):
    address: str
    riskScore: int
    riskLevel: str
    explanation: str
    features: dict
    modelHash: str
    timestamp: str


def deterministic_score(address: str) -> int:
    """Deterministic scoring based on address hash"""
    h = hashlib.sha256(address.encode('utf-8')).hexdigest()
    val = int(h[:8], 16)
    return val % 101


def score_to_level(score: int) -> str:
    if score >= 67:
        return "HIGH"
    if score >= 34:
        return "MEDIUM"
    return "LOW"


def generate_features(address: str, score: int) -> dict:
    """Generate sample features for explainability"""
    h = hashlib.md5(address.encode('utf-8')).hexdigest()
    
    return {
        "velocity": round((int(h[:4], 16) % 100) / 100, 2),
        "tx_count_24h": int(h[4:6], 16) % 50,
        "avg_tx_size": int(h[6:8], 16) % 1000,
        "unique_counterparties": int(h[8:10], 16) % 20,
        "risk_pattern_match": score > 50
    }


def generate_explanation(score: int, level: str, features: dict) -> str:
    """Generate human-readable explanation"""
    if level == "HIGH":
        return f"High transfer velocity ({features['velocity']}) detected with {features['tx_count_24h']} transactions in 24h"
    elif level == "MEDIUM":
        return f"Moderate activity pattern: {features['tx_count_24h']} transactions, velocity {features['velocity']}"
    else:
        return f"Low risk profile: normal transaction patterns observed"


@app.post("/ai/score", response_model=AiResponse)
def ai_score(req: AiRequest):
    if not req.address:
        raise HTTPException(status_code=400, detail="address is required")

    score = deterministic_score(req.address)
    level = score_to_level(score)
    features = generate_features(req.address, score)
    explanation = generate_explanation(score, level, features)
    
    # Generate model hash with current date
    model_version = datetime.utcnow().strftime("%Y-%m-%d")
    model_hash = f"model-v1-{model_version}"
    
    return AiResponse(
        address=req.address,
        riskScore=score,
        riskLevel=level,
        explanation=explanation,
        features=features,
        modelHash=model_hash,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "AUREV AI Stub",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }