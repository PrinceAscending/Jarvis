"""Base classes and interfaces for AI Providers in JARVIS."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Dict, List, Optional, Union


@dataclass
class ToolCall:
    """Represents a tool invocation request from the AI."""
    id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class ChatMessage:
    """Represents a message in the conversation thread."""
    role: str  # 'system', 'user', 'assistant', 'tool'
    content: str = ""
    name: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to standard dictionary representation."""
        data: Dict[str, Any] = {"role": self.role, "content": self.content}
        if self.name:
            data["name"] = self.name
        if self.tool_calls:
            data["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.name, "arguments": tc.arguments},
                }
                for tc in self.tool_calls
            ]
        if self.tool_call_id:
            data["tool_call_id"] = self.tool_call_id
        return data


@dataclass
class ToolDefinition:
    """Defines a tool callable by the AI."""
    name: str
    description: str
    parameters: Dict[str, Any]

    def to_openai_dict(self) -> Dict[str, Any]:
        """Format for OpenAI/OpenRouter/Groq/Ollama tool calling."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


@dataclass
class AIResponse:
    """Response returned from an AI provider."""
    content: str = ""
    tool_calls: List[ToolCall] = field(default_factory=list)
    finish_reason: str = "stop"
    model: str = ""
    usage: Dict[str, int] = field(default_factory=dict)


class AIProvider(ABC):
    """Abstract base class for all AI model providers."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key: str = config.get("api_key", "")
        self.model: str = config.get("model", "")
        self.temperature: float = config.get("temperature", 0.7)
        self.max_tokens: int = config.get("max_tokens", 4096)

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_prompt: Optional[str] = None,
    ) -> AIResponse:
        """Send a chat completion request."""
        pass

    @abstractmethod
    async def stream(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion tokens."""
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """Verify API key and provider connectivity."""
        pass
