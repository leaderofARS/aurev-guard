"""
utils/config.py
Central configuration module for AUREV Guard AI agents.
Handles paths, directories, and environment variables.
"""
from dotenv import load_dotenv
import os
from pathlib import Path
from dotenv import load_dotenv

DATA_DIR = os.path.join("aurevguard", "agents", "ai_model", "data")
MODEL_DIR = os.path.join("aurevguard", "agents", "ai_model", "models")

# --- Load environment variables from .env if present ---
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)

# --- Project root directories ---
SRC_DIR = Path(__file__).resolve().parent          # .../src/utils
AI_ROOT = SRC_DIR.parent                           # .../src
AGENTS_ROOT = AI_ROOT.parent                       # .../ai_model
PROJECT_ROOT = AGENTS_ROOT.parent.parent           # .../aurev-guard

# --- Models directory ---
MODEL_DIR = AGENTS_ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# --- Data directories ---
DATA_DIRS = [
    AGENTS_ROOT / "data" / "processed",
    AGENTS_ROOT / "notebooks" / "data" / "processed",
    PROJECT_ROOT / "notebooks" / "data" / "processed",
]

FEATURES_FILENAME = "features.parquet"

def find_features_file() -> str | None:
    """
    Search for features.parquet in known data directories.
    Returns the first path found, or None if not found.
    """
    for base in DATA_DIRS:
        path = base / FEATURES_FILENAME
        if path.exists():
            return str(path)
    return None

# --- Environment variables ---
BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY", "")
DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING", "")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# --- Utility constants ---
RANDOM_SEED = int(os.getenv("RANDOM_SEED", "42"))
DEFAULT_MIN_SAMPLES = int(os.getenv("DEFAULT_MIN_SAMPLES", "100"))

# --- Helper functions ---
def get_model_path(name: str) -> str:
    """
    Return full path for a model file inside MODEL_DIR.
    Example: get_model_path("randomforest.pkl")
    """
    return str(MODEL_DIR / name)

def ensure_dir(path: str | Path) -> None:
    """
    Ensure a directory exists, creating it if necessary.
    """
    Path(path).mkdir(parents=True, exist_ok=True)

def print_config_summary() -> None:
    """
    Print a summary of key configuration values for debugging.
    """
    print("=== AUREV Guard Config Summary ===")
    print(f"PROJECT_ROOT: {PROJECT_ROOT}")
    print(f"AGENTS_ROOT: {AGENTS_ROOT}")
    print(f"MODEL_DIR: {MODEL_DIR}")
    print(f"DATA_DIRS: {DATA_DIRS}")
    print(f"BLOCKFROST_API_KEY: {'set' if BLOCKFROST_API_KEY else 'not set'}")
    print(f"DB_CONNECTION_STRING: {'set' if DB_CONNECTION_STRING else 'not set'}")
    print(f"LOG_LEVEL: {LOG_LEVEL}")
    print(f"RANDOM_SEED: {RANDOM_SEED}")
    print(f"DEFAULT_MIN_SAMPLES: {DEFAULT_MIN_SAMPLES}")
    print("=================================")

# Run summary if executed directly
if __name__ == "__main__":
    print_config_summary()