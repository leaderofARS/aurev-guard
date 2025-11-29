"""
AI Model entry point for running training and inference.
Usage:
  python -m agents.ai_model train
  python -m agents.ai_model inference
  python -m agents.ai_model api
"""

import sys
import argparse

from src.train import ModelTrainer
from src.inference import ModelInference
from src.pipeline.api import app
from src.utils import Config, setup_logger

logger = setup_logger(__name__)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="AuRev Guard AI Model CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Train command
    train_parser = subparsers.add_parser("train", help="Train models")
    train_parser.add_argument("--samples", type=int, default=500, help="Number of synthetic samples")

    # Inference command
    inf_parser = subparsers.add_parser("inference", help="Run inference on sample data")

    # API command
    api_parser = subparsers.add_parser("api", help="Start FastAPI server")
    api_parser.add_argument("--host", default=Config.API_HOST, help="API host")
    api_parser.add_argument("--port", type=int, default=Config.API_PORT, help="API port")
    api_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    # Config command
    config_parser = subparsers.add_parser("config", help="Show configuration")

    args = parser.parse_args()

    if args.command == "train":
        logger.info("Starting model training...")
        trainer = ModelTrainer()
        trainer.train()
        trainer.save_models()
        logger.info("✅ Training complete.")

    elif args.command == "inference":
        logger.info("Running inference...")
        inf = ModelInference()
        test_tx_ids = ["tx1", "tx2", "tx3", "tx4", "tx5"]
        result = inf.predict(test_tx_ids)
        logger.info(f"Prediction: {result['prediction_label']}")
        logger.info(f"Anomaly Prob: {result['probability_anomaly']:.2%}")

    elif args.command == "api":
        logger.info(f"Starting API on {args.host}:{args.port}...")
        import uvicorn
        uvicorn.run(
            app,
            host=args.host,
            port=args.port,
            reload=args.reload,
        )

    elif args.command == "config":
        Config.display()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
