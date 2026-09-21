import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from config.settings import settings
from tools.registry import tool_registry
from memory.manager import memory_manager
from memory.database import db
from voice.tts import tts_engine


async def main():
    print("--- 1. Testing Settings ---")
    name = settings.get("general", "assistant_name")
    print(f"Assistant Name: {name}")
    assert name == "JARVIS", "Assistant name mismatch"

    print("\n--- 2. Testing Tools ---")
    # System stats
    stats_res = await tool_registry.execute("get_system_stats", {})
    print(f"System Stats: {stats_res.success} -> {stats_res.message}")
    assert stats_res.success, f"Stats failed: {stats_res.error}"

    # List Directory
    list_res = await tool_registry.execute("list_directory", {"path": "."})
    print(f"List Directory: {list_res.success} -> {list_res.message}")
    assert list_res.success, f"List dir failed: {list_res.error}"

    # Web search
    search_res = await tool_registry.execute("web_search", {"query": "Windows 11 news", "max_results": 2})
    print(f"Web Search: {search_res.success} -> {search_res.message}")

    print("\n--- 3. Testing Memory & Database ---")
    mem_id = memory_manager.remember_fact("User prefers dark cyan aesthetic and concise responses.", "preferences", 3)
    print(f"Saved memory with ID: {mem_id}")
    memories = memory_manager.list_memories()
    print(f"Total memories retrieved: {len(memories)}")
    assert len(memories) > 0, "No memories found"

    print("\n--- 4. Testing TTS Voices ---")
    voices = await tts_engine.list_available_voices()
    print(f"Available Neural TTS Voices: {len(voices)}")
    assert len(voices) > 0, "No TTS voices found"

    print("\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    asyncio.run(main())
