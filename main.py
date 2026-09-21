"""JARVIS — Personal AI Assistant for Windows 11.
Main application lifecycle and entrypoint.
"""

import os
import sys
import threading
import time
import uvicorn
import webview
from pathlib import Path
from server.app import app
from config.settings import settings


class JarvisDesktopAPI:
    """Methods exposed directly to the React frontend via window.pywebview.api."""

    def __init__(self, window_holder):
        self.window_holder = window_holder

    def get_window(self):
        return self.window_holder[0] if self.window_holder else None

    def minimize_window(self):
        win = self.get_window()
        if win:
            win.minimize()

    def toggle_maximize(self):
        win = self.get_window()
        if win:
            # pywebview doesn't have an explicit is_maximized flag, but toggle can be simulated
            pass

    def close_window(self):
        win = self.get_window()
        if win:
            win.destroy()

    def set_always_on_top(self, on_top: bool):
        win = self.get_window()
        if win:
            win.on_top = on_top
            settings.set("general", "always_on_top", on_top)

    def ping(self):
        return {"status": "ok", "time": time.time()}


def start_server():
    """Run uvicorn server in daemon thread."""
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8765,
        log_level="warning",
        access_log=False,
    )
    server = uvicorn.Server(config)
    server.run()


def main():
    print("==================================================")
    print("      J.A.R.V.I.S. // Windows 11 Intelligence     ")
    print("==================================================")

    # 1. Start FastAPI server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Allow server to bind
    time.sleep(1.0)

    # 2. Determine frontend URL
    is_dev = os.getenv("JARVIS_DEV", "0") == "1"
    if is_dev:
        url = "http://localhost:5173"
        print("[JARVIS] Running in DEV mode targeting Vite dev server:", url)
    else:
        url = "http://127.0.0.1:8765"
        print("[JARVIS] Running in PRODUCTION mode targeting embedded server:", url)

    # 3. Create native pywebview window
    window_holder = []
    api = JarvisDesktopAPI(window_holder)

    always_on_top = settings.get("general", "always_on_top", False)

    window = webview.create_window(
        title="J.A.R.V.I.S.",
        url=url,
        js_api=api,
        width=1240,
        height=820,
        min_size=(440, 600),
        frameless=True,          # Sleek borderless window
        easy_drag=False,         # Controlled via CSS webkit-app-region: drag
        background_color="#030508",
        on_top=always_on_top,
    )
    window_holder.append(window)

    print("[JARVIS] Launching WebView2 interface...")
    webview.start(debug=is_dev)


if __name__ == "__main__":
    main()
