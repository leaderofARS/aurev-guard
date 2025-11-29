# orchestrator/models.py
from pydantic import BaseModel
from typing import Any, Optional, List, Dict
from datetime import datetime

class Envelope(BaseModel):
    status: str  # "ok" | "error"
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

class Decision(BaseModel):
    id: str
    agent: str
    type: str           # "settle" | "refund" | "create" | "update"
    subject_id: str
    input_json: Dict[str, Any]
    output_json: Dict[str, Any]
    risk_score: Optional[float] = None
    explanation_json: Optional[Dict[str, Any]] = None
    signature: str
    hash: str
    anchored_txid: Optional[str] = None
    created_at: datetime