def apply_policies(ctx: dict) -> dict:
    wf = ctx["workflow"]
    roles = set(ctx.get("actor_roles", []))
    risk = ctx.get("risk_score")

    if wf == "settle":
        # Require compliance scoring if risk unknown or high
        if risk is None or risk > 0.2:
            return {"allowed": True, "required_steps": ["compliance:score_payment"]}
        return {"allowed": True, "required_steps": []}

    if wf == "refund":
        return {"allowed": "analyst" in roles or "admin" in roles, "required_steps": []}

    if wf in ("create", "update"):
        return {"allowed": True, "required_steps": []}

    return {"allowed": False, "reason": "Unknown workflow"}