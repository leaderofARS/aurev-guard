import httpx, time
from .policies import apply_policies
from .registry import AgentRegistry
from ..common.typing import correlation_id
def call_agent(registry: AgentRegistry, name: str, capability: str, body: dict, corr: str):
    agent = registry.get(name)
    if not agent.enabled:
        return {"status": "error", "error": {"code":"AGENT_DISABLED","message":name}}
    url = f'{agent.endpoint}/{capability}'
    headers = {"X-Correlation-ID": corr, "X-Agent-Version": agent.version}
    start = time.time()
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, json=body, headers=headers)
    env = resp.json()
    env["metrics"] = (env.get("metrics") or {}) | {"latency_ms": int((time.time()-start)*1000), "agent_version": agent.version}
    return env

def route_request(registry: AgentRegistry, req: dict):
    corr = req.get("correlation_id") or correlation_id()
    steps = []

    policy = apply_policies({
        "workflow": req["workflow"],
        "actor_roles": req.get("actor_roles", []),
        "risk_score": req.get("payload", {}).get("risk_score"),
    })
    if not policy.get("allowed", False):
        return {"status":"error","error":policy.get("reason","policy_denied"),"steps":steps}

    if req["workflow"] == "settle":
        # Optional compliance
        if "compliance:score_payment" in policy.get("required_steps", []):
            env = call_agent(registry, "compliance", "score_payment", {"features": req["payload"]["features"]}, corr)
            steps.append({"step":"compliance:score_payment","status":env["status"]})
            if env["status"] != "ok":
                return {"status":"error","steps":steps,"error":"compliance_failed"}
            req["payload"]["risk_score"] = env["data"]["risk_score"]

        # Validate settle → Decision
        env = call_agent(registry, "payment", "validate_settle", {"payment": req["payload"]["payment"], "policy": {}}, corr)
        steps.append({"step":"payment:validate_settle","status":env["status"]})
        if env["status"] != "ok":
            return {"status":"error","steps":steps,"error":"payment_validation_failed"}
        return {"status":"ok","steps":steps,"final_decision":env["data"]}

    return {"status":"error","error":"unknown_workflow","steps":steps}