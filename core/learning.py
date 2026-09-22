"""JARVIS Mistake Reflection & Anti-Regression Engine.
Learns from tool execution errors, records corrective workarounds,
and performs pre-flight checks to prevent recurring failures.
Inspired by SERA's ErrorReflectionEngine.
"""

import re
import time
import json
import sqlite3
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from config.settings import settings


def get_db_path() -> Path:
    app_data = Path(settings.get("general", "data_dir", ""))
    if not app_data or not app_data.exists():
        app_data = Path.home() / "AppData" / "Local" / "JarvisAssistant"
    app_data.mkdir(parents=True, exist_ok=True)
    return app_data / "jarvis.db"


class MistakeStore:
    """SQLite-backed persistent store for learned mistakes and anti-regression rules."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or get_db_path()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS mistake_records (
                    id TEXT PRIMARY KEY,
                    failure_signature TEXT UNIQUE,
                    tool_name TEXT NOT NULL,
                    root_cause TEXT NOT NULL,
                    workaround TEXT NOT NULL,
                    error_class TEXT NOT NULL,
                    occurrences INTEGER DEFAULT 1,
                    context_json TEXT,
                    created_at REAL,
                    last_seen_at REAL
                )
            """)
            conn.commit()

    def find_match(self, signature: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM mistake_records WHERE failure_signature = ?",
                (signature,)
            ).fetchone()
            if row:
                return dict(row)
        return None

    def record_mistake(
        self,
        tool_name: str,
        signature: str,
        root_cause: str,
        workaround: str,
        error_class: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        now = time.time()
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT occurrences FROM mistake_records WHERE failure_signature = ?",
                (signature,)
            ).fetchone()

            if row:
                occurrences = row["occurrences"] + 1
                conn.execute("""
                    UPDATE mistake_records
                    SET occurrences = ?, root_cause = ?, workaround = ?, last_seen_at = ?, context_json = ?
                    WHERE failure_signature = ?
                """, (occurrences, root_cause, workaround, now, json.dumps(context or {}), signature))
            else:
                record_id = f"mstk_{int(now)}_{abs(hash(signature)) % 10000}"
                conn.execute("""
                    INSERT INTO mistake_records (
                        id, failure_signature, tool_name, root_cause, workaround,
                        error_class, occurrences, context_json, created_at, last_seen_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
                """, (
                    record_id, signature, tool_name, root_cause, workaround,
                    error_class, json.dumps(context or {}), now, now
                ))
            conn.commit()

        return self.find_match(signature) or {}

    def get_all_records(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM mistake_records ORDER BY last_seen_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]


def normalize_signature(tool_name: str, error: str, args: Optional[Dict[str, Any]] = None) -> str:
    """Normalizes raw error text and argument keys into a stable signature.
    Strips dynamic PIDs, hex addresses, and file paths.
    """
    def clean(text: str) -> str:
        t = text.lower()
        t = re.sub(r'0x[0-9a-f]+', ' # ', t)
        t = re.sub(r'\b\d[\d.,:]*\b', ' # ', t)
        t = re.sub(r'[a-z]:\\[^"\'\s]+', ' <path> ', t)
        t = re.sub(r'/[a-z0-9_.-]+/[a-z0-9_.-]+', ' <path> ', t)
        t = re.sub(r'[^\w\s<>#-]', ' ', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    parts = [clean(tool_name or 'unknown-tool'), clean(error or 'unknown-error')]
    if args and isinstance(args, dict):
        keys = "+".join(sorted([k for k in args.keys()]))
        if keys:
            parts.append(f"args:{keys}")
    return " :: ".join(parts)[:400]


def classify_error(error_text: str) -> str:
    t = error_text.lower()
    if any(k in t for k in ['unauthorized', 'permission', 'denied', 'access is denied', 'administrator']):
        return 'auth'
    if any(k in t for k in ['invalid arguments', 'validation', 'missing required', 'parameter', 'expected']):
        return 'param'
    if any(k in t for k in ['not installed', 'command not found', 'no such file', 'enoent', 'econnrefused', 'connection refused']):
        return 'env'
    if any(k in t for k in ['timeout', 'timed out', 'busy', 'focus race', 'window lost focus', 'temporarily unavailable']):
        return 'transient'
    return 'unknown'


# Built-in seed heuristics
HEURISTICS = [
    {
        "pattern": re.compile(r"window (?:lost|not|does not have) focus|keystroke|active window", re.I),
        "root_cause": "Target window was not in the foreground; keystrokes or clicks missed.",
        "workaround": "Call focus_window before sending input or keystrokes."
    },
    {
        "pattern": re.compile(r"no such file or directory|file not found", re.I),
        "root_cause": "Target file or directory path does not exist or has invalid quotes.",
        "workaround": "Verify path existence or create parent directories before operating."
    },
    {
        "pattern": re.compile(r"timed out|connection refused|11434", re.I),
        "root_cause": "Local Ollama server is offline or unreachable on port 11434.",
        "workaround": "Ensure Ollama service is started via Start-Process ollama or check settings."
    }
]


class ErrorReflectionEngine:
    """Reflects on execution failures, stores lessons, and supplies pre-flight corrections."""

    def __init__(self, store: Optional[MistakeStore] = None):
        self.store = store or MistakeStore()

    def pre_flight_check(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Runs before tool execution. If a matching mistake exists, injects corrective hints."""
        dummy_sig_prefix = f"{tool_name.lower()} ::"
        records = self.store.get_all_records(limit=20)
        for r in records:
            if r["tool_name"].lower() == tool_name.lower():
                return {
                    "has_hint": True,
                    "hint": r["workaround"],
                    "root_cause": r["root_cause"],
                    "occurrences": r["occurrences"]
                }
        return {"has_hint": False, "hint": None}

    def reflect_and_learn(
        self,
        tool_name: str,
        args: Dict[str, Any],
        error_text: str
    ) -> Dict[str, Any]:
        """Analyzes a failure, categorizes root cause, extracts workaround, and persists."""
        signature = normalize_signature(tool_name, error_text, args)
        err_class = classify_error(error_text)

        root_cause = f"Error during {tool_name}: {error_text[:120]}"
        workaround = f"Review arguments or retry with verified parameters."

        for h in HEURISTICS:
            if h["pattern"].search(error_text):
                root_cause = h["root_cause"]
                workaround = h["workaround"]
                break

        if err_class == 'auth':
            workaround = "Request elevated privileges or user confirmation before retrying."
        elif err_class == 'param':
            workaround = "Check required parameter schema and format."
        elif err_class == 'env':
            workaround = "Verify external tool or environment dependency is active."

        record = self.store.record_mistake(
            tool_name=tool_name,
            signature=signature,
            root_cause=root_cause,
            workaround=workaround,
            error_class=err_class,
            context={"args": args, "raw_error": error_text[:300]}
        )

        return {
            "signature": signature,
            "error_class": err_class,
            "root_cause": root_cause,
            "workaround": workaround,
            "occurrences": record.get("occurrences", 1)
        }


# Global singleton
learning_engine = ErrorReflectionEngine()
