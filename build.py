"""JARVIS Production Build & Packaging Pipeline.
Builds frontend, bundles Python backend into native Windows binary, and compiles Inno Setup installer.
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
UI_DIR = ROOT_DIR / "ui"
UI_DIST_DIR = UI_DIR / "dist"
INSTALLER_DIR = ROOT_DIR / "installer"
OUTPUT_DIR = INSTALLER_DIR / "output"


def step_banner(title: str):
    print("\n" + "=" * 60)
    print(f"  [BUILD STEP] {title}")
    print("=" * 60)


def build_frontend():
    step_banner("1. Building React + Vite Frontend UI")
    if not UI_DIR.exists():
        raise RuntimeError("UI directory not found.")

    npm_cmd = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
    print(f"Running 'npm run build' in {UI_DIR}...")
    res = subprocess.run([npm_cmd, "run", "build"], cwd=str(UI_DIR), shell=True)
    if res.returncode != 0:
        raise RuntimeError(f"Frontend build failed with return code {res.returncode}")

    if not (UI_DIST_DIR / "index.html").exists():
        raise RuntimeError(f"Build output missing index.html in {UI_DIST_DIR}")
    print("[OK] Frontend successfully compiled and verified.")


def build_pyinstaller():
    step_banner("2. Compiling Python Standalone Executable via PyInstaller")
    pyinstaller_cmd = shutil.which("pyinstaller.exe") or shutil.which("pyinstaller")
    if not pyinstaller_cmd:
        # Check standard user Scripts path
        user_scripts = Path(os.environ.get("APPDATA", "")) / "Python" / f"Python{sys.version_info.major}{sys.version_info.minor}" / "Scripts" / "pyinstaller.exe"
        if user_scripts.exists():
            pyinstaller_cmd = str(user_scripts)
        else:
            pyinstaller_cmd = [sys.executable, "-m", "PyInstaller"]

    spec_file = ROOT_DIR / "JarvisApp.spec"
    if not spec_file.exists():
        raise RuntimeError(f"Spec file {spec_file} not found.")

    cmd = (
        [pyinstaller_cmd] if isinstance(pyinstaller_cmd, str) else pyinstaller_cmd
    ) + [str(spec_file), "--noconfirm", "--clean"]

    print(f"Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=str(ROOT_DIR))
    if res.returncode != 0:
        raise RuntimeError(f"PyInstaller failed with code {res.returncode}")

    target_exe = ROOT_DIR / "dist" / "JarvisApp" / "JarvisApp.exe"
    if not target_exe.exists():
        raise RuntimeError(f"Target executable {target_exe} was not produced.")

    print(f"[OK] Standalone package created at: {target_exe.parent}")


def compile_inno_installer():
    step_banner("3. Compiling Native Windows 11 Installer via Inno Setup")
    iscc_paths = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Inno Setup 6" / "ISCC.exe",
        Path("C:/Program Files (x86)/Inno Setup 6/ISCC.exe"),
        Path("C:/Program Files/Inno Setup 6/ISCC.exe"),
    ]

    iscc_exe = None
    for p in iscc_paths:
        if p.exists():
            iscc_exe = p
            break

    if not iscc_exe:
        which_iscc = shutil.which("ISCC.exe") or shutil.which("iscc")
        if which_iscc:
            iscc_exe = Path(which_iscc)

    if not iscc_exe:
        print("[WARN] Inno Setup (ISCC.exe) not found on PATH or standard locations.")
        print("Skipping installer creation. Standalone executable is in dist/JarvisApp/.")
        return

    iss_file = INSTALLER_DIR / "jarvis_installer.iss"
    if not iss_file.exists():
        raise RuntimeError(f"Installer script {iss_file} not found.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Using Inno Setup compiler: {iscc_exe}")
    res = subprocess.run([str(iscc_exe), str(iss_file)], cwd=str(INSTALLER_DIR))
    if res.returncode != 0:
        raise RuntimeError(f"Inno Setup compilation failed with code {res.returncode}")

    final_setup = OUTPUT_DIR / "JarvisAssistant_Setup.exe"
    if final_setup.exists():
        size_mb = final_setup.stat().st_size / (1024 * 1024)
        print(f"[OK] SUCCESS: Created Windows 11 Installer: {final_setup} ({size_mb:.1f} MB)")
    else:
        print(f"[WARN] Warning: Installer output file not found in {OUTPUT_DIR}")


def main():
    print("==================================================")
    print("     JARVIS OS 4.2 — MASTER PRODUCTION BUILD      ")
    print("==================================================")
    build_frontend()
    build_pyinstaller()
    compile_inno_installer()
    print("\n==================================================")
    print("               BUILD COMPLETE                     ")
    print("==================================================")


if __name__ == "__main__":
    main()
