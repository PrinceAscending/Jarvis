"""FastAPI application initialization with WebSocket and static file serving."""

import asyncio
import json
import os
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.routes import router as api_router
from server.websocket import ws_manager
from core.orchestrator import orchestrator
from voice.pipeline import voice_pipeline
from automation.proactive import ProactiveEngine

app = FastAPI(title="JARVIS OS Intelligence Backend", version="4.2.0")

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(api_router)

# Set up Proactive Engine
proactive = ProactiveEngine(alert_callback=ws_manager.broadcast_json)


@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()
    ws_manager.set_loop(loop)

    # Connect voice pipeline broadcast to WebSocket manager
    async def voice_broadcast(event_type: str, data: Any):
        if event_type == "audio_chunk":
            await ws_manager.broadcast_bytes(data)
        else:
            await ws_manager.broadcast_json(event_type, data)

    voice_pipeline.set_broadcast_callback(voice_broadcast)

    # Start proactive monitoring task
    asyncio.create_task(proactive.start())
    print("[Server] JARVIS FastAPI server online.")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                msg_type = data.get("type")
                payload = data.get("payload", {})

                if msg_type == "prompt":
                    user_text = payload.get("text", "")
                    conv_id = payload.get("conversation_id", "default_conv")
                    if user_text:
                        # Process prompt asynchronously
                        asyncio.create_task(
                            _handle_user_prompt(user_text, conv_id)
                        )

                elif msg_type == "interrupt":
                    voice_pipeline.interrupt()
                    await ws_manager.broadcast_json("status", "idle")

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong", "payload": {}})

            except Exception as e:
                print(f"[WebSocket] Error parsing message: {e}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


async def _handle_user_prompt(user_text: str, conv_id: str):
    """Run orchestrator and stream events to WebSocket."""
    async def on_event(event_type: str, data: Any):
        await ws_manager.broadcast_json(event_type, data)

    try:
        reply_text = await orchestrator.process_user_request(
            user_text=user_text,
            conversation_id=conv_id,
            event_callback=on_event,
        )
        # Speak the reply aloud via TTS
        if reply_text:
            asyncio.create_task(voice_pipeline.speak(reply_text))
    except Exception as e:
        print(f"[Orchestrator] Error processing request: {e}")
        await ws_manager.broadcast_json(
            "error",
            {"message": f"Intelligence Engine Error: {str(e)}"}
        )
        await ws_manager.broadcast_json("status", "idle")


# Static files mount for production frontend build (ui/dist)
dist_dir = Path(__file__).resolve().parent.parent / "ui" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index_file = dist_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "UI build not found. Run 'npm run build' in ui/."}
