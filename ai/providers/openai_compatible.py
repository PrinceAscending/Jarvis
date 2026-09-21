"""OpenAI-compatible provider implementation using httpx for maximum performance and async support."""

import json
import httpx
from typing import Any, AsyncGenerator, Dict, List, Optional
from ai.base import AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition


class OpenAICompatibleProvider(AIProvider):
    """Handles any OpenAI-compatible API endpoint (Groq, OpenRouter, OpenAI, Ollama v1)."""

    def __init__(self, config: Dict[str, Any], base_url: str = "https://api.openai.com/v1"):
        super().__init__(config)
        self.base_url = config.get("base_url", base_url).rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"

        # Special headers for OpenRouter
        if "openrouter" in self.base_url:
            self.headers["HTTP-Referer"] = "https://github.com/jarvis-assistant"
            self.headers["X-Title"] = "JARVIS AI Assistant"

    def _format_messages(
        self, messages: List[ChatMessage], system_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        formatted = []
        if system_prompt:
            formatted.append({"role": "system", "content": system_prompt})

        for msg in messages:
            item: Dict[str, Any] = {"role": msg.role, "content": msg.content or ""}
            if msg.name:
                item["name"] = msg.name
            if msg.tool_call_id:
                item["tool_call_id"] = msg.tool_call_id
            if msg.tool_calls:
                item["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.name,
                            "arguments": json.dumps(tc.arguments)
                            if isinstance(tc.arguments, dict)
                            else str(tc.arguments),
                        },
                    }
                    for tc in msg.tool_calls
                ]
            formatted.append(item)
        return formatted

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_prompt: Optional[str] = None,
    ) -> AIResponse:
        """Send chat completion request to the API."""
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._format_messages(messages, system_prompt),
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        if tools:
            payload["tools"] = [t.to_openai_dict() for t in tools]
            payload["tool_choice"] = "auto"

        url = f"{self.base_url}/chat/completions"
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=self.headers, json=payload)
            if response.status_code != 200:
                raise RuntimeError(
                    f"API error ({response.status_code}): {response.text}"
                )

            data = response.json()
            choice = data["choices"][0]
            msg_data = choice.get("message", {})

            content = msg_data.get("content") or ""
            tool_calls: List[ToolCall] = []

            if "tool_calls" in msg_data and msg_data["tool_calls"]:
                for raw_tc in msg_data["tool_calls"]:
                    fn = raw_tc.get("function", {})
                    fn_name = fn.get("name", "")
                    raw_args = fn.get("arguments", "{}")
                    if isinstance(raw_args, str):
                        try:
                            fn_args = json.loads(raw_args)
                        except Exception:
                            fn_args = {"raw": raw_args}
                    else:
                        fn_args = raw_args

                    tool_calls.append(
                        ToolCall(
                            id=raw_tc.get("id", f"call_{len(tool_calls)}"),
                            name=fn_name,
                            arguments=fn_args,
                        )
                    )

            return AIResponse(
                content=content,
                tool_calls=tool_calls,
                finish_reason=choice.get("finish_reason", "stop"),
                model=data.get("model", self.model),
                usage=data.get("usage", {}),
            )

    async def stream(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens as they arrive."""
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": self._format_messages(messages, system_prompt),
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": True,
        }

        url = f"{self.base_url}/chat/completions"
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=self.headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(f"Stream error ({response.status_code}): {error_text.decode('utf-8')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data_str = line[len("data:"):].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        chunk = delta.get("content")
                        if chunk:
                            yield chunk
                    except Exception:
                        continue

    async def test_connection(self) -> bool:
        """Verify API key and model availability."""
        try:
            test_msg = [ChatMessage(role="user", content="Ping")]
            resp = await self.chat(test_msg)
            return bool(resp.content or resp.tool_calls)
        except Exception as e:
            print(f"[{self.__class__.__name__}] Connection test failed: {e}")
            return False
