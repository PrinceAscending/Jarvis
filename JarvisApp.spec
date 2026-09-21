# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all
import sys
import os

block_cipher = None

datas = [
    ('ui/dist', 'ui/dist'),
    ('assets', 'assets'),
]

binaries = []
hiddenimports = [
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'starlette',
    'pydantic',
    'pydantic_core',
    'psutil',
    'keyring',
    'keyring.backends',
    'keyring.backends.Windows',
    'edge_tts',
    'pyautogui',
    'pyrect',
    'pyperclip',
    'sounddevice',
    'numpy',
    'duckduckgo_search',
    'primp',
    'clr_loader',
    'pythonnet',
    'webview',
]

# Collect all resources for webview, pythonnet, sounddevice
for pkg in ['webview', 'pythonnet', 'sounddevice', 'primp']:
    try:
        p_datas, p_binaries, p_hidden = collect_all(pkg)
        datas += p_datas
        binaries += p_binaries
        hiddenimports += p_hidden
    except Exception as e:
        print(f"Hook collect for {pkg}: {e}")

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'tkinter', 'PyQt5', 'PySide6'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='JarvisApp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/app_icon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='JarvisApp',
)
