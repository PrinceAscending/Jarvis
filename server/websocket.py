"""WebSocket Connection Manager for real-time frontend bidirectional streaming."""

import asyncio
from typing import Any, Dict, List
from fastapi import WebSocket


class WebSocketManager:
    """Manages active WebSockets and provides thread-safe broadcasting."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WebSocketManager, cls).__new__(cls)
            cls._instance.active_connections: List[WebSocket] = []
            cls._instance.loop: asyncio.AbstractEventLoop = None
        return cls._instance

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast_json(self, event_type: str, data: Any):
        payload = {"type": event_type, "payload": data}
        for ws in list(self.active_connections):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(ws)

    async def broadcast_bytes(self, data: bytes):
        for ws in list(self.active_connections):
            try:
                await ws.send_bytes(data)
            except Exception:
                self.disconnect(ws)

    def broadcast_threadsafe(self, event_type: str, data: Any):
        """Push JSON update from any background thread to UI."""
        if self.loop and self.active_connections:
            asyncio.run_coroutine_threadsafe(self.broadcast_json(event_type, data), self.loop)

    def broadcast_bytes_threadsafe(self, data: bytes):
        """Push binary audio data from any background thread to UI."""
        if self.loop and self.active_connections:
            asyncio.run_coroutine_threadsafe(self.broadcast_bytes(data), self.loop)


# Global singleton
ws_manager = WebSocketManager()
