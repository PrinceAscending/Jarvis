"""Central Orchestrator Engine for JARVIS."""

import asyncio
import json
import uuid
from typing import Any, Callable, Dict, List, Optional
from ai.base import ChatMessage, ToolCall
from ai.manager import ai_manager
from tools.registry import tool_registry
from tools.base import ToolResult
from security.permissions import permission_manager
from memory.manager import memory_manager
from memory.database import db
from config.defaults import JARVIS_SYSTEM_PROMPT
from config.settings import settings


class Orchestrator:
    """Coordinates reasoning, multi-step tool execution, memory injection, and user communication."""

    _instance: Optional["Orchestrator"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Orchestrator, cls).__new__(cls)
            cls._instance._active_tasks = {}
        return cls._instance

    async def process_user_request(
        self,
        user_text: str,
        conversation_id: str,
        event_callback: Optional[Callable[[str, Any], Any]] = None,
    ) -> str:
        """
        Process a user prompt end-to-end.
        `event_callback(event_type, data)` notifies the UI of progress, tool steps, and tokens.
        """
        async def notify(event_type: str, data: Any):
            if event_callback:
                if asyncio.iscoroutinefunction(event_callback):
                    await event_callback(event_type, data)
                else:
                    event_callback(event_type, data)

        await notify("status", "thinking")

        # 1. Save user message to database
        user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        db.save_message(user_msg_id, conversation_id, "user", user_text)

        # 2. Retrieve history for conversation
        history_rows = db.get_messages(conversation_id, limit=20)
        messages: List[ChatMessage] = []
        for r in history_rows:
            tc_list = []
            if r.get("tool_calls"):
                for raw_tc in r["tool_calls"]:
                    fn = raw_tc.get("function", {})
                    args = fn.get("arguments", {})
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except Exception:
                            pass
                    tc_list.append(ToolCall(id=raw_tc["id"], name=fn.get("name", ""), arguments=args))

            messages.append(
                ChatMessage(
                    role=r["role"],
                    content=r["content"] or "",
                    tool_calls=tc_list if tc_list else None,
                    tool_call_id=r.get("tool_call_id"),
                )
            )

        # 3. Assemble dynamic system prompt with memory context
        memory_context = memory_manager.get_context_injection(user_text)
        assistant_name = settings.get("general", "assistant_name", "JARVIS")
        full_system_prompt = f"{JARVIS_SYSTEM_PROMPT}\nYour designated name is {assistant_name}.\n{memory_context}"

        # 4. Agent loop (up to 5 tool recursion steps)
        tools = tool_registry.get_tool_definitions()
        max_steps = 5
        current_step = 0
        final_text = ""

        while current_step < max_steps:
            current_step += 1

            # Call AI
            response = await ai_manager.chat(
                messages=messages,
                tools=tools,
                system_prompt=full_system_prompt,
            )

            # If AI returned text content, save and broadcast
            if response.content:
                final_text = response.content

            # If no tools to call, we are done
            if not response.tool_calls:
                break

            # Process tool calls
            assistant_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
            tc_dicts = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.name, "arguments": tc.arguments},
                }
                for tc in response.tool_calls
            ]
            db.save_message(assistant_msg_id, conversation_id, "assistant", response.content, tool_calls=tc_dicts)
            messages.append(ChatMessage(role="assistant", content=response.content, tool_calls=response.tool_calls))

            for tc in response.tool_calls:
                tool_instance = tool_registry.get(tc.name)
                if not tool_instance:
                    tool_res = ToolResult(success=False, error=f"Unknown tool: {tc.name}")
                else:
                    # Check permission
                    allowed, reason = permission_manager.check_permission(tool_instance, tc.arguments)
                    if not allowed:
                        tool_res = ToolResult(
                            success=False,
                            error=f"Permission Denied: {reason}"
                        )
                    else:
                        await notify("status", "tool_executing")
                        await notify("tool_start", {"name": tc.name, "arguments": tc.arguments, "call_id": tc.id})
                        tool_res = await tool_registry.execute(tc.name, tc.arguments)
                        permission_manager.record_action(
                            tc.name,
                            tc.arguments,
                            tool_res.to_dict(),
                            "success" if tool_res.success else "error"
                        )
                        await notify("tool_done", {
                            "name": tc.name,
                            "call_id": tc.id,
                            "success": tool_res.success,
                            "result": tool_res.data,
                            "error": tool_res.error,
                            "message": tool_res.message,
                        })

                # Append tool result to conversation history
                res_content = json.dumps(tool_res.to_dict())
                tool_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                db.save_message(tool_msg_id, conversation_id, "tool", res_content, tool_call_id=tc.id)
                messages.append(ChatMessage(role="tool", content=res_content, tool_call_id=tc.id))

        # 5. Finalize assistant response
        final_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        db.save_message(final_msg_id, conversation_id, "assistant", final_text)

        await notify("token", final_text)
        await notify("done", {"text": final_text})
        await notify("status", "idle")

        return final_text


# Global singleton
orchestrator = Orchestrator()
