"""Autonomous workflow engine for multi-step tasks in JARVIS."""

from typing import Any, Dict, List, Optional
from tools.registry import tool_registry
from tools.base import ToolResult


class WorkflowEngine:
    """Executes composite multi-step automated workflows."""

    @classmethod
    async def run_system_health_audit(cls) -> Dict[str, Any]:
        """Runs a complete system health check."""
        stats = await tool_registry.execute("get_system_stats", {})
        procs = await tool_registry.execute("list_processes", {"limit": 10, "sort_by": "memory"})

        return {
            "workflow": "System Health Audit",
            "stats": stats.data if stats.success else None,
            "top_memory_consumers": procs.data if procs.success else None,
            "status": "completed",
        }

    @classmethod
    async def organize_workspace(cls, target_folder: str = "~/Downloads", dry_run: bool = False) -> Dict[str, Any]:
        """Runs intelligent folder organization."""
        res = await tool_registry.execute("organize_folder", {"folder_path": target_folder, "dry_run": dry_run})
        return {
            "workflow": "Workspace Organizer",
            "folder": target_folder,
            "result": res.data if res.success else None,
            "error": res.error,
        }
