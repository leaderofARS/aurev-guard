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


# =====================================
# AI MODEL TRAINING STEP MODELS
# =====================================

class AIModelTrainingStep(BaseModel):
    """Single training step in the AI pipeline"""
    step_id: str
    step_name: str
    status: str  # "pending" | "running" | "completed" | "failed"
    description: str
    parameters: Dict[str, Any]
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AIModelTrainingPipeline(BaseModel):
    """Complete AI model training pipeline execution"""
    pipeline_id: str
    pipeline_name: str
    status: str  # "pending" | "running" | "completed" | "failed" | "partial"
    total_steps: int
    completed_steps: int
    failed_steps: int
    config: Dict[str, Any]  # Complete AITrainingConfig
    steps: List[AIModelTrainingStep] = []
    overall_metrics: Optional[Dict[str, Any]] = None
    error_log: List[str] = []
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AIModelPredictionRequest(BaseModel):
    """Request for AI model prediction"""
    request_id: str
    wallet_address: str
    transaction_id: Optional[str] = None
    features: Dict[str, Any]
    include_explanation: bool = True
    include_shap: bool = True
    created_at: datetime


class AIModelPredictionResponse(BaseModel):
    """Response from AI model prediction"""
    request_id: str
    status: str  # "success" | "error"
    prediction: Dict[str, Any]
    risk_score: Optional[float] = None
    anomaly_score: Optional[float] = None
    anomaly_flag: Optional[int] = None  # -1: anomaly, 1: normal
    explanation: Optional[Dict[str, Any]] = None
    shap_values: Optional[Dict[str, Any]] = None
    model_version: str
    inference_time_ms: float
    created_at: datetime


class TrainingDataQuality(BaseModel):
    """Data quality metrics"""
    total_records: int
    valid_records: int
    missing_values: int
    outliers_detected: int
    duplicate_records: int
    date_range: Dict[str, str]
    feature_count: int
    quality_score: float  # 0-1


class ModelPerformanceMetrics(BaseModel):
    """Model performance metrics"""
    model_type: str  # "isolation_forest" | "random_forest" | "ensemble"
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    confusion_matrix: Optional[Dict[str, Any]] = None
    feature_importance: Optional[Dict[str, float]] = None
    training_samples: int
    validation_samples: int
    test_samples: int
    training_time_seconds: float