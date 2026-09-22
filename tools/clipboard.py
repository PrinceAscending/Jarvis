"""Clipboard integration tools for JARVIS.

Provides clipboard read/write capabilities and safe clipboard preservation
so automations never overwrite the user's copied data without restoring it.
Inspired by SERA-v1 clipboard restore tools.
"""

from contextlib import contextmanager
from typing import Optional
import pyperclip
from tools.base import BaseTool, PermissionLevel, ToolResult

_SAVED_CLIPBOARD_CONTENT: Optional[str] = None


def snapshot_clipboard() -> Optional[str]:
    """Capture and store the current clipboard string."""
    global _SAVED_CLIPBOARD_CONTENT
    try:
        _SAVED_CLIPBOARD_CONTENT = pyperclip.paste()
        return _SAVED_CLIPBOARD_CONTENT
    except Exception:
        return None


def restore_clipboard() -> bool:
    """Restore the previously captured clipboard string."""
    global _SAVED_CLIPBOARD_CONTENT
    if _SAVED_CLIPBOARD_CONTENT is not None:
        try:
            pyperclip.copy(_SAVED_CLIPBOARD_CONTENT)
            return True
        except Exception:
            return False
    return False


@contextmanager
def preserve_clipboard():
    """Context manager that guarantees original clipboard is restored upon exit."""
    saved = snapshot_clipboard()
    try:
        yield saved
    finally:
        restore_clipboard()


class GetClipboardTool(BaseTool):
    name = "get_clipboard"
    description = "Read the current text content from the Windows clipboard."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {},
        "required": [],
    }

    async def execute(self) -> ToolResult:
        try:
            text = pyperclip.paste()
            return ToolResult(
                success=True,
                data={"text": text, "length": len(text)},
                message=f"Read {len(text)} characters from clipboard.",
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
        "required": ["text"],
    }

    async def execute(self, text: str) -> ToolResult:
        try:
            pyperclip.copy(text)
            return ToolResult(
                success=True,
                data={"length": len(text)},
                message=f"Copied {len(text)} characters to clipboard.",
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
