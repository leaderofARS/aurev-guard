"""
utils package initializer for AUREV Guard AI agents.

This module exposes common utilities (config, logging) so they can be imported
directly from agents.ai_model.src.utils without needing to reference submodules.
"""

from .config import (
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
)

from .logging import get_logger, set_log_level

# Provide a default logger instance for convenience
logger = get_logger()

__all__ = [
    # Config exports
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
    # Logging exports
    "get_logger",
    "set_log_level",
    "logger",
]