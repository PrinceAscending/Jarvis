"""Settings manager for JARVIS AI Assistant."""

import json
import os
import copy
from pathlib import Path
from typing import Any, Dict, Optional
from config.defaults import DEFAULT_SETTINGS, CONFIG_FILE, APP_DATA_DIR, MEMORY_DIR, LOGS_DIR, RECORDINGS_DIR, UPDATES_DIR


class SettingsManager:
    """Manages persistent application settings."""

    _instance: Optional["SettingsManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SettingsManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._ensure_directories()
        self.settings: Dict[str, Any] = self._load_settings()
        self._initialized = True

    def _ensure_directories(self):
        """Create necessary application directories."""
        for directory in [APP_DATA_DIR, MEMORY_DIR, LOGS_DIR, RECORDINGS_DIR, UPDATES_DIR]:
            directory.mkdir(parents=True, exist_ok=True)

    def _load_settings(self) -> Dict[str, Any]:
        """Load settings from JSON, merging with defaults for any missing keys."""
        if not CONFIG_FILE.exists():
            self._save_to_disk(DEFAULT_SETTINGS)
            return copy.deepcopy(DEFAULT_SETTINGS)

        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            # Deep merge defaults with loaded
            merged = self._deep_merge(copy.deepcopy(DEFAULT_SETTINGS), loaded)
            return merged
        except Exception as e:
            print(f"[SettingsManager] Failed to load config from {CONFIG_FILE}: {e}")
            return copy.deepcopy(DEFAULT_SETTINGS)

    def _deep_merge(self, base: dict, overlay: dict) -> dict:
        """Recursively merge overlay dictionary into base dictionary."""
        for key, value in overlay.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                base[key] = self._deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    def _save_to_disk(self, data: Dict[str, Any]):
        """Write settings to config file safely."""
        temp_file = CONFIG_FILE.with_suffix(".tmp")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            temp_file.replace(CONFIG_FILE)
        except Exception as e:
            print(f"[SettingsManager] Failed to save config: {e}")
            if temp_file.exists():
                temp_file.unlink()

    def get(self, section: str, key: Optional[str] = None, default: Any = None) -> Any:
        """Retrieve a setting value."""
        sec_dict = self.settings.get(section, {})
        if key is None:
            return sec_dict
        if isinstance(sec_dict, dict):
            return sec_dict.get(key, default)
        return default

    def set(self, section: str, key: str, value: Any, save: bool = True):
        """Set a setting value and optionally write to disk."""
        if section not in self.settings:
            self.settings[section] = {}
        self.settings[section][key] = value
        if save:
            self.save()

    def update_section(self, section: str, values: Dict[str, Any], save: bool = True):
        """Update multiple keys in a section."""
        if section not in self.settings:
            self.settings[section] = {}
        self.settings[section].update(values)
        if save:
            self.save()

    def save(self):
        """Save current in-memory settings to disk."""
        self._save_to_disk(self.settings)

    def to_dict(self) -> Dict[str, Any]:
        """Return a copy of the entire settings dictionary."""
        return copy.deepcopy(self.settings)


# Global singleton helper
settings = SettingsManager()
