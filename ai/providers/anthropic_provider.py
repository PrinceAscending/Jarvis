"""Anthropic Claude Provider implementation."""

import json
import httpx
from typing import Any, AsyncGenerator, Dict, List, Optional
from ai.base import AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition


class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider."""

    BASE_URL = "https://api.anthropic.com/v1"

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        if not self.model:
            self.model = "claude-3-5-sonnet-20241022"
        self.headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    def _convert_tools(self, tools: List[ToolDefinition]) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "input_schema": t.parameters,
            }
            for t in tools
        ]

    def _convert_messages(self, messages: List[ChatMessage]) -> List[Dict[str, Any]]:
        converted = []
        for msg in messages:
            if msg.role == "system":
                continue  # Handled separately via system param
            role = "user" if msg.role in ("user", "tool") else "assistant"
            converted.append({"role": role, "content": msg.content or ""})
        return converted

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_prompt: Optional[str] = None,
    ) -> AIResponse:
        url = f"{self.BASE_URL}/messages"
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._convert_messages(messages),
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }
        if system_prompt:
            payload["system"] = system_prompt
        if tools:
            payload["tools"] = self._convert_tools(tools)

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=self.headers, json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Anthropic error ({res.status_code}): {res.text}")

            data = res.json()
            content = ""
            tool_calls = []

            for block in data.get("content", []):
                if block.get("type") == "text":
                    content += block.get("text", "")
                elif block.get("type") == "tool_use":
                    tool_calls.append(
                        ToolCall(
                            id=block.get("id", f"call_{len(tool_calls)}"),
                            name=block.get("name", ""),
                            arguments=block.get("input", {}),
                        )
                    )

            return AIResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=data.get("stop_reason", "end_turn"),
                model=data.get("model", self.model),
                usage=data.get("usage", {}),
            )

    async def stream(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        url = f"{self.BASE_URL}/messages"
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._convert_messages(messages),
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": True,
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=self.headers, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    raise RuntimeError(f"Stream error: {err.decode('utf-8')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if line.startswith("data:"):
                        data_str = line[5:].strip()
                        try:
                            data = json.loads(data_str)
                            if data.get("type") == "content_block_delta":
                                delta = data.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    yield delta.get("text", "")
                        except Exception:
                            continue

    async def test_connection(self) -> bool:
        try:
            test_msg = [ChatMessage(role="user", content="Ping")]
            resp = await self.chat(test_msg)
            return bool(resp.content)
        except Exception as e:
            print(f"[AnthropicProvider] Connection test failed: {e}")
            return False
