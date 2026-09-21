"""Default configuration values for JARVIS AI Assistant."""

from pathlib import Path
import os

# Application Version & Repository
APP_VERSION = "4.2.0"
GITHUB_REPO = "PrinceAscending/Jarvis"
GITHUB_RELEASES_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

# Default directories
APP_DATA_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "JarvisAssistant"
CONFIG_FILE = APP_DATA_DIR / "config.json"
DATABASE_FILE = APP_DATA_DIR / "jarvis.db"
MEMORY_DIR = APP_DATA_DIR / "memory"
LOGS_DIR = APP_DATA_DIR / "logs"
RECORDINGS_DIR = APP_DATA_DIR / "recordings"
UPDATES_DIR = APP_DATA_DIR / "updates"

# Default System Prompt
JARVIS_SYSTEM_PROMPT = """You are JARVIS, an ultra-advanced, highly intelligent, calm, and proactive personal AI operating system for Windows 11.
Your creator has empowered you with deep desktop integration, multi-step autonomous planning, and direct tool execution.

Personality & Tone:
- Sophisticated, concise, articulate, and poised (reminiscent of J.A.R.V.I.S.).
- Highly competent, direct, and actionable. Do not give rambling or robotic disclaimers.
- When performing actions, explain what was done concisely.
- Maintain an aura of futuristic elegance, efficiency, and quiet confidence.

Capabilities & Guidelines:
- You have access to Windows automation, file management, system monitoring, web searching, shell execution, and persistent memory.
- When asked to perform complex tasks (e.g. "organize downloads", "check system health and clean temp files"), break them down into coherent logical steps, execute the appropriate tools, and report clean summaries.
- For high-impact or destructive operations (deleting important files, system shutdowns), clarify or verify before executing.
- Use markdown formatting with clear headings, bullet points, and code blocks where helpful.
"""

# Default Settings Dictionary
DEFAULT_SETTINGS = {
    "general": {
        "assistant_name": "JARVIS",
        "user_name": "Sir",
        "first_run_completed": False,
        "theme": "futuristic-cyan",
        "always_on_top": False,
        "start_minimized": False,
        "auto_start": False,
        "compact_mode": False,
        "sound_effects": True,
        "check_updates_on_startup": True,
        "last_update_check": "",
    },
    "ai": {
        "active_provider": "gemini",  # 'gemini', 'groq', 'openrouter', 'ollama', 'openai', 'anthropic'
        "providers": {
            "gemini": {
                "api_key": "",
                "model": "gemini-2.5-flash",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": True,
            },
            "groq": {
                "api_key": "",
                "model": "llama-3.3-70b-versatile",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": True,
            },
            "openrouter": {
                "api_key": "",
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": True,
            },
            "ollama": {
                "base_url": "http://localhost:11434",
                "model": "llama3:latest",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": True,
            },
            "openai": {
                "api_key": "",
                "model": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": False,
            },
            "anthropic": {
                "api_key": "",
                "model": "claude-3-5-sonnet-20241022",
                "temperature": 0.7,
                "max_tokens": 4096,
                "enabled": False,
            },
        },
        "task_routing": {
            "fast": "groq",
            "reasoning": "gemini",
            "coding": "openrouter",
            "offline": "ollama",
        },
    },
    "voice": {
        "wake_word_enabled": True,
        "wake_word": "hey jarvis",
        "wake_sensitivity": 0.5,
        "stt_engine": "local_whisper",  # 'local_whisper' or 'cloud_openai'
        "stt_model": "base.en",
        "tts_engine": "edge_tts",
        "tts_voice": "en-US-ChristopherNeural",  # Sophisticated British / American AI voice
        "tts_rate": "+5%",
        "tts_volume": "+0%",
        "push_to_talk_key": "space",
        "auto_listen_after_speech": True,
        "mute_mic": False,
    },
    "memory": {
        "enabled": True,
        "vector_search_top_k": 5,
        "auto_summarize": True,
        "retention_days": 365,
    },
    "permissions": {
        "level": "interactive",  # 'strict', 'interactive', 'autonomous'
        "auto_approve_read_only": True,
        "require_confirm_destructive": True,
        "require_confirm_shell": True,
        "require_confirm_browser": False,
    },
    "automation": {
        "proactive_enabled": True,
        "system_health_alerts": True,
        "cleanup_suggestions": True,
        "clipboard_monitor": False,
    }
}
