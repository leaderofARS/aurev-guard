from fastapi import FastAPI, Request

app = FastAPI(title="Payment Agent", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ready", "service": "payment-agent", "version": "1.0.0"}

@app.post("/validate_settle")
async def validate_settle(req: Request):
    """
    Validates a settlement request.
    Expects JSON payload with 'transaction_id' and/or 'features'.
    """
    body = await req.json()
    tx_id = body.get("transaction_id", "unknown")
    features = body.get("features", {})

    # Example validation logic:
    amount = features.get("amount", 0)
    user_id = features.get("user_id", None)

    # Simple rule: approve if amount is positive and user_id exists
    if amount > 0 and user_id is not None:
        status = "valid"
    else:
        status = "invalid"

    return {
        "status": status,
        "payment_id": tx_id,
        "checked_features": features
    }