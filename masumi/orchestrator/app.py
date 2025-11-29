import yaml
import httpx
import logging
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime

# ✅ Import AgentRegistry and AgentDescriptor from registry
from .registry import AgentRegistry, AgentDescriptor
# ✅ Router logic
from .router import route_request
# ✅ Relative import for correlation_id
from ..common.typing import correlation_id
# ✅ Import training config
from .ai_training_params import AITrainingConfig
# ✅ Import fetch_data router from sibling file
from . import fetch_data

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI app ---
app = FastAPI(title="Masumi Orchestrator", version="1.0.0")
registry = AgentRegistry()

# --- Load config ---
def load_config(path: Path = None) -> Dict[str, Any]:
    """Load agent configuration from YAML file."""
    if path is None:
        # Always resolve relative to this file's directory
        path = Path(__file__).parent / "config.yaml"
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

@app.on_event("startup")
def seed_agents():
    """Register agents from config.yaml at startup."""
    cfg = load_config()
    for a in cfg.get("agents", []):
        registry.register(AgentDescriptor(**a))
    logger.info(f"✅ Registered {len(registry.list())} agents")

# --- Health endpoint for orchestrator ---
@app.get("/masumi/health")
def orchestrator_health():
    """Health check for orchestrator"""
    return {
        "status": "ready",
        "service": "masumi-orchestrator",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "agents_registered": len(registry.list()),
    }

# --- List all agents ---
@app.get("/masumi/agents")
def list_agents():
    """List all registered agents with capabilities"""
    return {
        "agents": [agent.to_dict() for agent in registry.list()],
        "total": len(registry.list()),
    }

# --- Get agent details ---
@app.get("/masumi/agents/{name}")
def get_agent_details(name: str):
    """Get detailed information about a specific agent"""
    try:
        agent = registry.get(name)
        return agent.to_dict()
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Agent '{name}' not found")

# --- Proxy health check to specific agent ---
@app.get("/masumi/agents/{name}/health")
def agent_health(name: str):
    """Check health of a specific agent"""
    try:
        agent = registry.get(name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    headers = {"X-Correlation-ID": correlation_id(), "X-Agent-Version": agent.version}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{agent.endpoint}/health", headers=headers)
        resp.raise_for_status()
        data = resp.json()
        data["_meta"] = {
            "endpoint": agent.endpoint,
            "version": agent.version,
            "enabled": agent.enabled,
        }
        return data
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Agent health unreachable: {e}")

# --- Route workflow requests ---
@app.post("/masumi/route")
async def route(req: Request):
    """
    Route workflow requests to appropriate agents.
    Supported workflows:
    - settle: Payment settlement with risk assessment
    - ai_predict: AI prediction only
    - ai_train: Initialize training pipeline
    - ai_train_run: Execute training pipeline
    - ai_config: Get/update training config
    - data_quality: Assess data quality
    """
    try:
        body = await req.json()
        return route_request(registry, body)
    except Exception as e:
        logger.error(f"Routing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- AI Training Configuration Endpoints ---

@app.get("/masumi/training/config")
def get_training_config():
    """Get complete AI training configuration"""
    try:
        config = AITrainingConfig(
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        return {
            "status": "success",
            "config": config.to_dict(),
            "config_version": config.config_version,
        }
    except Exception as e:
        logger.error(f"Failed to get config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/masumi/training/config/apply")
def apply_training_config(config_dict: Dict[str, Any]):
    """
    Apply training configuration to AI model agent
    """
    try:
        # Validate config
        config = AITrainingConfig(
            **config_dict,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Forward to AI model agent
        payload = {
            "workflow": "ai_config",
            "payload": {
                "config": config.to_dict(),
            }
        }
        
        result = route_request(registry, payload)
        return {
            "status": "applied",
            "config_version": config.config_version,
            "result": result,
        }
    except Exception as e:
        logger.error(f"Failed to apply config: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/masumi/training/config/defaults")
def get_default_config():
    """Get default AI training configuration"""
    config = AITrainingConfig(
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    return config.to_dict()

# --- Training Pipeline Management ---

@app.post("/masumi/training/initialize")
async def initialize_training(config: Optional[Dict[str, Any]] = None):
    """Initialize a new training pipeline"""
    payload = {
        "workflow": "ai_train",
        "payload": {
            "pipeline_name": "aurev-guard-training",
            "config": config or {},
        }
    }
    return route_request(registry, payload)

@app.post("/masumi/training/run/{pipeline_id}")
async def run_training(pipeline_id: str, background_tasks: BackgroundTasks):
    """Run a training pipeline"""
    payload = {
        "workflow": "ai_train_run",
        "payload": {
            "pipeline_id": pipeline_id,
        }
    }
    return route_request(registry, payload)

@app.get("/masumi/training/pipeline/{pipeline_id}")
async def get_pipeline_status(pipeline_id: str):
    """Get status of a training pipeline"""
    payload = {
        "workflow": "ai_train_run",
        "payload": {
            "pipeline_id": pipeline_id,
            "action": "status",
        }
    }
    return route_request(registry, payload)

# --- AI Prediction Endpoints ---

@app.post("/masumi/predict")
async def predict_risk(
    wallet_address: str,
    features: Dict[str, Any],
    transaction_id: Optional[str] = None,
    include_explanation: bool = True,
    include_shap: bool = True,
):
    """
    Get AI prediction for a wallet/transaction
    """
    payload = {
        "workflow": "ai_predict",
        "payload": {
            "wallet_address": wallet_address,
            "transaction_id": transaction_id,
            "features": features,
            "include_explanation": include_explanation,
            "include_shap": include_shap,
        }
    }
    return route_request(registry, payload)

# --- Data Quality Assessment ---

@app.post("/masumi/data/quality")
async def assess_data_quality(data: Dict[str, Any]):
    """Assess quality of data for training"""
    payload = {
        "workflow": "data_quality",
        "payload": data,
    }
    return route_request(registry, payload)

# --- Orchestrator Statistics ---

@app.get("/masumi/stats")
def get_orchestrator_stats():
    """Get orchestrator statistics"""
    cfg = load_config()
    return {
        "total_agents": len(registry.list()),
        "agents": [
            {
                "name": agent.name,
                "endpoint": agent.endpoint,
                "capabilities": agent.capabilities,
                "version": agent.version,
                "enabled": agent.enabled,
            }
            for agent in registry.list()
        ],
        "workflows_configured": list(cfg.get("workflows", {}).keys()),
        "training_enabled": cfg.get("training", {}).get("enabled", False),
    }

# --- Include fetch_data router ---
app.include_router(fetch_data.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)
