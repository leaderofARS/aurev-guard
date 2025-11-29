import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor

FEATURES_PATH = Path("agents/ai_model/data/features.csv")
RESULTS_PATH = Path("agents/ai_model/data/anomaly_results.csv")

def load_features(path: Path = FEATURES_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df

def select_numeric_features(df: pd.DataFrame) -> pd.DataFrame:
    # Drop non-numeric or identifiers
    drop_cols = ["address"]
    X = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    # Keep only numeric dtypes
    X = X.select_dtypes(include=[np.number]).copy()
    # Replace any inf or NaNs
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    return X

def run_models(X: pd.DataFrame, scale: bool = True, contamination: float = 0.1) -> dict:
    results = {}

    # Scale features for SVM and LOF stability
    X_model = X.values
    if scale:
        scaler = StandardScaler()
        X_model = scaler.fit_transform(X_model)

    # Isolation Forest (tree-based, scale-invariant)
    iso = IsolationForest(n_estimators=300, contamination=contamination, random_state=42)
    results["IsolationForest"] = iso.fit_predict(X.values)  # use raw scale

    # One-Class SVM (boundary-based)
    svm = OneClassSVM(kernel="rbf", nu=contamination, gamma="scale")
    results["OneClassSVM"] = svm.fit_predict(X_model)

    # Local Outlier Factor (density-based)
    lof = LocalOutlierFactor(n_neighbors=20, contamination=contamination)
    results["LOF"] = lof.fit_predict(X_model)

    # Ensemble voting: majority vote across models
    votes = np.vstack(list(results.values()))
    ensemble = np.sign(votes.sum(axis=0))  # -1 anomaly, +1 normal
    # If tie (0), default to normal (+1)
    ensemble[ensemble == 0] = 1
    results["Ensemble"] = ensemble

    # Optional scores (where available)
    # Isolation Forest decision function (higher = more normal)
    results["IsolationForest_score"] = IsolationForest(n_estimators=300, contamination=contamination, random_state=42).fit(X.values).decision_function(X.values)

    return results

def build_anomaly_report():
    df = load_features()
    X = select_numeric_features(df)
    results = run_models(X, scale=True, contamination=0.1)

    # Attach predictions
    for model, preds in results.items():
        df[model] = preds

    anomalies = df[df["Ensemble"] == -1]

    print("✅ Anomaly detection complete")
    print(f"Total addresses: {len(df)}")
    print(f"Anomalies flagged: {len(anomalies)}")
    print(anomalies[["address", "IsolationForest", "OneClassSVM", "LOF", "Ensemble"]].head())

    df.to_csv(RESULTS_PATH, index=False)
    print(f"📂 Results saved to {RESULTS_PATH}")

    return df, anomalies

if __name__ == "__main__":
    build_anomaly_report()