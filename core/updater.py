"""GitHub Releases Auto-Updater for JARVIS Windows 11 Assistant."""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional
import httpx
from config.defaults import APP_VERSION, GITHUB_REPO, GITHUB_RELEASES_URL, UPDATES_DIR
from config.settings import settings


def parse_semver(version_str: str) -> tuple:
    """Parse version string like 'v4.2.1' or '4.2.0' into comparable tuple."""
    v = version_str.strip().lstrip("vV")
    parts = []
    for p in v.split("."):
        try:
            parts.append(int(p))
        except ValueError:
            parts.append(0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


class UpdateManager:
    """Manages update checks, downloads, and execution via GitHub Releases."""

    _instance: Optional["UpdateManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(UpdateManager, cls).__new__(cls)
            cls._instance.state = {
                "status": "idle",  # idle | checking | downloading | ready | error
                "progress_percent": 0,
                "downloaded_bytes": 0,
                "total_bytes": 0,
                "error_message": "",
                "downloaded_path": None,
                "update_info": None,
            }
        return cls._instance

    async def check_for_updates(self) -> Dict[str, Any]:
        """Check GitHub Releases API for the latest release."""
        self.state["status"] = "checking"
        self.state["error_message"] = ""

        headers = {
            "User-Agent": f"JARVIS-Assistant/{APP_VERSION}",
            "Accept": "application/vnd.github.v3+json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(GITHUB_RELEASES_URL, headers=headers)

                if resp.status_code == 404:
                    # Repository has no releases yet
                    res = {
                        "update_available": False,
                        "current_version": APP_VERSION,
                        "latest_version": APP_VERSION,
                        "message": "Repository is up to date (no releases published yet).",
                        "repo_url": f"https://github.com/{GITHUB_REPO}",
                    }
                    self.state["status"] = "idle"
                    self.state["update_info"] = res
                    return res

                resp.raise_for_status()
                data = resp.json()

                tag_name = data.get("tag_name", "")
                latest_ver = tag_name.lstrip("vV")
                curr_tuple = parse_semver(APP_VERSION)
                latest_tuple = parse_semver(latest_ver)

                is_newer = latest_tuple > curr_tuple

                # Search for installer asset (.exe)
                assets = data.get("assets", [])
                download_url = ""
                asset_name = ""
                asset_size = 0

                for asset in assets:
                    name = asset.get("name", "")
                    if name.endswith(".exe"):
                        asset_name = name
                        download_url = asset.get("browser_download_url", "")
                        asset_size = asset.get("size", 0)
                        if "setup" in name.lower():
                            break

                info = {
                    "update_available": is_newer,
                    "current_version": APP_VERSION,
                    "latest_version": tag_name or latest_ver,
                    "release_name": data.get("name", "") or tag_name,
                    "release_notes": data.get("body", ""),
                    "published_at": data.get("published_at", ""),
                    "download_url": download_url,
                    "asset_name": asset_name,
                    "asset_size": asset_size,
                    "html_url": data.get("html_url", f"https://github.com/{GITHUB_REPO}"),
                    "repo_url": f"https://github.com/{GITHUB_REPO}",
                }

                self.state["status"] = "idle"
                self.state["update_info"] = info
                return info

        except Exception as e:
            self.state["status"] = "error"
            self.state["error_message"] = str(e)
            return {
                "update_available": False,
                "current_version": APP_VERSION,
                "latest_version": APP_VERSION,
                "error": f"Failed to check for updates: {str(e)}",
                "repo_url": f"https://github.com/{GITHUB_REPO}",
            }

    async def download_update(self, download_url: str) -> Optional[Path]:
        """Download latest installer in chunks while reporting progress."""
        if not download_url:
            self.state["status"] = "error"
            self.state["error_message"] = "No download URL available for update."
            return None

        UPDATES_DIR.mkdir(parents=True, exist_ok=True)
        target_name = download_url.split("/")[-1] or "JarvisAssistant_Setup_Update.exe"
        target_path = UPDATES_DIR / target_name

        self.state["status"] = "downloading"
        self.state["progress_percent"] = 0
        self.state["downloaded_bytes"] = 0
        self.state["error_message"] = ""

        try:
            headers = {"User-Agent": f"JARVIS-Assistant/{APP_VERSION}"}
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                async with client.stream("GET", download_url, headers=headers) as response:
                    response.raise_for_status()
                    total_bytes = int(response.headers.get("content-length", 0))
                    self.state["total_bytes"] = total_bytes
                    downloaded = 0

                    with open(target_path, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=65536):
                            f.write(chunk)
                            downloaded += len(chunk)
                            self.state["downloaded_bytes"] = downloaded
                            if total_bytes > 0:
                                self.state["progress_percent"] = round((downloaded / total_bytes) * 100, 1)

            self.state["status"] = "ready"
            self.state["progress_percent"] = 100
            self.state["downloaded_path"] = str(target_path)
            return target_path

        except Exception as e:
            self.state["status"] = "error"
            self.state["error_message"] = str(e)
            if target_path.exists():
                try:
                    target_path.unlink()
                except Exception:
                    pass
            return None

    def apply_update(self, installer_path: Optional[str] = None, silent: bool = False) -> bool:
        """Launch the installer and signal application shutdown."""
        path_to_run = installer_path or self.state.get("downloaded_path")
        if not path_to_run or not Path(path_to_run).exists():
            return False

        try:
            cmd = [str(path_to_run)]
            if silent:
                cmd.append("/VERYSILENT")
            # Spawn installer detached
            subprocess.Popen(cmd, creationflags=subprocess.DETACHED_PROCESS if sys.platform == "win32" else 0)
            return True
        except Exception as e:
            print(f"[UpdateManager] Failed to launch installer: {e}")
            return False


# Global singleton
update_manager = UpdateManager()
