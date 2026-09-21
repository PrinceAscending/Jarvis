"""AI Provider Manager for JARVIS — Dynamic selection, routing, and fallback."""

from typing import Any, AsyncGenerator, Dict, List, Optional
from ai.base import AIProvider, AIResponse, ChatMessage, ToolDefinition
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.groq_provider import GroqProvider
from ai.providers.openrouter_provider import OpenRouterProvider
from ai.providers.ollama_provider import OllamaProvider
from ai.providers.openai_provider import OpenAIProvider
from ai.providers.anthropic_provider import AnthropicProvider
from config.settings import settings


class AIManager:
    """Central manager for all AI model providers with fallback and routing."""

    _instance: Optional["AIManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIManager, cls).__new__(cls)
            cls._instance._providers = {}
        return cls._instance

    def __init__(self):
        self._providers: Dict[str, AIProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Instantiate providers from current configuration."""
        providers_cfg = settings.get("ai", "providers", {})

        # Gemini
        if "gemini" in providers_cfg:
            self._providers["gemini"] = GeminiProvider(providers_cfg["gemini"])

        # Groq (Free, ultra-fast)
        if "groq" in providers_cfg:
            self._providers["groq"] = GroqProvider(providers_cfg["groq"])

        # OpenRouter (Free & community models)
        if "openrouter" in providers_cfg:
            self._providers["openrouter"] = OpenRouterProvider(providers_cfg["openrouter"])

        # Ollama (Local offline)
        if "ollama" in providers_cfg:
            self._providers["ollama"] = OllamaProvider(providers_cfg["ollama"])

        # OpenAI
        if "openai" in providers_cfg:
            self._providers["openai"] = OpenAIProvider(providers_cfg["openai"])

        # Anthropic
        if "anthropic" in providers_cfg:
            self._providers["anthropic"] = AnthropicProvider(providers_cfg["anthropic"])

    def reload(self):
        """Reload providers after settings update."""
        self._initialize_providers()

    def get_active_provider_name(self) -> str:
        """Get the currently selected provider name."""
        return settings.get("ai", "active_provider", "gemini")

    def get_provider(self, name: Optional[str] = None) -> AIProvider:
        """Get provider instance by name or active provider."""
        provider_name = name or self.get_active_provider_name()
        if provider_name not in self._providers:
            # Fall back to any available or re-initialize
            self._initialize_providers()
        
        provider = self._providers.get(provider_name)
        if not provider:
            # Absolute fallback to first available
            if self._providers:
                return next(iter(self._providers.values()))
            raise RuntimeError(f"No AI provider available for '{provider_name}'. Please configure API keys.")
        return provider

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_prompt: Optional[str] = None,
        task_type: Optional[str] = None,
    ) -> AIResponse:
        """Execute chat completion with automatic task routing and fallback."""
        provider_name = self.get_active_provider_name()

        # Check if task-specific routing is configured
        if task_type:
            routing = settings.get("ai", "task_routing", {})
            routed = routing.get(task_type)
            if routed and routed in self._providers:
                provider_name = routed

        provider = self.get_provider(provider_name)

        try:
            return await provider.chat(messages, tools=tools, system_prompt=system_prompt)
        except Exception as primary_error:
            print(f"[AIManager] Error with primary provider '{provider_name}': {primary_error}")

            # Try fallback: if local ollama is running or if another online provider has key
            for fallback_name, fallback_prov in self._providers.items():
                if fallback_name == provider_name:
                    continue
                # For ollama, test if running; for others test if key is present
                if fallback_name == "ollama" or fallback_prov.api_key:
                    try:
                        print(f"[AIManager] Attempting fallback to '{fallback_name}'...")
                        return await fallback_prov.chat(messages, tools=tools, system_prompt=system_prompt)
                    except Exception as fb_err:
                        print(f"[AIManager] Fallback '{fallback_name}' failed: {fb_err}")
            
            # If all fail, re-raise original error
            raise primary_error

    async def stream(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        task_type: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens from active provider."""
        provider = self.get_provider()
        async for chunk in provider.stream(messages, system_prompt=system_prompt):
            yield chunk

    async def test_provider(self, name: str) -> bool:
        """Test if a specific provider is configured and reachable."""
        prov = self.get_provider(name)
        return await prov.test_connection()


# Global singleton
ai_manager = AIManager()
