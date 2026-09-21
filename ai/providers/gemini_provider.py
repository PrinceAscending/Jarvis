"""Google Gemini AI Provider."""

from typing import Any, Dict
from ai.providers.openai_compatible import OpenAICompatibleProvider


class GeminiProvider(OpenAICompatibleProvider):
    """Google Gemini AI provider using Google's OpenAI-compatible v1beta endpoint."""

    DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"

    def __init__(self, config: Dict[str, Any]):
        cfg = config.copy()
        if not cfg.get("model"):
            cfg["model"] = "gemini-2.5-flash"
        super().__init__(cfg, base_url=self.DEFAULT_BASE_URL)
