"""Safe Python code execution tool for JARVIS."""

import asyncio
import sys
import tempfile
from pathlib import Path
from tools.base import BaseTool, PermissionLevel, ToolResult


class ExecutePythonCodeTool(BaseTool):
    name = "execute_python_code"
    description = "Execute a standalone snippet of Python code and capture its stdout/stderr and return value."
    permission_level = PermissionLevel.HIGH
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "The Python code snippet to run."},
            "timeout_seconds": {"type": "integer", "description": "Max execution time in seconds. Default 15."}
        },
        "required": ["code"]
    }

    async def execute(self, code: str, timeout_seconds: int = 15) -> ToolResult:
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as tmp:
            tmp.write(code)
            tmp_path = Path(tmp.name)

        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable,
                str(tmp_path),
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
                return ToolResult(success=False, error=f"Execution timed out after {timeout_seconds}s.")

            stdout = stdout_bytes.decode("utf-8", errors="replace").strip()
            stderr = stderr_bytes.decode("utf-8", errors="replace").strip()

            return ToolResult(
                success=proc.returncode == 0,
                data={
                    "returncode": proc.returncode,
                    "stdout": stdout,
                    "stderr": stderr
                },
                error=stderr if proc.returncode != 0 else None,
                message=f"Code executed (exit code {proc.returncode})."
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
        finally:
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass
