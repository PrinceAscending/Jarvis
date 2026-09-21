"""Integration test for WebSocket real-time communication."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
import json
import threading
import time
import uvicorn
import websockets
from server.app import app


async def test_ws_client():
    uri = "ws://127.0.0.1:8765/ws"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as ws:
        print("Connected to JARVIS WebSocket!")
        
        # Send ping
        await ws.send(json.dumps({"type": "ping", "payload": {}}))
        reply = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data = json.loads(reply)
        print("Received ping response:", data)
        assert data.get("type") == "pong", "Expected pong reply"

    print(">>> WEBSOCKET CLIENT TEST PASSED! <<<")


def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="error")


if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1.5)
    asyncio.run(test_ws_client())
