"""Application and URL launcher tools for JARVIS."""

import os
import subprocess
import webbrowser
from typing import Optional
from tools.base import BaseTool, PermissionLevel, ToolResult


class LaunchAppTool(BaseTool):
    name = "launch_application"
    description = "Launch a Windows application by name, command, or executable path (e.g., 'notepad', 'calc', 'chrome', 'code', 'explorer', 'cmd', 'mspaint')."
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "app_name_or_path": {"type": "string", "description": "Application name or path (e.g., 'notepad', 'calc', 'chrome', 'spotify', 'code', 'explorer.exe')."},
            "arguments": {"type": "string", "description": "Optional command line arguments to pass."}
        },
        "required": ["app_name_or_path"]
    }

    # Map friendly names to standard Windows executables
    APP_ALIASES = {
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "notepad": "notepad.exe",
        "editor": "notepad.exe",
        "paint": "mspaint.exe",
        "explorer": "explorer.exe",
        "files": "explorer.exe",
        "terminal": "wt.exe",
        "cmd": "cmd.exe",
        "powershell": "powershell.exe",
        "task manager": "taskmgr.exe",
        "taskmgr": "taskmgr.exe",
        "settings": "start ms-settings:",
        "chrome": "start chrome",
        "edge": "start msedge",
        "vscode": "code",
        "code": "code",
    }

    async def execute(self, app_name_or_path: str, arguments: Optional[str] = None) -> ToolResult:
        try:
            target = app_name_or_path.lower().strip()
            command = self.APP_ALIASES.get(target, app_name_or_path)

            if arguments:
                command = f"{command} {arguments}"

            # Run in detached process so JARVIS is not blocked
            if os.name == "nt":
                subprocess.Popen(
                    command,
                    shell=True,
                    creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
                )
            else:
                subprocess.Popen(command, shell=True)

            return ToolResult(
                success=True,
                data={"launched": app_name_or_path, "command": command},
                message=f"Launched '{app_name_or_path}' successfully."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class OpenUrlTool(BaseTool):
    name = "open_url"
    description = "Open a website or web URL in the user's default web browser."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "The URL to open in browser (e.g. 'https://google.com')."}
        },
        "required": ["url"]
    }

    async def execute(self, url: str) -> ToolResult:
        try:
            target_url = url.strip()
            if not target_url.startswith(("http://", "https://")):
                target_url = f"https://{target_url}"

            webbrowser.open(target_url)

            return ToolResult(
                success=True,
                data={"url": target_url},
                message=f"Opened '{target_url}' in default browser."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
