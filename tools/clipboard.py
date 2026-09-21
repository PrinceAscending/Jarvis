"""Clipboard integration tools for JARVIS."""

import pyperclip
from tools.base import BaseTool, PermissionLevel, ToolResult


class GetClipboardTool(BaseTool):
    name = "get_clipboard"
    description = "Read the current text content from the Windows clipboard."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {},
        "required": []
    }

    async def execute(self) -> ToolResult:
        try:
            text = pyperclip.paste()
            return ToolResult(
                success=True,
                data={"text": text, "length": len(text)},
                message=f"Read {len(text)} characters from clipboard."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class SetClipboardTool(BaseTool):
    name = "set_clipboard"
    description = "Copy text to the Windows clipboard."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "The text to copy to clipboard."}
        },
        "required": ["text"]
    }

    async def execute(self, text: str) -> ToolResult:
        try:
            pyperclip.copy(text)
            return ToolResult(
                success=True,
                data={"length": len(text)},
                message=f"Copied {len(text)} characters to clipboard."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
