"""
__main__.py
Entry point for agents.ai_model.src package.

Allows running training, inference demo, or API service directly from the command line:
    python -m agents.ai_model.src train
    python -m agents.ai_model.src inference
    python -m agents.ai_model.src api
"""

import sys
import os
import pandas as pd
import uvicorn

from agents.ai_model.src import (
    train_main,
    load_models,
    detect_anomaly,
    predict_risk,
    explain_prediction,
    logger,
    MODEL_DIR,
)


def run_train():
    """Run the training pipeline."""
    logger.info("🚀 Starting training pipeline...")
    train_main()
    logger.info("✅ Training complete.")


def run_inference_demo():
    """Run a demo inference with synthetic features."""
    logger.info("🚀 Starting inference demo...")
    rf_model, iso_model, explainer = load_models()

    demo_features = pd.DataFrame([{
        "tx_count_24h": 12,
        "total_value_24h": 5_000_000,
        "largest_value_24h": 2_000_000,
        "std_value_24h": 200_000,
        "unique_counterparts_24h": 15,
        "entropy_of_destinations": 2.5,
        "share_of_daily_volume": 0.35,
        "relative_max_vs_global": 0.8,
    }])

    anomaly_score, is_anomaly = detect_anomaly(iso_model, demo_features)
    y_pred, y_prob = predict_risk(rf_model, demo_features)

    logger.info(
        f"🔎 Inference results: anomaly_score={anomaly_score}, "
        f"is_anomaly={is_anomaly}, predicted_risk={y_pred}, probability={y_prob:.3f}"
    )

    # Save SHAP explanation
    shap_path = os.path.join(MODEL_DIR, "shap_demo.png")
    explain_prediction(explainer, demo_features, save_path=shap_path)
    logger.info(f"💡 SHAP explanation saved to {shap_path}")


def run_api():
    """Run FastAPI service."""
    logger.info("🚀 Starting FastAPI service...")
    uvicorn.run("agents.ai_model.src.pipeline.api:app", host="127.0.0.1", port=8000, reload=True)


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m agents.ai_model.src [train|inference|api]")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "train":
        run_train()
    elif command == "inference":
        run_inference_demo()
    elif command == "api":
        run_api()
    else:
        print(f"Unknown command: {command}")
        print("Usage: python -m agents.ai_model.src [train|inference|api]")
        sys.exit(1)


if __name__ == "__main__":
    main()