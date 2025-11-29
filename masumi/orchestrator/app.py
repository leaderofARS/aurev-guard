import yaml
import httpx
from fastapi import FastAPI, HTTPException, Request
from typing import Dict, Any

# ✅ Import AgentRegistry and AgentDescriptor from registry
from .registry import AgentRegistry, AgentDescriptor
# ✅ Router logic
from .router import route_request
# ✅ Relative import for correlation_id
from ..common.typing import correlation_id

# --- FastAPI app ---
app = FastAPI(title="Masumi Orchestrator", version="1.0.0")
registry = AgentRegistry()

# --- Load config ---
def load_config(path: str = "masumi/orchestrator/config.yaml") -> Dict[str, Any]:    
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

@app.on_event("startup")
def seed_agents():
    """Register agents from config.yaml at startup."""
    cfg = load_config()
    for a in cfg.get("agents", []):
        registry.register(AgentDescriptor(**a))

# --- Health endpoint for orchestrator ---
@app.get("/masumi/health")
def orchestrator_health():
    return {"status": "ready", "service": "masumi-orchestrator", "version": "1.0.0"}

# --- List all agents ---
@app.get("/masumi/agents")
def list_agents():
    return [agent.model_dump() for agent in registry.list()]

# --- Proxy health check to specific agent ---
@app.get("/masumi/agents/{name}/health")
def agent_health(name: str):
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
    body = await req.json()
    return route_request(registry, body)