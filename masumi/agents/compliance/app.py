from fastapi import FastAPI, Request

app = FastAPI(title="Masumi Compliance Agent", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ready", "agent": "compliance", "version": "1.0.0"}

@app.post("/score_payment")
async def score_payment(req: Request):
    body = await req.json()
    features = body["features"]
    amount = float(features.get("amount", 0))
    risk = min(1.0, amount / 10_000_000.0)  # toy model
    explanation = {"top_features": [{"name":"amount","effect":risk}]}
    return {"status":"ok","data":{"risk_score":risk,"explanation":explanation}}