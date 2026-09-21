"""Windows desktop control and automation tools for JARVIS."""

import os
import time
import base64
import io
import ctypes
from pathlib import Path
from typing import Optional
from tools.base import BaseTool, PermissionLevel, ToolResult
from config.defaults import APP_DATA_DIR
import pyautogui

# Set DPI Awareness to prevent coordinate mismatches
if os.name == "nt":
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass


class TakeScreenshotTool(BaseTool):
    name = "take_screenshot"
    description = "Capture the current primary screen and save it or return preview."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "save_to_disk": {"type": "boolean", "description": "Whether to save image file to disk. Defaults to True."}
        },
        "required": []
    }

    async def execute(self, save_to_disk: bool = True) -> ToolResult:
        try:
            screenshot = pyautogui.screenshot()
            screenshots_dir = APP_DATA_DIR / "screenshots"
            screenshots_dir.mkdir(parents=True, exist_ok=True)

            timestamp = int(time.time())
            filepath = screenshots_dir / f"screen_{timestamp}.png"

            if save_to_disk:
                screenshot.save(filepath)

            # Also create lightweight base64 thumbnail for UI preview
            buffer = io.BytesIO()
            thumb = screenshot.resize((screenshot.width // 4, screenshot.height // 4))
            thumb.save(buffer, format="JPEG", quality=60)
            b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return ToolResult(
                success=True,
                data={
                    "saved_path": str(filepath) if save_to_disk else None,
                    "resolution": f"{screenshot.width}x{screenshot.height}",
                    "thumbnail_base64": f"data:image/jpeg;base64,{b64_str}"
                },
                message=f"Captured screenshot ({screenshot.width}x{screenshot.height})."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class MinimizeAllWindowsTool(BaseTool):
    name = "minimize_all_windows"
    description = "Show Windows Desktop by minimizing all active windows."
    permission_level = PermissionLevel.LOW
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self) -> ToolResult:
        try:
            pyautogui.hotkey('win', 'd')
            return ToolResult(success=True, message="Minimized all windows to show Desktop.")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class LockWorkstationTool(BaseTool):
    name = "lock_workstation"
    description = "Lock the Windows PC immediately for security."
    permission_level = PermissionLevel.HIGH
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self) -> ToolResult:
        try:
            if os.name == "nt":
                ctypes.windll.user32.LockWorkStation()
                return ToolResult(success=True, message="Windows workstation locked successfully.")
            return ToolResult(success=False, error="Lock is only supported on Windows.")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class VolumeControlTool(BaseTool):
    name = "volume_control"
    description = "Adjust or mute master system audio volume."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["up", "down", "mute"], "description": "'up' to increase volume, 'down' to decrease, 'mute' to toggle mute."},
            "steps": {"type": "integer", "description": "Number of volume steps (default: 5)."}
        },
        "required": ["action"]
    }

    async def execute(self, action: str, steps: int = 5) -> ToolResult:
        try:
            key_map = {
                "up": "volumeup",
                "down": "volumedown",
                "mute": "volumemute"
            }
            key = key_map.get(action)
            if not key:
                return ToolResult(success=False, error=f"Invalid action '{action}'.")

            count = 1 if action == "mute" else max(1, min(steps, 25))
            for _ in range(count):
                pyautogui.press(key)
                time.sleep(0.02)

            return ToolResult(success=True, message=f"Audio volume action '{action}' performed ({count} steps).")
        except Exception as e:
            return ToolResult(success=False, error=str(e))
