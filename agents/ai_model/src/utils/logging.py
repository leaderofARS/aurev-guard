"""
utils/logging.py
Central logging configuration for AUREV Guard AI agents.
Provides a preconfigured Loguru logger with console and optional file output.
"""

import sys
import os
from loguru import logger

# --- Default log level ---
DEFAULT_LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# --- Configure handlers ---
# Remove any existing handlers to avoid duplicate logs
logger.remove()

# Console handler (stdout)
logger.add(
    sys.stdout,
    level=DEFAULT_LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
           "<level>{message}</level>",
    enqueue=True,
    backtrace=True,
    diagnose=True,
)

# Optional file handler (rotating logs)
LOG_FILE = os.getenv("LOG_FILE", "")
if LOG_FILE:
    logger.add(
        LOG_FILE,
        level=DEFAULT_LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        enqueue=True,
    )

# --- Helper functions ---
def get_logger() -> logger:
    """
    Return the global logger instance.
    Use this in other modules: from agents.ai_model.src.utils.logging import get_logger
    """
    return logger

def set_log_level(level: str) -> None:
    """
    Dynamically change log level at runtime.
    Example: set_log_level("DEBUG")
    """
    logger.remove()
    logger.add(
        sys.stdout,
        level=level.upper(),
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
               "<level>{message}</level>",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )

# --- Example usage when run directly ---
if __name__ == "__main__":
    log = get_logger()
    log.info("Logger initialized successfully.")
    log.debug("This is a debug message.")
    log.warning("This is a warning message.")
    log.error("This is an error message.")