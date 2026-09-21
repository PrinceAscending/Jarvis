from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import asyncio
import sys
import httpx
from config.settings import settings
from config.defaults import APP_VERSION
from memory.database import db
from memory.manager import memory_manager
from tools.registry import tool_registry
from ai.manager import ai_manager
from voice.tts import tts_engine
from voice.pipeline import voice_pipeline
from core.updater import update_manager
from core.uninstaller import uninstall_manager
from security.credentials import CredentialVault
import psutil

router = APIRouter(prefix="/api")


# Request models
class ExecuteToolRequest(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}


class TestProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str] = ""
    model: Optional[str] = ""
    base_url: Optional[str] = ""


class SetupCompleteRequest(BaseModel):
    assistant_name: str = "JARVIS"
    user_name: str = "Sir"
    active_provider: str = "gemini"
    provider_config: Dict[str, Any] = {}
    voice_config: Dict[str, Any] = {}
    permissions_level: str = "interactive"
    proactive_enabled: bool = True


class UninstallRequest(BaseModel):
    confirm_code: str
    remove_install_dir: bool = True


class DownloadUpdateRequest(BaseModel):
    download_url: str


class RememberRequest(BaseModel):
    content: str
    category: str = "general"
    importance: int = 1


class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None


@router.get("/status")
async def get_status():
    """Health check and active provider overview."""
    active_prov = settings.get("ai", "active_provider", "gemini")
    prov_cfg = settings.get("ai", "providers", {}).get(active_prov, {})
    return {
        "status": "online",
        "assistant_name": settings.get("general", "assistant_name", "JARVIS"),
        "active_provider": active_prov,
        "active_model": prov_cfg.get("model", "default"),
        "theme": settings.get("general", "theme", "futuristic-cyan"),
    }


@router.get("/system/stats")
async def get_system_stats():
    """Live telemetry stats for UI dashboard."""
    vm = psutil.virtual_memory()
    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_percent": vm.percent,
        "ram_used_gb": round(vm.used / (1024**3), 2),
        "ram_total_gb": round(vm.total / (1024**3), 2),
    }


@router.get("/settings")
async def get_settings():
    """Retrieve current settings."""
    return settings.to_dict()


@router.post("/settings")
async def update_settings(payload: Dict[str, Any]):
    """Update settings."""
    for section, values in payload.items():
        if isinstance(values, dict):
            settings.update_section(section, values, save=False)
        else:
            settings.set(section, "", values, save=False)
    settings.save()
    ai_manager.reload()
    return {"status": "updated", "settings": settings.to_dict()}


@router.get("/conversations")
async def list_conversations():
    """List recent conversation sessions."""
    return db.list_conversations(limit=30)


@router.get("/conversations/{conv_id}/messages")
async def get_conversation_messages(conv_id: str):
    """Retrieve messages for a specific conversation."""
    return db.get_messages(conv_id, limit=100)


@router.get("/memories")
async def list_memories(category: Optional[str] = None):
    """List persistent memories."""
    return db.list_memories(category)


@router.post("/memories")
async def add_memory(payload: RememberRequest):
    """Save a new memory."""
    mem_id = memory_manager.remember_fact(payload.content, payload.category, payload.importance)
    return {"status": "saved", "id": mem_id}


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory item."""
    success = db.delete_memory(memory_id)
    return {"status": "deleted" if success else "not_found"}


@router.get("/tools")
async def list_tools():
    """List all registered tools with schemas and permissions."""
    tools = tool_registry.get_all()
    return [
        {
            "name": t.name,
            "description": t.description,
            "parameters": t.parameters,
            "permission_level": t.permission_level.value,
        }
        for t in tools
    ]


@router.post("/tools/execute")
async def execute_tool_direct(payload: ExecuteToolRequest):
    """Directly execute a tool from UI dashboard."""
    res = await tool_registry.execute(payload.name, payload.arguments)
    return res.to_dict()


@router.get("/audit")
async def get_audit_logs():
    """Fetch audit history."""
    return db.get_audit_logs(limit=50)


@router.get("/voice/voices")
async def get_voices():
    """List TTS voices."""
    return await tts_engine.list_available_voices()


@router.post("/voice/interrupt")
async def interrupt_speech():
    """Stop active TTS."""
    voice_pipeline.interrupt()
    return {"status": "interrupted"}


# ==========================================
# First-Run Setup Wizard Endpoints
# ==========================================

@router.get("/setup/status")
async def get_setup_status():
    """Check if first-run setup is completed and detect local Ollama."""
    first_run = settings.get("general", "first_run_completed", False)
    assistant_name = settings.get("general", "assistant_name", "JARVIS")
    user_name = settings.get("general", "user_name", "Sir")
    active_prov = settings.get("ai", "active_provider", "gemini")

    # Auto-detect Ollama
    ollama_running = False
    ollama_models = []
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get("http://localhost:11434/api/tags")
            if r.status_code == 200:
                ollama_running = True
                models_data = r.json().get("models", [])
                ollama_models = [m.get("name") for m in models_data]
    except Exception:
        pass

    return {
        "first_run_completed": bool(first_run),
        "assistant_name": assistant_name,
        "user_name": user_name,
        "active_provider": active_prov,
        "version": APP_VERSION,
        "ollama_running": ollama_running,
        "ollama_models": ollama_models,
    }


@router.post("/setup/detect-ollama")
async def detect_ollama():
    """Probe Ollama local daemon."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://localhost:11434/api/tags")
            if r.status_code == 200:
                models = r.json().get("models", [])
                return {
                    "running": True,
                    "models": [
                        {
                            "name": m.get("name"),
                            "size_gb": round(m.get("size", 0) / (1024**3), 2),
                        }
                        for m in models
                    ],
                }
    except Exception:
        pass
    return {"running": False, "models": []}


