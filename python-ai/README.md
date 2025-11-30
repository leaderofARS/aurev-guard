Python AI stub for AUREV Guard

Start the AI stub (FastAPI + Uvicorn):

```bash
cd python-ai
python -m pip install -r requirements.txt
uvicorn app:app --port 5000
```

Endpoint:
- POST /ai/score
  - body: { "address": "addr..." }
  - response: { address, riskScore, riskLevel, explanation, modelHash, timestamp }

This service is deterministic and safe for demos.
