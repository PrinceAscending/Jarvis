"""Groq Cloud AI Provider — Ultra-low latency inference with free tier."""

from typing import Any, Dict
from ai.providers.openai_compatible import OpenAICompatibleProvider


class GroqProvider(OpenAICompatibleProvider):
    """Groq Cloud API provider."""

    DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"

    def __init__(self, config: Dict[str, Any]):
        cfg = config.copy()
        if not cfg.get("model"):
            cfg["model"] = "llama-3.3-70b-versatile"
        super().__init__(cfg, base_url=self.DEFAULT_BASE_URL)
