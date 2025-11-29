"""
src package initializer for AUREV Guard AI agents.

This module exposes core functionality (training, inference, features, pipeline, utils)
so they can be imported directly from agents.ai_model.src without needing to reference
deep submodules.
"""

# --- Training and inference ---
from .train import main as train_main
from .inference import (
    load_models,
    detect_anomaly,
    predict_risk,
    explain_prediction,
    BASE_FEATURES,
)

# --- Features ---
from .features.build_global_features import make_global_features
from .features.build_features import make_address_features

# --- Pipeline (FastAPI service) ---
# Note: Importing app here can cause uvicorn reload issues if not careful.
# Best practice: import pipeline.api explicitly when running the service.
# from .pipeline.api import app

# --- Utilities ---
from .utils import (
    SRC_DIR,
    AI_ROOT,
    AGENTS_ROOT,
    PROJECT_ROOT,
    MODEL_DIR,
    DATA_DIRS,
    FEATURES_FILENAME,
    find_features_file,
    BLOCKFROST_API_KEY,
    DB_CONNECTION_STRING,
    LOG_LEVEL,
    RANDOM_SEED,
    DEFAULT_MIN_SAMPLES,
    get_model_path,
    ensure_dir,
    print_config_summary,
    get_logger,
    set_log_level,
    logger,
)

__all__ = [
    # Training / inference
    "train_main",
    "load_models",
    "detect_anomaly",
    "predict_risk",
    "explain_prediction",
    "BASE_FEATURES",
    # Features
    "make_global_features",
    "make_address_features",
    # Utilities
    "SRC_DIR",
    "AI_ROOT",
    "AGENTS_ROOT",
    "PROJECT_ROOT",
    "MODEL_DIR",
    "DATA_DIRS",
    "FEATURES_FILENAME",
    "find_features_file",
    "BLOCKFROST_API_KEY",
    "DB_CONNECTION_STRING",
    "LOG_LEVEL",
    "RANDOM_SEED",
    "DEFAULT_MIN_SAMPLES",
    "get_model_path",
    "ensure_dir",
    "print_config_summary",
    "get_logger",
    "set_log_level",
    "logger",
]