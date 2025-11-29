"""
train.py
Training pipeline for AUREV Guard AI agents.
- Loads transaction data (from features.parquet or synthetic demo).
- Builds global + per-address features.
- Trains IsolationForest (unsupervised anomaly detection).
- Trains RandomForestClassifier (supervised risk scoring).
- Saves models to models/ directory.
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.utils import shuffle

from agents.ai_model.src.utils import (
    MODEL_DIR,
    find_features_file,
    RANDOM_SEED,
    DEFAULT_MIN_SAMPLES,
    logger,
)
from agents.ai_model.src.features.build_global_features import make_global_features
from agents.ai_model.src.features.build_features import make_address_features


# --- Load features or synthetic demo ---
def load_features_or_demo() -> pd.DataFrame:
    features_path = find_features_file()
    if features_path:
        logger.info(f"✅ Using features file at: {features_path}")
        df = pd.read_parquet(features_path)
    else:
        logger.warning("⚠️ features.parquet not found, generating synthetic demo dataset...")
        rng = np.random.RandomState(RANDOM_SEED)
        df = pd.DataFrame({
            "timestamp": pd.date_range("2025-11-01", periods=50, freq="H"),
            "address": [f"addr{i%5}" for i in range(50)],
            "value": rng.lognormal(mean=14, sigma=1.0, size=50),
            "counterparty": [f"cp{i%10}" for i in range(50)],
        })
    return df


# --- Ensure minimum samples for training ---
def ensure_min_samples(df: pd.DataFrame, min_n: int = DEFAULT_MIN_SAMPLES) -> pd.DataFrame:
    if len(df) < min_n:
        logger.info(f"⚠️ Only {len(df)} samples found, expanding synthetic dataset to {min_n}...")
        copies = [df]
        while sum(len(c) for c in copies) < min_n:
            copies.append(df.sample(len(df), replace=True, random_state=np.random.randint(0, 1e6)))
        df = pd.concat(copies, ignore_index=True)
        df = shuffle(df, random_state=RANDOM_SEED).reset_index(drop=True)
    return df


# --- Auto-labels for supervised training ---
def auto_labels_from_heuristics(df: pd.DataFrame) -> pd.Series:
    """
    Simple heuristics to generate labels for demo purposes.
    Flags high-value transactions or anomalies as risky.
    """
    z = (df["avg_value_7d"] - df["avg_value_7d"].mean()) / (df["avg_value_7d"].std() + 1e-9)
    risk = (z > 0.8).astype(int)
    if "is_anomaly" in df.columns:
        risk = np.where(df["is_anomaly"] == 1, 1, risk)
    return pd.Series(risk, name="label")


# --- Main training pipeline ---
def main():
    # Load raw transactions
    tx_df = load_features_or_demo()
    tx_df = ensure_min_samples(tx_df)

    # Build global + per-address features
    global_df = make_global_features(tx_df)
    addr_df = make_address_features(tx_df, global_df)

    # Merge features for training
    df = addr_df.copy()

    # --- Train IsolationForest ---
    iso_features = [
        "tx_count_24h",
        "total_value_24h",
        "largest_value_24h",
        "std_value_24h",
        "unique_counterparts_24h",
        "entropy_of_destinations",
        "share_of_daily_volume",
        "relative_max_vs_global",
    ]
    iso = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=RANDOM_SEED,
    )
    iso.fit(df[iso_features])
    joblib.dump(iso, os.path.join(MODEL_DIR, "isolationforest.pkl"))
    logger.info("✅ IsolationForest trained and saved.")

    # --- Train RandomForestClassifier ---
    y = auto_labels_from_heuristics(df)
    X_train, X_test, y_train, y_test = train_test_split(
        df[iso_features],
        y,
        test_size=0.2,
        random_state=RANDOM_SEED,
        stratify=y,
    )

    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        random_state=RANDOM_SEED,
        class_weight="balanced",
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    report = classification_report(y_test, y_pred, zero_division=0)
    logger.info("📊 RandomForest Evaluation:\n" + report)

    joblib.dump(rf, os.path.join(MODEL_DIR, "randomforest.pkl"))
    logger.info("✅ RandomForest trained and saved.")


if __name__ == "__main__":
    main()