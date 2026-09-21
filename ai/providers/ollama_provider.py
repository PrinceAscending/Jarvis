"""Ollama Local AI Provider — 100% Offline and Private."""

from typing import Any, Dict, List, Optional
import httpx
from ai.providers.openai_compatible import OpenAICompatibleProvider


class OllamaProvider(OpenAICompatibleProvider):
    """Local Ollama provider communicating with local endpoint (default: http://localhost:11434)."""

    DEFAULT_BASE_URL = "http://localhost:11434/v1"

    def __init__(self, config: Dict[str, Any]):
        cfg = config.copy()
        raw_url = cfg.get("base_url", "http://localhost:11434").rstrip("/")
        if not raw_url.endswith("/v1"):
            raw_url = f"{raw_url}/v1"
        cfg["base_url"] = raw_url
        if not cfg.get("model"):
            cfg["model"] = "llama3:latest"
        # Ollama does not strictly require an API key, so provide a placeholder if blank
        if not cfg.get("api_key"):
            cfg["api_key"] = "ollama"
        super().__init__(cfg, base_url=raw_url)

    async def list_local_models(self) -> List[str]:
        """Query local Ollama instance for installed models."""
        base = self.base_url.replace("/v1", "")
        url = f"{base}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    async def is_running(self) -> bool:
        """Check if local Ollama daemon is running."""
        base = self.base_url.replace("/v1", "")
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{base}/api/tags")
                return res.status_code == 200
        except Exception:
            return False
