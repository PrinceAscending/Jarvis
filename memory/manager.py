"""Unified Memory Manager for JARVIS — Context injection and recall."""

import uuid
from typing import Any, Dict, List, Optional
from memory.database import db
from ai.base import ChatMessage


class MemoryManager:
    """Coordinates short-term conversational context and persistent memories."""

    _instance: Optional["MemoryManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryManager, cls).__new__(cls)
        return cls._instance

    def remember_fact(self, content: str, category: str = "general", importance: int = 2) -> str:
        """Store an important user fact or preference in persistent memory."""
        mem_id = f"mem_{uuid.uuid4().hex[:8]}"
        db.add_memory(mem_id, category, content, importance)
        return mem_id

    def list_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve all active memories."""
        return db.list_memories(category)

    def delete_memory(self, memory_id: str) -> bool:
        """Remove a memory."""
        return db.delete_memory(memory_id)

    def get_context_injection(self, query: Optional[str] = None) -> str:
        """Synthesize relevant preferences and memories into a prompt context section."""
        memories = db.list_memories()
        prefs = db.get_all_preferences()

        if not memories and not prefs:
            return ""

        lines = ["\n[PERSISTENT USER MEMORY & PREFERENCES]"]
        if prefs:
            lines.append("User Preferences:")
            for k, v in prefs.items():
                lines.append(f"- {k}: {v}")

        if memories:
            lines.append("Known Facts & Notes:")
            for m in memories[:10]:  # Top 10 by importance
                lines.append(f"- [{m['category']}] {m['content']}")

        lines.append("[END MEMORY CONTEXT]\n")
        return "\n".join(lines)


# Global singleton
memory_manager = MemoryManager()
