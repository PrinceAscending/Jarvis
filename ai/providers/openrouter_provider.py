"""OpenRouter AI Provider — Multi-model hub with popular free models."""

from typing import Any, Dict
from ai.providers.openai_compatible import OpenAICompatibleProvider


class OpenRouterProvider(OpenAICompatibleProvider):
    """OpenRouter API provider offering free and paid state-of-the-art models."""

    DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, config: Dict[str, Any]):
        cfg = config.copy()
        if not cfg.get("model"):
            cfg["model"] = "meta-llama/llama-3.3-70b-instruct:free"
        super().__init__(cfg, base_url=self.DEFAULT_BASE_URL)
