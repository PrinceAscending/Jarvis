"""Central Orchestrator Engine for JARVIS."""

import asyncio
import json
import uuid
import logging
from typing import Any, Callable, Dict, List, Optional
from ai.base import ChatMessage, ToolCall
from ai.manager import ai_manager
from tools.registry import tool_registry
from tools.base import ToolResult
from security.permissions import permission_manager
from security.privacy import redact_data, redact_secrets
from memory.manager import memory_manager
from memory.database import db
from core.learning import learning_engine
from config.defaults import JARVIS_SYSTEM_PROMPT
from config.settings import settings

logger = logging.getLogger("jarvis.orchestrator")


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
                try:
                    res = event_callback(event_type, data)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception as e:
                    logger.error(f"Error in orchestrator event callback: {e}")

        # 1. Save sanitized user message
        safe_user_text = redact_secrets(user_text)
        user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        db.save_message(user_msg_id, conversation_id, "user", safe_user_text)

        await notify("status", "thinking")

        # 2. Retrieve relevant long-term memory
        memories = memory_manager.search_memories(user_text, limit=3)
        memory_context = ""
        if memories:
            memory_context = "\n[RELEVANT MEMORY]\n" + "\n".join([f"- {m.content}" for m in memories])

        # 3. Build message history
        raw_history = db.get_conversation_messages(conversation_id, limit=20)
        messages: List[ChatMessage] = []
        for row in raw_history:
            role = row["role"]
            content = row["content"]
            tc_data = json.loads(row["tool_calls"]) if row["tool_calls"] else None
            tcs = None
            if tc_data:
                tcs = [
                    ToolCall(id=t["id"], name=t["function"]["name"], arguments=t["function"]["arguments"])
                    for t in tc_data
                ]
            messages.append(
                ChatMessage(
                    role=role,
                    content=content,
                    tool_calls=tcs,
                    tool_call_id=row["tool_call_id"],
                )
            )

        assistant_name = settings.get("assistant_name", "JARVIS")
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
                    # Pre-flight check against past mistakes
                    pre_flight = learning_engine.pre_flight_check(tc.name, tc.arguments)
                    if pre_flight.get("has_hint"):
                        logger.info(f"Applying learning heuristic for {tc.name}: {pre_flight.get('hint')}")

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

                        # Execute tool
                        tool_res = await tool_registry.execute(tc.name, tc.arguments)

                        # If tool failed, reflect & learn
                        if not tool_res.success:
                            learned = learning_engine.reflect_and_learn(
                                tool_name=tc.name,
                                args=tc.arguments,
                                error_text=tool_res.error or "Unknown failure"
                            )
                            # Append learned correction advice to help the AI recover immediately
                            tool_res.message += f" (Recommendation: {learned['workaround']})"

                        # Record action
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

                # Append sanitized tool result to conversation history
                safe_res_dict = redact_data(tool_res.to_dict())
                res_content = json.dumps(safe_res_dict)
                tool_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                db.save_message(tool_msg_id, conversation_id, "tool", res_content, tool_call_id=tc.id)
                messages.append(ChatMessage(role="tool", content=res_content, tool_call_id=tc.id))

        # 5. Finalize assistant response
        safe_final_text = redact_secrets(final_text)
        final_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        db.save_message(final_msg_id, conversation_id, "assistant", safe_final_text)

        await notify("token", safe_final_text)
        await notify("done", {"text": safe_final_text})
        await notify("status", "idle")

        return safe_final_text


# Global singleton
orchestrator = Orchestrator()
