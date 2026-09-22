"""Native Windows 11 Screen Vision and OCR engine for JARVIS.

Uses Windows.Media.Ocr via Direct3D/WinRT interop with zero external binaries (no Tesseract required).
Provides inspect_screen, locate_element, and click_element tools.
"""

import os
import io
import time
import json
import logging
import tempfile
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pyautogui
from PIL import Image

from tools.base import BaseTool, PermissionLevel, ToolResult
from config.defaults import APP_DATA_DIR

logger = logging.getLogger("jarvis.screen_vision")

# PowerShell script template to invoke Windows.Media.Ocr.OcrEngine
_OCR_PS_SCRIPT = r'''
param([string]$ImagePath)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.ContainsGenericParameters })[0]

function Await-WinRT($asyncOp, $type) {
    $m = $asTaskGeneric.MakeGenericMethod($type)
    $task = $m.Invoke($null, @($asyncOp))
    $task.Wait()
    return $task.Result
}

try {
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)
    $file = Await-WinRT $fileOp ([Windows.Storage.StorageFile])

    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = Await-WinRT $streamOp ([Windows.Storage.Streams.IRandomAccessStream])

    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = Await-WinRT $decoderOp ([Windows.Graphics.Imaging.BitmapDecoder])

    $bitmapOp = $decoder.GetSoftwareBitmapAsync()
    $softwareBitmap = Await-WinRT $bitmapOp ([Windows.Graphics.Imaging.SoftwareBitmap])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        # Fallback to first available language
        $langs = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages
        if ($langs.Count -gt 0) {
            $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($langs[0])
        }
    }

    if ($null -eq $engine) {
        Write-Output '{"error": "No OCR language package available in Windows"}'
        exit 0
    }

    $ocrOp = $engine.RecognizeAsync($softwareBitmap)
    $ocrResult = Await-WinRT $ocrOp ([Windows.Media.Ocr.OcrResult])

    $linesOut = @()
    $wordsOut = @()

    foreach ($line in $ocrResult.Lines) {
        $lineWords = @()
        foreach ($w in $line.Words) {
            $wObj = @{
                text = $w.Text
                x = [int]$w.BoundingRect.X
                y = [int]$w.BoundingRect.Y
                w = [int]$w.BoundingRect.Width
                h = [int]$w.BoundingRect.Height
            }
            $lineWords += $wObj
            $wordsOut += $wObj
        }
        $linesOut += @{
            text = $line.Text
            words = $lineWords
        }
    }

    $out = @{
        success = $true
        text = $ocrResult.Text
        lines = $linesOut
        words = $wordsOut
    }
    $out | ConvertTo-Json -Depth 5 -Compress
} catch {
    $errObj = @{
        success = $false
        error = $_.Exception.Message
    }
    $errObj | ConvertTo-Json -Compress
}
'''

_CACHED_SCRIPT_PATH: Optional[Path] = None


def _get_ps_script_path() -> Path:
    global _CACHED_SCRIPT_PATH
    if _CACHED_SCRIPT_PATH and _CACHED_SCRIPT_PATH.exists():
        return _CACHED_SCRIPT_PATH

    script_dir = APP_DATA_DIR / "scripts"
    script_dir.mkdir(parents=True, exist_ok=True)
    target = script_dir / "windows_ocr.ps1"
    target.write_text(_OCR_PS_SCRIPT, encoding="utf-8")
    _CACHED_SCRIPT_PATH = target
    return target


