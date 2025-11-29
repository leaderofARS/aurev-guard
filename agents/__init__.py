"""
agents package initializer for AUREV Guard.

This marks the agents directory as a Python package and exposes
submodules like ai_model for import.
"""

from . import ai_model

__all__ = ["ai_model"]