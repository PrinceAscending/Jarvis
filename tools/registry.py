"""Central tool registry for JARVIS."""

from typing import Any, Dict, List, Optional
from tools.base import BaseTool, PermissionLevel, ToolResult
from tools.file_ops import (
    ListDirectoryTool,
    ReadFileTool,
    WriteFileTool,
    DeleteFileTool,
    OrganizeFolderTool,
)
from tools.system_info import (
    GetSystemStatsTool,
    ListProcessesTool,
    KillProcessTool,
)
from tools.app_launcher import (
    LaunchAppTool,
    OpenUrlTool,
)
from tools.shell import RunShellCommandTool
from tools.web_search import WebSearchTool
from tools.clipboard import GetClipboardTool, SetClipboardTool
from tools.windows_control import (
    TakeScreenshotTool,
    MinimizeAllWindowsTool,
    LockWorkstationTool,
    VolumeControlTool,
)
from tools.code_exec import ExecutePythonCodeTool
from ai.base import ToolDefinition


class ToolRegistry:
    """Manages all available tools and provides schema definition and execution."""

    _instance: Optional["ToolRegistry"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolRegistry, cls).__new__(cls)
            cls._instance._tools = {}
        return cls._instance

    def __init__(self):
        if not getattr(self, "_initialized", False):
            self._tools: Dict[str, BaseTool] = {}
            self._register_default_tools()
            self._initialized = True

    def _register_default_tools(self):
        """Register all built-in desktop tools."""
        tools: List[BaseTool] = [
            # File tools
            ListDirectoryTool(),
            ReadFileTool(),
            WriteFileTool(),
            DeleteFileTool(),
            OrganizeFolderTool(),
            # System info
            GetSystemStatsTool(),
            ListProcessesTool(),
            KillProcessTool(),
            # Apps & web
            LaunchAppTool(),
            OpenUrlTool(),
            WebSearchTool(),
            # Automation & shell
            RunShellCommandTool(),
            ExecutePythonCodeTool(),
            # Desktop controls
            TakeScreenshotTool(),
            MinimizeAllWindowsTool(),
            LockWorkstationTool(),
            VolumeControlTool(),
            # Clipboard
            GetClipboardTool(),
            SetClipboardTool(),
        ]
        for t in tools:
            self.register(t)

    def register(self, tool: BaseTool):
        """Register a new tool."""
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[BaseTool]:
        """Retrieve tool by name."""
        return self._tools.get(name)

    def get_all(self) -> List[BaseTool]:
        """Return list of all registered tools."""
        return list(self._tools.values())

    def get_tool_definitions(self) -> List[ToolDefinition]:
        """Generate AI ToolDefinitions for all registered tools."""
        definitions = []
        for tool in self._tools.values():
            definitions.append(
                ToolDefinition(
                    name=tool.name,
                    description=tool.description,
                    parameters=tool.parameters,
                )
            )
        return definitions

    async def execute(self, name: str, arguments: Dict[str, Any]) -> ToolResult:
        """Execute a tool by name with arguments."""
        tool = self.get(name)
        if not tool:
            return ToolResult(
                success=False,
                error=f"Tool '{name}' is not registered in the system."
            )

        try:
            return await tool.execute(**arguments)
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Exception executing tool '{name}': {str(e)}"
            )


# Global singleton
tool_registry = ToolRegistry()
