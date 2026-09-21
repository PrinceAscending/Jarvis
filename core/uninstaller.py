"""Complete uninstallation engine for JARVIS Windows 11 Assistant."""

import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import keyring
from config.defaults import APP_DATA_DIR, CONFIG_FILE, DATABASE_FILE, LOGS_DIR, MEMORY_DIR, RECORDINGS_DIR, UPDATES_DIR
from security.credentials import CredentialVault


class UninstallManager:
    """Manages total cleanup and in-app uninstallation without leaving residual files."""

    AI_PROVIDERS = ["gemini", "groq", "openrouter", "ollama", "openai", "anthropic"]

    def _get_dir_size(self, path: Path) -> int:
        """Calculate recursive directory size in bytes."""
        total = 0
        if not path.exists():
            return 0
        if path.is_file():
            return path.stat().st_size
        for dirpath, _, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total += os.path.getsize(fp)
                except OSError:
                    pass
        return total

    def _find_shortcuts(self) -> List[Path]:
        """Locate Start Menu and Desktop shortcuts created by the installer."""
        found = []
        user_desktop = Path.home() / "Desktop"
        public_desktop = Path(os.environ.get("PUBLIC", "C:\\Users\\Public")) / "Desktop"

        for desk in [user_desktop, public_desktop]:
            for name in ["JARVIS AI Assistant.lnk", "JARVIS.lnk", "JarvisApp.lnk"]:
                p = desk / name
                if p.exists():
                    found.append(p)

        # Start menu folder
        appdata = os.environ.get("APPDATA", "")
        if appdata:
            sm = Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "JARVIS AI Assistant"
            if sm.exists():
                found.append(sm)

        return found

    def _find_inno_uninstaller(self) -> Optional[Path]:
        """Locate unins000.exe if running from an Inno Setup installed location."""
        # Check current executable directory
        exe_dir = Path(sys.executable).parent
        unins = exe_dir / "unins000.exe"
        if unins.exists():
            return unins

        # Check default LocalAppData install path
        local_app = os.environ.get("LOCALAPPDATA", "")
        if local_app:
            default_install = Path(local_app) / "Programs" / "JARVIS AI Assistant" / "unins000.exe"
            if default_install.exists():
                return default_install

        return None

    def get_cleanup_manifest(self) -> Dict[str, Any]:
        """Return full overview of files, credentials, and shortcuts scheduled for removal."""
        total_data_bytes = self._get_dir_size(APP_DATA_DIR)
        shortcuts = [str(s) for s in self._find_shortcuts()]
        unins_exe = self._find_inno_uninstaller()

        # Check existing credentials
        stored_keys = []
        for prov in self.AI_PROVIDERS:
            try:
                val = keyring.get_password(CredentialVault.SERVICE_NAME, prov)
                if val:
                    stored_keys.append(prov)
            except Exception:
                pass

        return {
            "app_data_dir": str(APP_DATA_DIR),
            "app_data_exists": APP_DATA_DIR.exists(),
            "total_size_bytes": total_data_bytes,
            "total_size_mb": round(total_data_bytes / (1024 * 1024), 2),
            "database_file": str(DATABASE_FILE),
            "config_file": str(CONFIG_FILE),
            "stored_credentials": stored_keys,
            "shortcuts": shortcuts,
            "inno_uninstaller": str(unins_exe) if unins_exe else None,
            "install_dir": str(Path(sys.executable).parent),
        }

    def execute_uninstall(self, remove_install_dir: bool = True) -> Dict[str, Any]:
        """Execute complete uninstallation and return execution report."""
        report = {
            "credentials_cleared": [],
            "shortcuts_removed": [],
            "app_data_deleted": False,
            "inno_uninstaller_invoked": False,
            "errors": [],
        }

        # 1. Clear OS Windows Credential Manager entries
        for prov in self.AI_PROVIDERS:
            try:
                keyring.delete_password(CredentialVault.SERVICE_NAME, prov)
                report["credentials_cleared"].append(prov)
            except Exception:
                pass

        # 2. Remove desktop and start menu shortcuts
        for sc in self._find_shortcuts():
            try:
                if sc.is_dir():
                    shutil.rmtree(sc, ignore_errors=True)
                elif sc.exists():
                    sc.unlink()
                report["shortcuts_removed"].append(str(sc))
            except Exception as e:
                report["errors"].append(f"Failed to remove shortcut {sc}: {e}")

        # 3. Wipe App Data Directory (%LOCALAPPDATA%\JarvisAssistant\)
        if APP_DATA_DIR.exists():
            try:
                shutil.rmtree(APP_DATA_DIR, ignore_errors=True)
                report["app_data_deleted"] = not APP_DATA_DIR.exists()
            except Exception as e:
                report["errors"].append(f"Failed to delete app data directory: {e}")

        # 4. Invoke Inno Setup Uninstaller if available
        unins = self._find_inno_uninstaller()
        if remove_install_dir and unins and unins.exists():
            try:
                # Run silent uninstaller detached
                subprocess.Popen(
                    [str(unins), "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"],
                    creationflags=subprocess.DETACHED_PROCESS if sys.platform == "win32" else 0,
                )
                report["inno_uninstaller_invoked"] = True
            except Exception as e:
                report["errors"].append(f"Failed to invoke Inno uninstaller: {e}")

        return report


# Global singleton
uninstall_manager = UninstallManager()
