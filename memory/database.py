"""SQLite persistence layer for JARVIS conversations, long-term memory, and audit logs."""

import json
import sqlite3
from typing import Any, Dict, List, Optional
from config.defaults import DATABASE_FILE


class DatabaseManager:
    """Manages SQLite database tables and queries."""

    _instance: Optional["DatabaseManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._init_db()
        return cls._instance

    def _init_db(self):
        """Create database tables if they do not exist."""
        DATABASE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(DATABASE_FILE) as conn:
            cursor = conn.cursor()

            # Conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    role TEXT,
                    content TEXT,
                    tool_calls TEXT,
                    tool_call_id TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                )
            """)

            # Long-term memories
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    category TEXT,
                    content TEXT,
                    importance INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # User preferences
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Audit logs
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tool_name TEXT,
                    arguments TEXT,
                    result TEXT,
                    status TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(DATABASE_FILE)
        conn.row_factory = sqlite3.Row
        return conn

    # Conversation queries
    def create_conversation(self, conv_id: str, title: str = "New Conversation"):
        with self.get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO conversations (id, title, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (conv_id, title)
            )
            conn.commit()

    def list_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.execute(
                "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT ?",
                (limit,)
            )
            return [dict(row) for row in cur.fetchall()]

    def save_message(self, msg_id: str, conv_id: str, role: str, content: str, tool_calls: Optional[List[Dict[str, Any]]] = None, tool_call_id: Optional[str] = None):
        with self.get_connection() as conn:
            conn.execute(
                """INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_call_id)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (msg_id, conv_id, role, content, json.dumps(tool_calls) if tool_calls else None, tool_call_id)
            )
            conn.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conv_id,)
            )
            conn.commit()

    def get_messages(self, conv_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.execute(
                "SELECT id, role, content, tool_calls, tool_call_id, timestamp FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?",
                (conv_id, limit)
            )
            rows = []
            for r in cur.fetchall():
                d = dict(r)
                if d.get("tool_calls"):
                    try:
                        d["tool_calls"] = json.loads(d["tool_calls"])
                    except Exception:
                        pass
                rows.append(d)
            return rows

    # Long-term memories
    def add_memory(self, memory_id: str, category: str, content: str, importance: int = 1):
        with self.get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO memories (id, category, content, importance) VALUES (?, ?, ?, ?)",
                (memory_id, category, content, importance)
            )
            conn.commit()

    def list_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            if category:
                cur = conn.execute("SELECT * FROM memories WHERE category = ? ORDER BY importance DESC, created_at DESC", (category,))
            else:
                cur = conn.execute("SELECT * FROM memories ORDER BY importance DESC, created_at DESC")
            return [dict(row) for row in cur.fetchall()]

    def delete_memory(self, memory_id: str) -> bool:
        with self.get_connection() as conn:
            cur = conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            conn.commit()
            return cur.rowcount > 0

    # User preferences
    def set_preference(self, key: str, value: Any):
        val_str = json.dumps(value) if not isinstance(value, str) else value
        with self.get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO user_preferences (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (key, val_str)
            )
            conn.commit()

    def get_preference(self, key: str, default: Any = None) -> Any:
        with self.get_connection() as conn:
            cur = conn.execute("SELECT value FROM user_preferences WHERE key = ?", (key,))
            row = cur.fetchone()
            if not row:
                return default
            val = row["value"]
            try:
                return json.loads(val)
            except Exception:
                return val

    def get_all_preferences(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.execute("SELECT key, value FROM user_preferences")
            result = {}
            for r in cur.fetchall():
                try:
                    result[r["key"]] = json.loads(r["value"])
                except Exception:
                    result[r["key"]] = r["value"]
            return result

    # Audit logging
    def log_audit(self, tool_name: str, arguments: Dict[str, Any], result: Any, status: str):
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO audit_logs (tool_name, arguments, result, status) VALUES (?, ?, ?, ?)",
                (tool_name, json.dumps(arguments), json.dumps(result) if not isinstance(result, str) else result, status)
            )
            conn.commit()

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,)
            )
            return [dict(r) for r in cur.fetchall()]


# Global singleton
db = DatabaseManager()
