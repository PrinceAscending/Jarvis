"""Base classes and schemas for the JARVIS Tool System."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional


class PermissionLevel(str, Enum):
    """Permission requirements for tool execution."""
    LOW = "low"            # Safe read-only operations (e.g., get system stats, read non-sensitive file)
    MEDIUM = "medium"      # Standard modifications (e.g., write notes, copy files, open apps)
    HIGH = "high"          # Potentially destructive / system-level (e.g., delete files, kill process, shell command)
    CRITICAL = "critical"  # Security-sensitive (e.g., credential access, formatting disk, registry edits)


@dataclass
class ToolResult:
    """Standardized output structure for any tool execution."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    message: str = ""
    artifacts: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "message": self.message,
            "artifacts": self.artifacts,
        }


class BaseTool(ABC):
    """Abstract base class for all tools."""

    name: str = ""
    description: str = ""
    parameters: Dict[str, Any] = {}
    permission_level: PermissionLevel = PermissionLevel.LOW

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool action."""
        pass