def run_ocr_on_file(image_path: str | Path) -> Dict[str, Any]:
    """Execute Windows native OCR on an image file path."""
    image_path = Path(image_path).resolve()
    if not image_path.exists():
        return {"success": False, "error": f"Image not found at {image_path}"}

    ps_script = _get_ps_script_path()
    try:
        proc = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps_script),
                "-ImagePath",
                str(image_path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if proc.returncode != 0 and not proc.stdout.strip():
            return {
                "success": False,
                "error": proc.stderr.strip() or f"PowerShell exited with code {proc.returncode}",
            }

        out_text = proc.stdout.strip()
        if not out_text:
            return {"success": True, "text": "", "lines": [], "words": []}

        # Parse JSON
        data = json.loads(out_text)
        return data
    except Exception as e:
        logger.error(f"OCR execution failed: {e}")
        return {"success": False, "error": str(e)}


def find_text_bounds(
    query: str,
    ocr_result: Dict[str, Any],
    screen_offset_x: int = 0,
    screen_offset_y: int = 0,
) -> Optional[Dict[str, Any]]:
    """Find the coordinates of a query substring in OCR results."""
    query_clean = query.strip().lower()
    if not query_clean:
        return None

    words = ocr_result.get("words", [])
    lines = ocr_result.get("lines", [])

    # 1. Exact or substring match in whole lines
    for line in lines:
        line_text = line.get("text", "").strip()
        if query_clean in line_text.lower():
            lwords = line.get("words", [])
            if lwords:
                min_x = min(w["x"] for w in lwords)
                min_y = min(w["y"] for w in lwords)
                max_x = max(w["x"] + w["w"] for w in lwords)
                max_y = max(w["y"] + w["h"] for w in lwords)

                abs_x = min_x + screen_offset_x
                abs_y = min_y + screen_offset_y
                w_val = max_x - min_x
                h_val = max_y - min_y

                return {
                    "matched_text": line_text,
                    "x": abs_x,
                    "y": abs_y,
                    "width": w_val,
                    "height": h_val,
                    "center_x": abs_x + w_val // 2,
                    "center_y": abs_y + h_val // 2,
                }

    # 2. Match individual word tokens
    for word in words:
        w_text = word.get("text", "").strip().lower()
        if query_clean in w_text or w_text in query_clean:
            abs_x = word["x"] + screen_offset_x
            abs_y = word["y"] + screen_offset_y
            w_val = word["w"]
            h_val = word["h"]
            return {
                "matched_text": word.get("text"),
                "x": abs_x,
                "y": abs_y,
                "width": w_val,
                "height": h_val,
                "center_x": abs_x + w_val // 2,
                "center_y": abs_y + h_val // 2,
            }

    return None


class InspectScreenTool(BaseTool):
    """Tool that visually captures and reads the current screen via native OCR."""

    name = "inspect_screen"
    description = (
        "Capture the screen, read all visible text using Windows 11 OCR, "
        "and return recognized text, error patterns, and element coordinates."
    )
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "focus_area": {
                "type": "string",
                "enum": ["fullscreen", "center", "active_window"],
                "description": "Portion of the screen to inspect. Defaults to 'fullscreen'.",
            }
        },
        "required": [],
    }

    async def execute(self, focus_area: str = "fullscreen") -> ToolResult:
        try:
            # Capture screenshot
            screenshot = pyautogui.screenshot()
            width, height = screenshot.size

            crop_box = None
            offset_x, offset_y = 0, 0

            if focus_area == "center":
                crop_box = (
                    int(width * 0.2),
                    int(height * 0.2),
                    int(width * 0.8),
                    int(height * 0.8),
                )
                screenshot = screenshot.crop(crop_box)
                offset_x, offset_y = crop_box[0], crop_box[1]

            temp_img = Path(tempfile.gettempdir()) / f"jarvis_ocr_{int(time.time() * 1000)}.png"
            screenshot.save(temp_img, format="PNG")

            try:
                ocr_data = run_ocr_on_file(temp_img)
            finally:
                temp_img.unlink(missing_ok=True)

            if not ocr_data.get("success", True):
                return ToolResult(
                    success=False,
                    error=ocr_data.get("error", "OCR failed to run."),
                )

            extracted_text = ocr_data.get("text", "")
            words_count = len(ocr_data.get("words", []))

            # Detect potential error or alert patterns
            detected_alerts = []
            error_keywords = ["error", "failed", "exception", "critical", "warning", "denied", "not found"]
            for line in ocr_data.get("lines", []):
                lt = line.get("text", "")
                if any(kw in lt.lower() for kw in error_keywords):
                    detected_alerts.append(lt)

            # Record in screen memory if screen memory is active
            try:
                from core.screen_memory import screen_memory
                screen_memory.record_snapshot(extracted_text, detected_alerts)
            except Exception:
                pass

            return ToolResult(
                success=True,
                data={
                    "resolution": f"{width}x{height}",
                    "words_detected": words_count,
                    "extracted_text": extracted_text[:3000] + ("..." if len(extracted_text) > 3000 else ""),
                    "detected_alerts": detected_alerts[:5],
                },
                message=f"Screen OCR inspected successfully: {words_count} words read."
                + (f" Found {len(detected_alerts)} alert/error messages." if detected_alerts else ""),
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class LocateElementTool(BaseTool):
    """Tool to locate a button, label, or text element on the screen."""

    name = "locate_element"
    description = (
        "Find the exact pixel coordinates (center_x, center_y, width, height) of any "
        "text, button, or label visible on the screen."
    )
    permission_level = PermissionLevel.LOW
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The exact or partial text of the button or UI element to find.",
            }
        },
        "required": ["query"],
    }

    async def execute(self, query: str) -> ToolResult:
        try:
            screenshot = pyautogui.screenshot()
            temp_img = Path(tempfile.gettempdir()) / f"jarvis_loc_{int(time.time() * 1000)}.png"
            screenshot.save(temp_img, format="PNG")

            try:
                ocr_data = run_ocr_on_file(temp_img)
            finally:
                temp_img.unlink(missing_ok=True)

            match = find_text_bounds(query, ocr_data)
            if not match:
                return ToolResult(
                    success=False,
                    error=f"Could not find element matching '{query}' on screen.",
                )

            return ToolResult(
                success=True,
                data=match,
                message=f"Found '{match['matched_text']}' at ({match['center_x']}, {match['center_y']}).",
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ClickElementTool(BaseTool):
    """Tool to locate a UI element by text and click it."""

    name = "click_element"
    description = (
        "Locate a visible button, link, or label on screen by text and click its center. "
        "Supports single, double, or right click."
    )
    permission_level = PermissionLevel.MEDIUM
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The text of the button, tab, or element to click.",
            },
            "click_type": {
                "type": "string",
                "enum": ["single", "double", "right"],
                "description": "Type of mouse click to perform. Defaults to 'single'.",
            },
        },
        "required": ["query"],
    }

    async def execute(self, query: str, click_type: str = "single") -> ToolResult:
        try:
            screenshot = pyautogui.screenshot()
            temp_img = Path(tempfile.gettempdir()) / f"jarvis_clk_{int(time.time() * 1000)}.png"
            screenshot.save(temp_img, format="PNG")

            try:
                ocr_data = run_ocr_on_file(temp_img)
            finally:
                temp_img.unlink(missing_ok=True)

            match = find_text_bounds(query, ocr_data)
            if not match:
                return ToolResult(
                    success=False,
                    error=f"Cannot click '{query}': element not found on screen.",
                )

            cx = match["center_x"]
            cy = match["center_y"]

            # Smoothly move to element and click
            pyautogui.moveTo(cx, cy, duration=0.25)
            if click_type == "double":
                pyautogui.doubleClick(cx, cy)
            elif click_type == "right":
                pyautogui.rightClick(cx, cy)
            else:
                pyautogui.click(cx, cy)

            return ToolResult(
                success=True,
                data={
                    "clicked_text": match["matched_text"],
                    "coordinates": {"x": cx, "y": cy},
                    "click_type": click_type,
                },
                message=f"Successfully clicked '{match['matched_text']}' at ({cx}, {cy}).",
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
