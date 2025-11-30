from typing import Dict, Any, List, Optional
import httpx
from fastapi import HTTPException
import logging

from .registry import AgentRegistry
from .ai_training_params import AITrainingConfig
from ..common.typing import correlation_id

logger = logging.getLogger(__name__)


def call_agent(registry: AgentRegistry, agent_name: str, capability: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper to call a registered agent by name and capability.
    Includes correlation tracking and error handling.
    """
    try:
        agent = registry.get(agent_name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    headers = {
        "X-Correlation-ID": correlation_id(),
        "X-Agent-Version": agent.version,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(f"{agent.endpoint}/{capability}", json=payload, headers=headers)
        resp.raise_for_status()
        return {
            "agent": agent.name,
            "capability": capability,
            "status": "success",
            "response": resp.json(),
        }
    except httpx.HTTPError as e:
        logger.error(f"Agent '{agent_name}' call failed: {e}")
        return {
            "agent": agent.name,
            "capability": capability,
            "status": "error",
            "error": str(e),
        }


def route_request(registry: AgentRegistry, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrator routing logic: decides which agents to call for a workflow.
    Supports payment settlement, AI training, and predictions.
    """
    workflow = body.get("workflow")
    payload = body.get("payload", {})
    steps: List[Dict[str, Any]] = []

    if workflow == "settle":
        # Workflow: Payment Settlement with Risk Scoring
        # Step 1: AI model prediction (risk assessment)
        ai_step = call_agent(registry, "ai_model", "predict", {
            "wallet_address": payload.get("wallet_address"),
            "transaction_id": payload.get("transaction_id"),
            "features": payload.get("features", {}),
            "include_explanation": True,
            "include_shap": True,
        })
        steps.append(ai_step)

        # Extract risk score
        risk_score = None
        if ai_step.get("status") == "success":
            risk_score = ai_step.get("response", {}).get("risk_score")

        # Step 2: Compliance scoring (conditional on risk)
        if risk_score is None or risk_score > 0.5:
            compliance_step = call_agent(registry, "compliance", "score_payment", payload)
            steps.append(compliance_step)

        # Step 3: Payment validation
        payment_step = call_agent(registry, "payment", "validate_settle", payload)
        steps.append(payment_step)

        # Final decision
        all_successful = all(step.get("status") == "success" for step in steps)
        final_decision = {
            "approved": all_successful,
            "workflow": workflow,
            "subject_id": body.get("subject_id"),
            "actor_roles": body.get("actor_roles", []),
            "risk_score": risk_score,
            "steps_completed": len([s for s in steps if s.get("status") == "success"]),
        }
        
        return {
            "steps": steps,
            "final_decision": final_decision,
            "correlation_id": body.get("correlation_id"),
        }

    elif workflow == "ai_predict":
        # Workflow: AI Prediction Only (Anomaly Detection + Risk Scoring)
        ai_step = call_agent(registry, "ai_model", "predict", {
            "wallet_address": payload.get("wallet_address"),
            "transaction_id": payload.get("transaction_id"),
            "features": payload.get("features", {}),
            "include_explanation": payload.get("include_explanation", True),
            "include_shap": payload.get("include_shap", True),
        })
        steps.append(ai_step)

        return {
            "workflow": workflow,
            "prediction": ai_step.get("response"),
            "status": ai_step.get("status"),
            "correlation_id": body.get("correlation_id"),
        }

    elif workflow == "ai_train":
        # Workflow: AI Model Training Pipeline
        # Initialize training pipeline with all parameters
        config_dict = payload.get("config")
        ai_step = call_agent(registry, "ai_model", "train/initialize", {
            "pipeline_name": payload.get("pipeline_name", "aurev-guard-training"),
            "config": config_dict,
        })
        steps.append(ai_step)

        return {
            "workflow": workflow,
            "training_initialization": ai_step.get("response"),
            "status": ai_step.get("status"),
            "correlation_id": body.get("correlation_id"),
        }

    elif workflow == "ai_train_run":
        # Workflow: Run AI Training Pipeline
        pipeline_id = payload.get("pipeline_id")
        if not pipeline_id:
            raise HTTPException(status_code=400, detail="pipeline_id required for ai_train_run")

        ai_step = call_agent(registry, "ai_model", f"train/run/{pipeline_id}", payload)
        steps.append(ai_step)

        return {
            "workflow": workflow,
            "pipeline_id": pipeline_id,
            "status": ai_step.get("status"),
            "correlation_id": body.get("correlation_id"),
        }

    elif workflow == "ai_config":
        # Workflow: Get/Update AI Training Configuration
        ai_step = call_agent(registry, "ai_model", "config/training", payload)
        steps.append(ai_step)

        return {
            "workflow": workflow,
            "config": ai_step.get("response"),
            "status": ai_step.get("status"),
            "correlation_id": body.get("correlation_id"),
        }

    elif workflow == "data_quality":
        # Workflow: Assess data quality
        ai_step = call_agent(registry, "ai_model", "data/quality", payload)
        steps.append(ai_step)

        return {
            "workflow": workflow,
            "quality_assessment": ai_step.get("response"),
            "status": ai_step.get("status"),
            "correlation_id": body.get("correlation_id"),
        }

    else:
        logger.warning(f"Unknown workflow: {workflow}")
        raise HTTPException(status_code=400, detail=f"Unknown workflow: {workflow}. Supported: settle, ai_predict, ai_train, ai_train_run, ai_config, data_quality")