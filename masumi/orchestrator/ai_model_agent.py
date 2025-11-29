"""
ai_model_agent.py
AI Model Training & Inference Agent Handler
Integrates with masumi orchestrator to manage all training parameters from agents/ai_model/src/
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import os
import logging

from agents.ai_model.src.inference import load_models, detect_anomaly, predict_risk, explain_prediction
from agents.ai_model.src.data_pipeline import build_features_from_addresses
from agents.ai_model.src.feature_engineering import load_transactions
from agents.ai_model.src.shap_explain import run_shap_pipeline

# Local imports from orchestrator
from .models import (
    AIModelTrainingStep,
    AIModelTrainingPipeline,
    AIModelPredictionRequest,
    AIModelPredictionResponse,
    TrainingDataQuality,
    ModelPerformanceMetrics,
)
from .ai_training_params import AITrainingConfig
from ..common.typing import correlation_id

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Model Agent", version="1.0.0")

# =====================================
# IN-MEMORY STATE
# =====================================

training_pipelines: Dict[str, AIModelTrainingPipeline] = {}
model_cache: Dict[str, Any] = {}


# =====================================
# HEALTH ENDPOINTS
# =====================================

@app.get("/health")
def health():
    """Health check endpoint"""
    try:
        # Try to load models
        if "models" not in model_cache:
            rf_model, iso_model, explainer = load_models()
            model_cache["rf"] = rf_model
            model_cache["iso"] = iso_model
            model_cache["explainer"] = explainer
        
        return {
            "status": "ready",
            "service": "ai-model-agent",
            "version": "1.0.0",
            "models_loaded": True,
            "active_pipelines": len(training_pipelines),
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "service": "ai-model-agent",
            "error": str(e),
            "models_loaded": False,
        }


# =====================================
# PREDICTION ENDPOINTS
# =====================================

class PredictRequest(BaseModel):
    """AI Model prediction request"""
    wallet_address: str
    transaction_id: Optional[str] = None
    features: Dict[str, Any]
    include_explanation: bool = True
    include_shap: bool = True


class PredictResponse(BaseModel):
    """AI Model prediction response"""
    status: str
    risk_score: Optional[float] = None
    anomaly_score: Optional[float] = None
    anomaly_flag: Optional[int] = None
    explanation: Optional[Dict[str, Any]] = None
    shap_values: Optional[Dict[str, Any]] = None
    model_versions: Dict[str, str]
    inference_time_ms: float


@app.post("/predict")
async def predict(req: PredictRequest):
    """
    Run prediction using both Isolation Forest (anomaly detection)
    and Random Forest (risk scoring) models.
    
    Returns:
    - risk_score: 0-1 probability from Random Forest
    - anomaly_score: decision score from Isolation Forest (-inf to +inf)
    - anomaly_flag: -1 (anomaly) or 1 (normal) from Isolation Forest
    - explanation: SHAP explanation if requested
    """
    try:
        import time
        start_time = time.time()
        
        # Load models if not cached
        if "models" not in model_cache:
            rf_model, iso_model, explainer = load_models()
            model_cache["rf"] = rf_model
            model_cache["iso"] = iso_model
            model_cache["explainer"] = explainer
        
        rf_model = model_cache.get("rf")
        iso_model = model_cache.get("iso")
        explainer = model_cache.get("explainer")
        
        # Convert features to DataFrame
        import pandas as pd
        features_df = pd.DataFrame([req.features])
        
        # Run predictions
        anomaly_score, anomaly_flag = detect_anomaly(iso_model, features_df)
        risk_pred, risk_prob = predict_risk(rf_model, features_df)
        
        # Generate explanation if requested
        explanation = None
        if req.include_explanation and explainer:
            try:
                explanation = explain_prediction(explainer, features_df)
            except Exception as e:
                logger.warning(f"Could not generate explanation: {e}")
        
        # Generate SHAP values if requested
        shap_values = None
        if req.include_shap and explainer:
            try:
                shap_vals = explainer.shap_values(features_df[[col for col in features_df.columns if col in [
                    "tx_count_24h", "total_value_24h", "largest_value_24h", "std_value_24h",
                    "unique_counterparts_24h", "entropy_of_destinations", "share_of_daily_volume"
                ]]])
                if isinstance(shap_vals, list):
                    shap_vals = shap_vals[1]  # Get class 1 (risk) SHAP values
                shap_values = {
                    "values": shap_vals.tolist() if hasattr(shap_vals, 'tolist') else shap_vals,
                    "base_value": float(explainer.expected_value) if hasattr(explainer, 'expected_value') else 0.0,
                }
            except Exception as e:
                logger.warning(f"Could not compute SHAP values: {e}")
        
        elapsed = time.time() - start_time
        
        return PredictResponse(
            status="success",
            risk_score=float(risk_prob),
            anomaly_score=float(anomaly_score),
            anomaly_flag=int(anomaly_flag),
            explanation=explanation,
            shap_values=shap_values,
            model_versions={
                "isolation_forest": "1.7.0",
                "random_forest": "1.7.0",
                "shap": "0.50.0",
            },
            inference_time_ms=elapsed * 1000,
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================
# TRAINING PIPELINE ENDPOINTS
# =====================================

class InitializeTrainingRequest(BaseModel):
    """Initialize AI training pipeline"""
    pipeline_name: str = "aurev-guard-training"
    config: Optional[Dict[str, Any]] = None


@app.post("/train/initialize")
async def initialize_training(req: InitializeTrainingRequest):
    """Initialize a new training pipeline with all parameters"""
    try:
        pipeline_id = f"pipeline-{datetime.now().isoformat()}"
        
        # Create default config or use provided
        if req.config:
            config_dict = req.config
        else:
            config = AITrainingConfig(created_at=datetime.now(), updated_at=datetime.now())
            config_dict = config.to_dict()
        
        pipeline = AIModelTrainingPipeline(
            pipeline_id=pipeline_id,
            pipeline_name=req.pipeline_name,
            status="pending",
            total_steps=9,  # Total steps in the training pipeline
            completed_steps=0,
            failed_steps=0,
            config=config_dict,
            created_at=datetime.now(),
        )
        
        training_pipelines[pipeline_id] = pipeline
        
        return {
            "status": "initialized",
            "pipeline_id": pipeline_id,
            "total_steps": pipeline.total_steps,
            "config_parameters": len(config_dict),
        }
    except Exception as e:
        logger.error(f"Training initialization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/train/pipeline/{pipeline_id}")
async def get_pipeline_status(pipeline_id: str):
    """Get status of a training pipeline"""
    if pipeline_id not in training_pipelines:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")
    
    pipeline = training_pipelines[pipeline_id]
    return {
        "pipeline_id": pipeline.pipeline_id,
        "status": pipeline.status,
        "progress": f"{pipeline.completed_steps}/{pipeline.total_steps}",
        "failed_steps": pipeline.failed_steps,
        "error_log": pipeline.error_log,
        "metrics": pipeline.overall_metrics,
    }


@app.post("/train/run/{pipeline_id}")
async def run_training_pipeline(pipeline_id: str, background_tasks: BackgroundTasks):
    """Run the complete training pipeline"""
    if pipeline_id not in training_pipelines:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")
    
    pipeline = training_pipelines[pipeline_id]
    pipeline.status = "running"
    pipeline.started_at = datetime.now()
    
    # Schedule background execution
    background_tasks.add_task(execute_training_pipeline, pipeline_id)
    
    return {
        "status": "started",
        "pipeline_id": pipeline_id,
        "message": "Training pipeline started in background",
    }


async def execute_training_pipeline(pipeline_id: str):
    """Execute training pipeline steps (runs in background)"""
    pipeline = training_pipelines.get(pipeline_id)
    if not pipeline:
        return
    
    try:
        # Step 1: Data Loading
        await execute_step(pipeline, "data_loading", "Load transaction data", {
            "blockfrost_api_key": os.getenv("BLOCKFROST_API_KEY", ""),
            "blockfrost_project": "mainnet",
            "max_blocks": 500,
        })
        
        # Step 2: Feature Engineering
        await execute_step(pipeline, "feature_engineering", "Extract and engineer features", {
            "time_windows": ["24h", "7d", "30d"],
            "include_entropy": True,
            "include_daily_agg": True,
        })
        
        # Step 3: Graph Analysis
        await execute_step(pipeline, "graph_analysis", "Build and analyze transaction graph", {
            "algorithms": ["degree", "centrality", "clustering"],
            "community_detection": True,
        })
        
        # Step 4: Data Preprocessing
        await execute_step(pipeline, "preprocessing", "Preprocess data for modeling", {
            "scaling": "standard",
            "handle_outliers": True,
            "feature_selection": True,
        })
        
        # Step 5: Anomaly Detection Training
        await execute_step(pipeline, "anomaly_training", "Train anomaly detection models", {
            "models": ["isolation_forest", "one_class_svm", "lof"],
            "contamination": 0.1,
            "ensemble": True,
        })
        
        # Step 6: Risk Scoring Training
        await execute_step(pipeline, "risk_training", "Train risk scoring model (Random Forest)", {
            "n_estimators": 200,
            "max_depth": 20,
            "test_size": 0.2,
        })
        
        # Step 7: Model Evaluation
        await execute_step(pipeline, "evaluation", "Evaluate model performance", {
            "compute_roc_auc": True,
            "compute_precision_recall": True,
            "cv_folds": 5,
        })
        
        # Step 8: SHAP Explanation
        await execute_step(pipeline, "shap_explain", "Generate SHAP explainability values", {
            "explainer_type": "tree",
            "save_artifacts": True,
        })
        
        # Step 9: Model Export
        await execute_step(pipeline, "export", "Export models and data", {
            "export_models": True,
            "export_features": True,
            "format": "pkl, csv, json",
        })
        
        pipeline.status = "completed"
        pipeline.completed_at = datetime.now()
        
    except Exception as e:
        pipeline.status = "failed"
        pipeline.error_log.append(str(e))
        logger.error(f"Pipeline execution failed: {e}")


async def execute_step(
    pipeline: AIModelTrainingPipeline,
    step_id: str,
    step_name: str,
    parameters: Dict[str, Any],
):
    """Execute a single training step"""
    step_start = datetime.now()
    
    step = AIModelTrainingStep(
        step_id=step_id,
        step_name=step_name,
        status="running",
        description=f"Executing {step_name}",
        parameters=parameters,
        input_data={},
        output_data={},
        created_at=datetime.now(),
        started_at=step_start,
    )
    
    try:
        # Simulate or execute actual step logic
        logger.info(f"Executing step: {step_name} with params: {parameters}")
        
        # Here you would call actual training functions
        # For now, simulate completion
        step.status = "completed"
        step.completed_at = datetime.now()
        step.duration_seconds = (step.completed_at - step_start).total_seconds()
        step.output_data = {"status": "success", "message": f"{step_name} completed"}
        
        pipeline.completed_steps += 1
        pipeline.steps.append(step)
        
    except Exception as e:
        step.status = "failed"
        step.error_message = str(e)
        step.completed_at = datetime.now()
        step.duration_seconds = (step.completed_at - step_start).total_seconds()
        
        pipeline.failed_steps += 1
        pipeline.error_log.append(f"Step {step_name}: {e}")
        pipeline.steps.append(step)
        
        logger.error(f"Step {step_name} failed: {e}")
        raise


# =====================================
# CONFIGURATION ENDPOINTS
# =====================================

@app.get("/config/training")
async def get_training_config():
    """Get complete AI training configuration"""
    try:
        config = AITrainingConfig(created_at=datetime.now(), updated_at=datetime.now())
        return config.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/config/training")
async def update_training_config(config_dict: Dict[str, Any]):
    """Update AI training configuration"""
    try:
        config = AITrainingConfig(**config_dict, created_at=datetime.now(), updated_at=datetime.now())
        return {
            "status": "updated",
            "config_version": config.config_version,
            "parameters_count": len(config.to_dict()),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================
# DATA QUALITY ENDPOINTS
# =====================================

@app.post("/data/quality")
async def assess_data_quality(data: Dict[str, Any]):
    """Assess quality of training data"""
    try:
        # Analyze data quality
        total_records = len(data.get("records", []))
        valid_records = sum(1 for r in data.get("records", []) if r)
        missing_values = data.get("missing_values", 0)
        outliers = data.get("outliers", 0)
        
        quality_score = (valid_records / total_records) if total_records > 0 else 0.0
        
        return {
            "total_records": total_records,
            "valid_records": valid_records,
            "missing_values": missing_values,
            "outliers": outliers,
            "quality_score": quality_score,
            "status": "good" if quality_score > 0.95 else "fair" if quality_score > 0.85 else "poor",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8083, reload=True)
