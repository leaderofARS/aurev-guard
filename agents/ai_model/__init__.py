"""
ai_model package initializer for AUREV Guard AI agents.

This module exposes the src subpackage and models directory.
"""

# Expose src as the main subpackage
from . import src
from .src.train import main as train_main
# Models directory is not a Python package, but we keep it accessible via config
__all__ = ["src"]