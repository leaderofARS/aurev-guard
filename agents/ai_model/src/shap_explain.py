import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

# SHAP is optional dependency; install: pip install shap
import shap

FEATURES_PATH = Path("agents/ai_model/data/features.csv")
SHAP_DIR = Path("agents/ai_model/data/shap")
SHAP_VALUES_PATH = SHAP_DIR / "shap_values.npy"
SHAP_SUMMARY_PATH = SHAP_DIR / "shap_summary.csv"
SHAP_PER_ADDRESS_PATH = SHAP_DIR / "per_address.json"

def load_features() -> pd.DataFrame:
    df = pd.read_csv(FEATURES_PATH)
    return df

def select_numeric(df: pd.DataFrame) -> pd.DataFrame:
    X = df.drop(columns=["address"], errors="ignore")
    X = X.select_dtypes(include=[np.number]).copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    return X

def fit_isolation_forest(X: pd.DataFrame, contamination: float = 0.1) -> IsolationForest:
    model = IsolationForest(n_estimators=300, contamination=contamination, random_state=42)
    model.fit(X.values)
    return model

def compute_shap_values(model: IsolationForest, X: pd.DataFrame) -> np.ndarray:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X.values)  # shape: (n_samples, n_features)
    return shap_values

def save_shap_artifacts(df: pd.DataFrame, X: pd.DataFrame, shap_values: np.ndarray):
    SHAP_DIR.mkdir(parents=True, exist_ok=True)

    # Save raw SHAP values
    np.save(SHAP_VALUES_PATH, shap_values)

    # Per-feature mean |SHAP| summary
    mean_abs = np.mean(np.abs(shap_values), axis=0)
    summary_df = pd.DataFrame({
        "feature": list(X.columns),
        "mean_abs_shap": mean_abs
    }).sort_values("mean_abs_shap", ascending=False)
    summary_df.to_csv(SHAP_SUMMARY_PATH, index=False)

    # Per-address top contributors
    per_address = []
    for i, addr in enumerate(df["address"].tolist()):
        vals = shap_values[i]
        # top 5 contributors
        idx_sorted = np.argsort(np.abs(vals))[::-1][:5]
        contributors = [{"feature": X.columns[j], "shap_value": float(vals[j])} for j in idx_sorted]
        per_address.append({
            "address": addr,
            "top_contributors": contributors
        })

    with open(SHAP_PER_ADDRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(per_address, f, ensure_ascii=False, indent=2)

    print(f"✅ SHAP artifacts saved: {SHAP_VALUES_PATH}, {SHAP_SUMMARY_PATH}, {SHAP_PER_ADDRESS_PATH}")

def run_shap_pipeline():
    df = load_features()
    X = select_numeric(df)
    model = fit_isolation_forest(X, contamination=0.1)
    shap_values = compute_shap_values(model, X)
    save_shap_artifacts(df, X, shap_values)

if __name__ == "__main__":
    run_shap_pipeline()