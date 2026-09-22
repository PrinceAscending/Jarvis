"""Screen Memory Digest for JARVIS.

Maintains a chronological bounded digest of recent screen OCR captures
so JARVIS can answer questions about what was on the screen earlier.
Inspired by SERA-v1 screen memory intelligence.
"""

import time
import hashlib
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from tools.base import BaseTool, PermissionLevel, ToolResult

logger = logging.getLogger("jarvis.screen_memory")


@dataclass
class ScreenSnapshot:
    timestamp: float
    text_digest: str
    word_count: int
    alerts: List[str]
    active_window: Optional[str] = None
    text_hash: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "readable_time": time.strftime("%H:%M:%S", time.localtime(self.timestamp)),
            "word_count": self.word_count,
            "alerts": self.alerts,
            "active_window": self.active_window,
            "text_preview": self.text_digest[:400] + ("..." if len(self.text_digest) > 400 else ""),
        }


class ScreenMemoryDigest:
    """In-memory bounded chronological digest of past screen states."""

    def __init__(self, max_entries: int = 30):
        self.max_entries = max_entries
        self.snapshots: List[ScreenSnapshot] = []

    def record_snapshot(
        self,
        text: str,
        alerts: Optional[List[str]] = None,
        active_window: Optional[str] = None,
    ) -> bool:
        """Record an OCR screen capture into memory. Deduplicates identical consecutive states."""
        clean_text = text.strip()
        if not clean_text:
            return False

        # Compute simple hash for deduplication
        text_hash = hashlib.sha256(clean_text[:2000].encode("utf-8")).hexdigest()

        # Deduplicate if identical to the latest snapshot
        if self.snapshots and self.snapshots[-1].text_hash == text_hash:
            return False

        words = clean_text.split()
        snapshot = ScreenSnapshot(
            timestamp=time.time(),
            text_digest=clean_text,
            word_count=len(words),
            alerts=alerts or [],
            active_window=active_window,
            text_hash=text_hash,
        )

        self.snapshots.append(snapshot)
        if len(self.snapshots) > self.max_entries:
            self.snapshots.pop(0)

        logger.debug(f"Screen snapshot recorded. Total in memory: {len(self.snapshots)}")
        return True

    def query(self, search_term: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search past screen states for a keyword, error, or phrase."""
        term_clean = search_term.strip().lower()
        if not term_clean:
            return [s.to_dict() for s in reversed(self.snapshots[-limit:])]

        results = []
        for s in reversed(self.snapshots):
            if term_clean in s.text_digest.lower() or any(term_clean in a.lower() for a in s.alerts):
                # Extract matching snippet
                idx = s.text_digest.lower().find(term_clean)
                start = max(0, idx - 100)
                end = min(len(s.text_digest), idx + len(term_clean) + 100)
                snippet = s.text_digest[start:end].replace("\n", " ").strip()

                entry = s.to_dict()
                entry["matching_snippet"] = f"...{snippet}..."
                results.append(entry)
                if len(results) >= limit:
                    break

        return results

    def get_recent(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Return the most recent screen digests."""
        return [s.to_dict() for s in reversed(self.snapshots[-limit:])]

    def clear(self):
        """Clear screen memory."""
        self.snapshots.clear()


# Global instance
screen_memory = ScreenMemoryDigest()


class QueryScreenMemoryTool(BaseTool):
    """Tool to search what was previously visible on screen."""

    name = "query_screen_memory"
    description = (
        "Search past screen states to recall what was on the user's screen earlier, "
        "including past error messages, URLs, terminal outputs, or documents."
    )
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Keyword, phrase, or error code to search in screen history.",
            },
            "limit": {
                "type": "integer",
                "description": "Max number of screen memory snapshots to inspect (default: 3).",
            },
        },
        "required": ["query"],
    }

    async def execute(self, query: str, limit: int = 3) -> ToolResult:
        try:
            results = screen_memory.query(query, limit=limit)
            if not results:
                return ToolResult(
                    success=True,
                    data={"matches": []},
                    message=f"No matching screen history found for '{query}'.",
                )

            return ToolResult(
                success=True,
                data={"matches": results},
                message=f"Found {len(results)} past screen states matching '{query}'.",
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
