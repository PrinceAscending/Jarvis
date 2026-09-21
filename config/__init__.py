"""Configuration package for JARVIS."""

from config.settings import settings, SettingsManager
from config.defaults import (
    DEFAULT_SETTINGS,
    JARVIS_SYSTEM_PROMPT,
    APP_DATA_DIR,
    DATABASE_FILE,
    MEMORY_DIR,
    LOGS_DIR,
    RECORDINGS_DIR,
)

__all__ = [
    "settings",
    "SettingsManager",
    "DEFAULT_SETTINGS",
    "JARVIS_SYSTEM_PROMPT",
    "APP_DATA_DIR",
    "DATABASE_FILE",
    "MEMORY_DIR",
    "LOGS_DIR",
    "RECORDINGS_DIR",
]
