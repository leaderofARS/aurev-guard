from fastapi import FastAPI, Request
import pandas as pd
import json
import os
import joblib

app = FastAPI(title="AI Model Agent", version="1.0.0")

# --- Paths ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# --- Load datasets safely ---
def safe_load_csv(filename: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, filename)
    try:
        return pd.read_csv(path)
    except Exception as e:
        print(f"⚠️ Could not load {filename}: {e}")
        return pd.DataFrame()

def safe_load_json(filename: str):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Could not load {filename}: {e}")
        return {}

anomaly_df = safe_load_csv("anomaly_results.csv")
features_df = safe_load_csv("features.csv")
graph_df = safe_load_csv("graph_features.csv")
transactions = safe_load_json("transactions.json")

# --- Load trained models ---
try:
    iso_model = joblib.load(os.path.join(MODEL_DIR, "isolationforest.pkl"))
    rf_model = joblib.load(os.path.join(MODEL_DIR, "randomforest.pkl"))
    print("✅ Models loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load models: {e}")
    iso_model, rf_model = None, None

# --- Health endpoint ---
@app.get("/health")
def health():
    return {"status": "ready", "service": "ai-model-agent", "version": "1.0.0"}

# --- Predict endpoint ---
@app.post("/predict")
async def predict(req: Request):
    """
    Accepts JSON payload with 'transaction_id' or 'features'.
    Returns risk score (RandomForest), anomaly flag (IsolationForest),
    plus dataset lookups (graph, anomaly, SHAP if available).
    """
    body = await req.json()
    tx_id = body.get("transaction_id")
    input_features = body.get("features", {})

    result = {}

    # --- Risk score from RandomForest ---
    if rf_model and input_features:
        try:
            X = pd.DataFrame([input_features])
            risk_score = int(rf_model.predict(X)[0])
            # Map to 0–4 levels for easier interpretation
            result["risk_score"] = risk_score
        except Exception as e:
            result["risk_score"] = f"error: {e}"
    else:
        # fallback rule if model not loaded
        amount = input_features.get("amount", 0)
        if amount < 1_000:
            result["risk_score"] = 0
        elif amount < 10_000:
            result["risk_score"] = 1
        elif amount < 100_000:
            result["risk_score"] = 2
        elif amount < 1_000_000:
            result["risk_score"] = 3
        else:
            result["risk_score"] = 4

    # --- Anomaly flag from IsolationForest ---
    if iso_model and input_features:
        try:
            X = pd.DataFrame([input_features])
            anomaly_flag = int(iso_model.predict(X)[0])  # -1 = anomaly, 1 = normal
            result["anomaly_flag"] = anomaly_flag
        except Exception as e:
            result["anomaly_flag"] = f"error: {e}"

    # --- Anomaly dataset lookup ---
    if tx_id and not anomaly_df.empty and "transaction_id" in anomaly_df.columns:
        match = anomaly_df[anomaly_df["transaction_id"] == tx_id]
        if not match.empty:
            result["anomaly_info"] = match.iloc[0].to_dict()

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


def main():
    """Main entry point for training/inference"""
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8083)