from fastapi import FastAPI, Request
from datetime import datetime
import hashlib, json

app = FastAPI(title="Masumi Payment Agent", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ready", "agent": "payment", "version": "1.0.0"}

def h(obj: dict) -> str:
    s = json.dumps(obj, sort_keys=True, separators=(",", ":"))
    return hashlib.blake2b(s.encode(), digest_size=16).hexdigest()

@app.post("/validate_settle")
async def validate_settle(req: Request):
    body = await req.json()
    payment = body["payment"]
    approved = payment.get("amount_lovelace", 0) <= 5_000_000  # approve if ≤ 5 ADA
    decision = {
        "id": "dec_" + payment["id"],
        "agent": "payment",
        "type": "settle",
        "subject_id": payment["id"],
        "input_json": {"payment": payment},
        "output_json": {"approved": approved},
        "risk_score": 0.05 if approved else 0.35,
        "explanation_json": {},
        "signature": "",
        "hash": h(payment),
        "created_at": datetime.utcnow().isoformat()+"Z"
    }
    return {"status":"ok","data":decision}