"""Security and permissions engine for JARVIS."""

from typing import Any, Dict, Optional, Tuple
from tools.base import BaseTool, PermissionLevel
from config.settings import settings
from memory.database import db


class PermissionManager:
    """Evaluates whether an action can execute automatically or requires confirmation."""

    _instance: Optional["PermissionManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PermissionManager, cls).__new__(cls)
        return cls._instance

    def check_permission(self, tool: BaseTool, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Check if tool can proceed.
        Returns: (allowed: bool, reason_or_prompt: Optional[str])
        """
        level_mode = settings.get("permissions", "level", "interactive")

        # In autonomous mode, all non-critical tools run automatically
        if level_mode == "autonomous":
            if tool.permission_level == PermissionLevel.CRITICAL:
                return False, f"Critical security action '{tool.name}' requires explicit operator confirmation."
            return True, None

        # In strict mode, only LOW can run without confirmation
        if level_mode == "strict":
            if tool.permission_level != PermissionLevel.LOW:
                return False, f"Strict security: '{tool.name}' ({tool.permission_level.value}) requires confirmation."
            return True, None

        # Interactive mode (default)
        if tool.permission_level == PermissionLevel.LOW:
            return True, None

        if tool.permission_level == PermissionLevel.MEDIUM:
            # Medium is allowed if auto_approve_read_only or general modifications are permitted
            return True, None

        if tool.permission_level in (PermissionLevel.HIGH, PermissionLevel.CRITICAL):
            # Check specific overrides
            if tool.name == "run_shell_command" and settings.get("permissions", "require_confirm_shell", True):
                return False, f"Shell command '{arguments.get('command')}' requires confirmation."
            if tool.name in ("delete_file", "kill_process") and settings.get("permissions", "require_confirm_destructive", True):
                return False, f"Destructive action '{tool.name}' requires confirmation."

        return True, None

    def record_action(self, tool_name: str, arguments: Dict[str, Any], result: Any, status: str):
        """Record executed tool in audit database."""
        db.log_audit(tool_name, arguments, result, status)


# Global singleton
permission_manager = PermissionManager()
