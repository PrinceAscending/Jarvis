"""Secure credential storage using Windows Credential Manager via keyring."""

from typing import Optional
import keyring
from config.settings import settings


class CredentialVault:
    """Manages secure API keys in the OS credential store."""

    SERVICE_NAME = "JarvisAssistant_SecurityVault"

    @classmethod
    def set_key(cls, provider: str, key: str):
        """Securely store an API key."""
        try:
            keyring.set_password(cls.SERVICE_NAME, provider, key)
        except Exception as e:
            print(f"[CredentialVault] Keyring failed, falling back to config: {e}")
        # Always update in settings too for sync
        providers = settings.get("ai", "providers", {})
        if provider in providers:
            providers[provider]["api_key"] = key
            settings.set("ai", "providers", providers)

    @classmethod
    def get_key(cls, provider: str) -> str:
        """Retrieve an API key, prioritizing system keyring then settings config."""
        try:
            val = keyring.get_password(cls.SERVICE_NAME, provider)
            if val:
                return val
        except Exception:
            pass

        # Fallback to settings
        return settings.get("ai", "providers", {}).get(provider, {}).get("api_key", "")

    @classmethod
    def delete_key(cls, provider: str):
        """Delete stored API key."""
        try:
            keyring.delete_password(cls.SERVICE_NAME, provider)
        except Exception:
            pass
        providers = settings.get("ai", "providers", {})
        if provider in providers:
            providers[provider]["api_key"] = ""
            settings.set("ai", "providers", providers)
