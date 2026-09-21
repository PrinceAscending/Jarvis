"""Web search tool for JARVIS using DuckDuckGo — Free and real-time."""

from typing import List, Optional
from duckduckgo_search import DDGS
from tools.base import BaseTool, PermissionLevel, ToolResult


class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the live Internet for current real-time information, news, documentation, or answers."
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search keywords or question."},
            "max_results": {"type": "integer", "description": "Number of results to retrieve (default: 5)."}
        },
        "required": ["query"]
    }

    async def execute(self, query: str, max_results: int = 5) -> ToolResult:
        try:
            results = []
            # Run in thread or direct context
            with DDGS() as ddgs:
                raw_results = list(ddgs.text(query, max_results=max_results))
                for r in raw_results:
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", "")
                    })

            return ToolResult(
                success=True,
                data={"query": query, "count": len(results), "results": results},
                message=f"Found {len(results)} search results for '{query}'."
            )
        except Exception as e:
            return ToolResult(success=False, error=f"Search failed: {e}")
