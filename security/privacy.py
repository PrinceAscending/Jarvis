"""Secret and Privacy Redaction Engine for JARVIS.

Scans and redacts API keys, passwords, bearer tokens, and private credentials
before writing to logs, long-term memory, or screen history.
Inspired by SERA-v1 security filter.
"""

import re
from typing import Any, Dict, List, Union

# Compiled regex patterns for common API keys and confidential credentials
SECRET_PATTERNS = [
    # OpenAI API Keys
    (re.compile(r"sk-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE), "[REDACTED_OPENAI_KEY]"),
    # Google Cloud / Gemini API Keys
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"), "[REDACTED_GOOGLE_KEY]"),
    # Anthropic API Keys
    (re.compile(r"sk-ant-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE), "[REDACTED_ANTHROPIC_KEY]"),
    # GitHub Personal Access Tokens
    (re.compile(r"gh[pousr]_[A-Za-z0-9_]{36,}"), "[REDACTED_GITHUB_TOKEN]"),
    # AWS Access Key IDs
    (re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"), "[REDACTED_AWS_KEY]"),
    # Bearer HTTP Tokens
    (re.compile(r"(Bearer\s+)[a-zA-Z0-9_\-\.]{20,}", re.IGNORECASE), r"\1[REDACTED_BEARER_TOKEN]"),
    # Generic password assignments in JSON/URLs
    (re.compile(r'("(?:password|secret|api_key|token|access_token|private_key)"\s*:\s*")([^"]+)(")', re.IGNORECASE), r'\1[REDACTED]\3'),
    (re.compile(r'((?:password|secret|api_key|token)=)([^&\s]+)', re.IGNORECASE), r'\1[REDACTED]'),
]


def redact_secrets(text: str) -> str:
    """Scan and redact sensitive tokens from text."""
    if not isinstance(text, str) or not text:
        return text

    sanitized = text
    for pattern, replacement in SECRET_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)

    return sanitized


def contains_secrets(text: str) -> bool:
    """Return True if any secret pattern matches the text."""
    if not isinstance(text, str) or not text:
        return False

    for pattern, _ in SECRET_PATTERNS:
        if pattern.search(text):
            return True

    return False


def redact_data(obj: Any) -> Any:
    """Recursively redact strings in dictionaries, lists, or primitives."""
    if isinstance(obj, str):
        return redact_secrets(obj)
    elif isinstance(obj, dict):
        return {k: redact_data(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [redact_data(v) for v in obj]
    return obj
