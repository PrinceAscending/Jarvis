"""JARVIS Native Windows Window Management & Focus Automation.

Exposes native Win32 window listing, focus switching, state toggling, and closing.
Inspired by SERA's WindowExecutor.
"""

import sys
import ctypes
from ctypes import wintypes
from typing import Dict, Any, List, Optional
from tools.base import BaseTool, PermissionLevel, ToolResult

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

SW_HIDE = 0
SW_SHOWNORMAL = 1
SW_SHOWMINIMIZED = 2
SW_MAXIMIZE = 3
SW_RESTORE = 9
WM_CLOSE = 0x0010


def _ensure_default_desktop():
    """Ensure the calling thread is attached to the interactive Default desktop."""
    try:
        h_desk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if h_desk:
            user32.SetThreadDesktop(h_desk)
    except Exception:
        pass


def _get_window_info(hwnd: int) -> Optional[Dict[str, Any]]:
    if not user32.IsWindowVisible(hwnd):
        return None

    length = user32.GetWindowTextLengthW(hwnd)
    if length == 0:
        return None

    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value.strip()
    if not title:
        return None

    # Get Process ID
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

    # Get Bounding Rect
    rect = wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))

    width = rect.right - rect.left
    height = rect.bottom - rect.top
    if width <= 0 or height <= 0:
        return None

    return {
        "hwnd": hwnd,
        "title": title,
        "pid": pid.value,
        "bounds": {
            "x": rect.left,
            "y": rect.top,
            "width": width,
            "height": height
        },
        "minimized": bool(user32.IsIconic(hwnd)),
        "maximized": bool(user32.IsZoomed(hwnd))
    }


def list_open_windows() -> List[Dict[str, Any]]:
    _ensure_default_desktop()
    windows = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def enum_windows_callback(hwnd, lparam):
        info = _get_window_info(hwnd)
        if info:
            windows.append(info)
        return True

    user32.EnumWindows(WNDENUMPROC(enum_windows_callback), 0)
    return windows


def focus_window_by_title(target_title: str) -> bool:
    target_lower = target_title.lower()
    windows = list_open_windows()

    for win in windows:
        if target_lower in win["title"].lower():
            hwnd = win["hwnd"]
            # Restore if minimized
            if user32.IsIconic(hwnd):
                user32.ShowWindow(hwnd, SW_RESTORE)

            # Bring to front & attach thread input to guarantee focus
            foreground_hwnd = user32.GetForegroundWindow()
            foreground_thread = user32.GetWindowThreadProcessId(foreground_hwnd, None)
            target_thread = user32.GetWindowThreadProcessId(hwnd, None)

            if foreground_thread != target_thread:
                user32.AttachThreadInput(foreground_thread, target_thread, True)
                user32.SetForegroundWindow(hwnd)
                user32.BringWindowToTop(hwnd)
                user32.AttachThreadInput(foreground_thread, target_thread, False)
            else:
                user32.SetForegroundWindow(hwnd)
                user32.BringWindowToTop(hwnd)

            return True
    return False


class ListWindowsTool(BaseTool):
    name = "list_windows"
    description = "List all active, visible application windows on the desktop with titles, PIDs, and coordinates."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "include_minimized": {"type": "boolean", "description": "Whether to include minimized windows (default: true)"}
        }
    }

    async def execute(self, include_minimized: bool = True) -> ToolResult:
        try:
            windows = list_open_windows()
            if not include_minimized:
                windows = [w for w in windows if not w["minimized"]]
            return ToolResult(
                success=True,
                data={"windows": windows, "count": len(windows)},
                message=f"Found {len(windows)} open application windows.",
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class GetActiveWindowTool(BaseTool):
    name = "get_active_window"
    description = "Get information about the currently focused top-level active window."
    permission_level = PermissionLevel.LOW
    parameters = {"type": "object", "properties": {}}

    async def execute(self) -> ToolResult:
        try:
            _ensure_default_desktop()
            hwnd = user32.GetForegroundWindow()
            info = _get_window_info(hwnd)
            if info:
                return ToolResult(
                    success=True,
                    data=info,
                    message=f"Active window: '{info['title']}' (PID: {info['pid']}).",
                )
            return ToolResult(success=False, error="No active top-level window found.")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class FocusWindowTool(BaseTool):
    name = "focus_window"
    description = "Bring a specific window to the foreground and attach keyboard/mouse focus."
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Title or partial title of the window to focus (e.g. 'Notepad', 'Chrome', 'Calculator')"}
        },
        "required": ["title"]
    }

    async def execute(self, title: str) -> ToolResult:
        try:
            success = focus_window_by_title(title)
            if success:
                return ToolResult(
                    success=True,
                    data={"message": f"Successfully focused window matching '{title}'."},
                    message=f"Window '{title}' brought to foreground.",
                )
            return ToolResult(success=False, error=f"No window found matching title '{title}'.")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class SetWindowStateTool(BaseTool):
    name = "set_window_state"
    description = "Change the state of an application window (minimize, maximize, restore, or close)."
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Title or partial title of the target window"},
            "state": {
                "type": "string",
                "enum": ["minimize", "maximize", "restore", "close"],
                "description": "Desired window state action"
            }
        },
        "required": ["title", "state"]
    }

    async def execute(self, title: str, state: str) -> ToolResult:
        try:
            target_lower = title.lower()
            windows = list_open_windows()
            for win in windows:
                if target_lower in win["title"].lower():
                    hwnd = win["hwnd"]
                    if state == "minimize":
                        user32.ShowWindow(hwnd, SW_SHOWMINIMIZED)
                    elif state == "maximize":
                        user32.ShowWindow(hwnd, SW_MAXIMIZE)
                    elif state == "restore":
                        user32.ShowWindow(hwnd, SW_RESTORE)
                    elif state == "close":
                        user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)
                    return ToolResult(
                        success=True,
                        data={"message": f"Window '{win['title']}' state changed to {state}."},
                        message=f"Window '{win['title']}' set to {state}.",
                    )

            return ToolResult(success=False, error=f"Window matching '{title}' not found.")
        except Exception as e:
            return ToolResult(success=False, error=str(e))
