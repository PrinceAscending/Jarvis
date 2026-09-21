"""Integration tests for Setup Wizard, Uninstaller Manifest, and Auto-Updater."""

import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from server.app import app
from core.uninstaller import uninstall_manager
from core.updater import update_manager
from config.settings import settings
import httpx


async def run_feature_tests():
    print("[TEST] Running JARVIS feature tests...")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test Setup Status
        res = await client.get("/api/setup/status")
        assert res.status_code == 200, f"Setup status failed: {res.status_code}"
        data = res.json()
        assert "first_run_completed" in data
        assert "version" in data
        assert "ollama_running" in data
        print(f"[OK] Setup status verified (Version: {data['version']}, Ollama: {data['ollama_running']})")

        # 2. Test Ollama Probe Endpoint
        res = await client.post("/api/setup/detect-ollama")
        assert res.status_code == 200
        data = res.json()
        assert "running" in data
        print(f"[OK] Ollama detection probe verified (Running: {data['running']})")

        # 3. Test Provider Check (Ollama localhost failure handling without crash)
        res = await client.post("/api/setup/test-provider", json={
            "provider": "ollama",
            "base_url": "http://localhost:11434"
        })
        assert res.status_code == 200
        print("[OK] Provider test handler verified")

        # 4. Test Uninstall Manifest
        manifest = uninstall_manager.get_cleanup_manifest()
        assert "app_data_dir" in manifest
        assert "total_size_mb" in manifest
        assert "shortcuts" in manifest
        print(f"[OK] Uninstall manifest verified ({manifest['total_size_mb']} MB data footprint tracked)")

        # 5. Test Uninstall Manifest REST Route
        res = await client.get("/api/uninstall/manifest")
        assert res.status_code == 200
        m_data = res.json()
        assert m_data["app_data_dir"] == manifest["app_data_dir"]
        print("[OK] Uninstall REST route verified")

        # 6. Test Auto-Updater Check
        update_res = await client.get("/api/updates/check")
        assert update_res.status_code == 200
        u_data = update_res.json()
        assert "current_version" in u_data
        print(f"[OK] Auto-updater GitHub check route verified (Current: {u_data.get('current_version')})")

        # 7. Test Setup Complete Configuration Flow
        res = await client.post("/api/setup/complete", json={
            "assistant_name": "JARVIS",
            "user_name": "Commander",
            "active_provider": "gemini",
            "provider_config": {"model": "gemini-2.5-flash"},
            "voice_config": {"tts_voice": "en-US-ChristopherNeural", "tts_rate": "+5%"},
            "permissions_level": "interactive",
            "proactive_enabled": True,
        })
        assert res.status_code == 200
        assert res.json()["status"] == "success"
        assert settings.get("general", "user_name") == "Commander"
        print("[OK] Setup complete persistence and engine reload verified")

    print("==================================================")
    print("      ALL FEATURE TESTS PASSED SUCCESSFULLY!      ")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_feature_tests())
