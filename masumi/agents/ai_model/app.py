from fastapi import FastAPI, Request
import pandas as pd
import json
import os

app = FastAPI(title="AI Model Agent", version="1.0.0")

# --- Paths ---
DATA_DIR = os.path.join("aurevguard", "agents", "ai_model", "data")

# --- Load datasets ---
try:
    anomaly_df = pd.read_csv(os.path.join(DATA_DIR, "anomaly_results.csv"))
    daily_df = pd.read_csv(os.path.join(DATA_DIR, "daily_features.csv"))
    features_df = pd.read_csv(os.path.join(DATA_DIR, "features.csv"))
    graph_df = pd.read_csv(os.path.join(DATA_DIR, "graph_features.csv"))
    io_cache_df = pd.read_csv(os.path.join(DATA_DIR, "io_cache.csv"))
    with open(os.path.join(DATA_DIR, "transactions.json"), "r") as f:
        transactions = json.load(f)
except Exception as e:
    print(f"Error loading data: {e}")
    anomaly_df = pd.DataFrame()
    daily_df = pd.DataFrame()
    features_df = pd.DataFrame()
    graph_df = pd.DataFrame()
    io_cache_df = pd.DataFrame()
    transactions = {}

# --- Health endpoint ---
@app.get("/health")
def health():
    return {"status": "ready", "service": "ai-model-agent", "version": "1.0.0"}

# --- Predict endpoint ---
@app.post("/predict")
async def predict(req: Request):
    """
    Accepts JSON payload with 'transaction_id' or 'features'.
    Returns anomaly score, feature lookup, graph features, and SHAP explanation if available.
    """
    body = await req.json()
    tx_id = body.get("transaction_id")
    input_features = body.get("features", {})

    result = {}

    # --- Anomaly detection lookup ---
    if tx_id and not anomaly_df.empty and "transaction_id" in anomaly_df.columns:
        match = anomaly_df[anomaly_df["transaction_id"] == tx_id]
        if not match.empty:
            result["anomaly_score"] = match.iloc[0].to_dict()
        else:
            result["anomaly_score"] = "not found"

    # --- Multi-level risk scoring ---
    if input_features:
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

    # --- Graph features lookup ---
    if tx_id and not graph_df.empty and "transaction_id" in graph_df.columns:
        match = graph_df[graph_df["transaction_id"] == tx_id]
        if not match.empty:
            result["graph_features"] = match.iloc[0].to_dict()

    # --- SHAP explanations (if shap dir exists) ---
    shap_dir = os.path.join(DATA_DIR, "shap")
    if os.path.isdir(shap_dir):
        shap_file = os.path.join(shap_dir, f"{tx_id}_shap.json")
        if tx_id and os.path.exists(shap_file):
            with open(shap_file, "r") as f:
                shap_values = json.load(f)
            result["shap_explanation"] = shap_values

    return {"prediction": result, "input": body}