from fastapi import FastAPI, Request
import pandas as pd
import json
from pathlib import Path

app = FastAPI(title="Compliance Agent", version="1.0.0")

# --- Resolve data directory relative to this file ---
DATA_DIR = Path(__file__).resolve().parent.parent / "ai_model" / "data"

def safe_load_csv(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename
    try:
        return pd.read_csv(path)
    except FileNotFoundError:
        print(f"Warning: {filename} not found in {DATA_DIR}")
        return pd.DataFrame()

def safe_load_json(filename: str):
    path = DATA_DIR / filename
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filename} not found in {DATA_DIR}")
        return {}

# --- Load datasets safely ---
anomaly_df = safe_load_csv("anomaly_results.csv")
features_df = safe_load_csv("features.csv")
graph_df = safe_load_csv("graph_features.csv")
transactions = safe_load_json("transactions.json")

@app.get("/health")
def health():
    return {"status": "ready", "service": "compliance-agent", "version": "1.0.0"}

@app.post("/score")
async def score(req: Request):
    """
    Accepts JSON payload with 'features' or 'transaction_id'.
    Returns a compliance risk score based on simple rules + dataset lookups.
    """
    body = await req.json()
    tx_id = body.get("transaction_id")
    input_features = body.get("features", {})

    result = {}

    # --- Multi-level rule-based risk scoring ---
    amount = input_features.get("amount", 0)
    if amount < 1_000:
        result["risk_score"] = 0  # very low risk
    elif amount < 10_000:
        result["risk_score"] = 1  # low risk
    elif amount < 100_000:
        result["risk_score"] = 2  # medium risk
    elif amount < 1_000_000:
        result["risk_score"] = 3  # high risk
    else:
        result["risk_score"] = 4  # very high risk

    # --- Anomaly lookup ---
    if tx_id and not anomaly_df.empty and "transaction_id" in anomaly_df.columns:
        match = anomaly_df[anomaly_df["transaction_id"] == tx_id]
        if not match.empty:
            result["anomaly_info"] = match.iloc[0].to_dict()

    # --- Graph features lookup ---
    if tx_id and not graph_df.empty and "transaction_id" in graph_df.columns:
        match = graph_df[graph_df["transaction_id"] == tx_id]
        if not match.empty:
            result["graph_features"] = match.iloc[0].to_dict()

    return {"compliance_result": result, "input": body}