"""Shell and PowerShell execution tool for JARVIS."""

import asyncio
import os
import subprocess
from typing import Optional
from tools.base import BaseTool, PermissionLevel, ToolResult


class RunShellCommandTool(BaseTool):
    name = "run_shell_command"
    description = "Execute a command in PowerShell or CMD on Windows with real-time output capture."
    permission_level = PermissionLevel.HIGH
    parameters = {
        "type": "object",
        "properties": {
            "command": {"type": "string", "description": "The command line string to execute."},
            "shell": {"type": "string", "enum": ["powershell", "cmd"], "description": "Shell environment: 'powershell' (default) or 'cmd'."},
            "timeout_seconds": {"type": "integer", "description": "Maximum execution time in seconds. Default is 30."}
        },
        "required": ["command"]
    }

    # Block extremely destructive commands for safety
    BLACKLISTED_PATTERNS = [
        "format c:",
        "rmdir /s /q c:\\windows",
        "del /f /s /q c:\\windows",
        "drop database",
        ":(){ :|:& };:",
    ]

    async def execute(self, command: str, shell: str = "powershell", timeout_seconds: int = 30) -> ToolResult:
        cmd_lower = command.lower()
        for dangerous in self.BLACKLISTED_PATTERNS:
            if dangerous in cmd_lower:
                return ToolResult(
                    success=False,
                    error=f"Execution blocked: Command matches prohibited dangerous pattern: '{dangerous}'"
                )

        try:
            if shell == "powershell":
                shell_cmd = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command]
            else:
                shell_cmd = ["cmd.exe", "/c", command]

            proc = await asyncio.create_subprocess_exec(
                *shell_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(), timeout=float(timeout_seconds)
                )
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                return ToolResult(
                    success=False,
                    error=f"Command timed out after {timeout_seconds} seconds."
                )

            stdout = stdout_bytes.decode("utf-8", errors="replace").strip()
            stderr = stderr_bytes.decode("utf-8", errors="replace").strip()

            return ToolResult(
                success=proc.returncode == 0,
                data={
                    "command": command,
                    "returncode": proc.returncode,
                    "stdout": stdout,
                    "stderr": stderr,
                },
                error=stderr if proc.returncode != 0 else None,
                message=f"Command exited with code {proc.returncode}."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
