"""OpenAI Provider implementation."""

from typing import Any, Dict
from ai.providers.openai_compatible import OpenAICompatibleProvider


class OpenAIProvider(OpenAICompatibleProvider):
    """Official OpenAI API provider (GPT-4o, GPT-4o-mini)."""

    DEFAULT_BASE_URL = "https://api.openai.com/v1"

    def __init__(self, config: Dict[str, Any]):
        cfg = config.copy()
        if not cfg.get("model"):
            cfg["model"] = "gpt-4o"
        super().__init__(cfg, base_url=self.DEFAULT_BASE_URL)
