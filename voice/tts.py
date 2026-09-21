"""Neural Text-to-Speech engine using edge-tts for high fidelity and zero cost."""

import asyncio
from pathlib import Path
from typing import AsyncGenerator, Optional
import edge_tts
from config.settings import settings
from config.defaults import RECORDINGS_DIR


class TTSEngine:
    """Manages Edge TTS neural voice generation."""

    _instance: Optional["TTSEngine"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSEngine, cls).__new__(cls)
            cls._instance._is_speaking = False
        return cls._instance

    @property
    def is_speaking(self) -> bool:
        return self._is_speaking

    def stop(self):
        """Immediately abort current speech (barge-in)."""
        self._is_speaking = False

    async def stream_audio(self, text: str, voice: Optional[str] = None) -> AsyncGenerator[bytes, None]:
        """Stream raw MP3 audio chunks as they are synthesized."""
        if not text.strip():
            return

        selected_voice = voice or settings.get("voice", "tts_voice", "en-US-ChristopherNeural")
        rate = settings.get("voice", "tts_rate", "+5%")
        volume = settings.get("voice", "tts_volume", "+0%")

        self._is_speaking = True
        try:
            communicate = edge_tts.Communicate(text, selected_voice, rate=rate, volume=volume)
            async for chunk in communicate.stream():
                if not self._is_speaking:
                    break  # Interrupted
                if chunk["type"] == "audio":
                    yield chunk["data"]
        finally:
            self._is_speaking = False

    async def synthesize_to_file(self, text: str, output_path: Optional[Path] = None) -> Path:
        """Synthesize text and save to an MP3 file."""
        selected_voice = settings.get("voice", "tts_voice", "en-US-ChristopherNeural")
        rate = settings.get("voice", "tts_rate", "+5%")
        volume = settings.get("voice", "tts_volume", "+0%")

        out = output_path or (RECORDINGS_DIR / f"tts_{asyncio.get_event_loop().time():.0f}.mp3")
        communicate = edge_tts.Communicate(text, selected_voice, rate=rate, volume=volume)
        await communicate.save(str(out))
        return out

    async def list_available_voices(self) -> list:
        """Fetch all available neural voices."""
        try:
            voices = await edge_tts.list_voices()
            return [
                {
                    "name": v["Name"],
                    "gender": v.get("Gender", "Unknown"),
                    "locale": v.get("Locale", "en-US"),
                    "friendly_name": v.get("FriendlyName", v["Name"]),
                }
                for v in voices
                if v.get("Locale", "").startswith("en")
            ]
        except Exception:
            return [
                {"name": "en-US-ChristopherNeural", "gender": "Male", "locale": "en-US", "friendly_name": "Microsoft Christopher (Natural Male)"},
                {"name": "en-US-GuyNeural", "gender": "Male", "locale": "en-US", "friendly_name": "Microsoft Guy (Casual Male)"},
                {"name": "en-US-JennyNeural", "gender": "Female", "locale": "en-US", "friendly_name": "Microsoft Jenny (Clear Female)"},
                {"name": "en-GB-RyanNeural", "gender": "Male", "locale": "en-GB", "friendly_name": "Microsoft Ryan (British Male)"},
                {"name": "en-GB-SoniaNeural", "gender": "Female", "locale": "en-GB", "friendly_name": "Microsoft Sonia (British Female)"},
            ]


# Global singleton
tts_engine = TTSEngine()