@router.post("/setup/test-provider")
async def test_provider_connection(payload: TestProviderRequest):
    """Test connection to a provider with provided API key or base URL."""
    prov_name = payload.provider.lower()
    
    if prov_name == "ollama":
        url = payload.base_url or "http://localhost:11434"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(f"{url.rstrip('/')}/api/tags")
                if r.status_code == 200:
                    models = [m.get("name") for m in r.json().get("models", [])]
                    return {"success": True, "message": "Ollama connection successful!", "models": models}
                return {"success": False, "message": f"Ollama returned HTTP {r.status_code}"}
        except Exception as e:
            return {"success": False, "message": f"Cannot connect to Ollama at {url}: {str(e)}"}

    # Online providers
    try:
        from ai.providers.gemini_provider import GeminiProvider
        from ai.providers.groq_provider import GroqProvider
        from ai.providers.openrouter_provider import OpenRouterProvider
        from ai.providers.openai_provider import OpenAIProvider
        from ai.providers.anthropic_provider import AnthropicProvider

        prov_map = {
            "gemini": GeminiProvider,
            "groq": GroqProvider,
            "openrouter": OpenRouterProvider,
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
        }

        cls = prov_map.get(prov_name)
        if not cls:
            return {"success": False, "message": f"Unknown provider '{prov_name}'"}

        cfg = {
            "api_key": payload.api_key or "",
            "model": payload.model or "",
            "base_url": payload.base_url or "",
        }
        test_instance = cls(cfg)
        connected = await test_instance.test_connection()
        if connected:
            return {"success": True, "message": f"{prov_name.upper()} connection verified successfully!"}
        return {"success": False, "message": f"Authentication or connection check failed for {prov_name.upper()}."}

    except Exception as e:
        return {"success": False, "message": f"Connection test failed: {str(e)}"}


@router.post("/setup/complete")
async def complete_setup(payload: SetupCompleteRequest):
    """Save all onboarding configuration and mark setup completed."""
    # 1. Update general identity
    settings.set("general", "assistant_name", payload.assistant_name, save=False)
    settings.set("general", "user_name", payload.user_name, save=False)
    settings.set("general", "first_run_completed", True, save=False)

    # 2. Update AI provider
    settings.set("ai", "active_provider", payload.active_provider, save=False)
    providers = settings.get("ai", "providers", {})
    if payload.active_provider in providers:
        providers[payload.active_provider].update(payload.provider_config)
        # Store key in credential vault
        if "api_key" in payload.provider_config and payload.provider_config["api_key"]:
            CredentialVault.set_key(payload.active_provider, payload.provider_config["api_key"])
        settings.set("ai", "providers", providers, save=False)

    # 3. Update Voice
    if payload.voice_config:
        settings.update_section("voice", payload.voice_config, save=False)

    # 4. Update Permissions
    settings.set("permissions", "level", payload.permissions_level, save=False)

    # 5. Update Automation
    settings.set("automation", "proactive_enabled", payload.proactive_enabled, save=False)

    # Save to disk and reload AI engine
    settings.save()
    ai_manager.reload()

    return {"status": "success", "message": "JARVIS configuration initialized successfully."}


# ==========================================
# In-App Uninstallation Endpoints
# ==========================================

@router.get("/uninstall/manifest")
async def get_uninstall_manifest():
    """Retrieve detailed preview of items to be removed."""
    return uninstall_manager.get_cleanup_manifest()


@router.post("/uninstall/execute")
async def execute_uninstallation(payload: UninstallRequest, background_tasks: BackgroundTasks):
    """Confirm and execute complete application uninstallation."""
    if payload.confirm_code != "UNINSTALL":
        raise HTTPException(status_code=400, detail="Invalid confirmation code. Must be 'UNINSTALL'.")

    report = uninstall_manager.execute_uninstall(remove_install_dir=payload.remove_install_dir)

    # Schedule app shutdown after sending response
    async def delayed_exit():
        await asyncio.sleep(2.0)
        sys.exit(0)

    background_tasks.add_task(delayed_exit)
    return {
        "status": "uninstalled",
        "message": "Cleanup executed. Application is shutting down.",
        "report": report,
    }


# ==========================================
# GitHub Releases Auto-Updater Endpoints
# ==========================================

@router.get("/updates/check")
async def check_for_updates():
    """Check GitHub repository for the latest release."""
    return await update_manager.check_for_updates()


@router.get("/updates/status")
async def get_update_status():
    """Get current download status and progress."""
    return update_manager.state


@router.post("/updates/download")
async def start_download(payload: DownloadUpdateRequest, background_tasks: BackgroundTasks):
    """Begin downloading the installer in background."""
    if update_manager.state["status"] == "downloading":
        return {"status": "already_downloading"}

    background_tasks.add_task(update_manager.download_update, payload.download_url)
    return {"status": "download_started"}


@router.post("/updates/apply")
async def apply_update(background_tasks: BackgroundTasks):
    """Launch installer and exit JARVIS application."""
    installer_path = update_manager.state.get("downloaded_path")
    if not installer_path:
        raise HTTPException(status_code=400, detail="No downloaded installer available.")

    launched = update_manager.apply_update(installer_path)
    if not launched:
        raise HTTPException(status_code=500, detail="Failed to start installer.")

    async def exit_app():
        await asyncio.sleep(1.0)
        sys.exit(0)

    background_tasks.add_task(exit_app)
    return {"status": "launched", "message": "Installer launched. Terminating JARVIS."}

