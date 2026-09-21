"""Voice Pipeline orchestrator for JARVIS."""

import asyncio
from typing import Callable, Optional
from voice.tts import tts_engine
from config.settings import settings


class VoicePipeline:
    """Coordinates microphone input, transcription, and speech output."""

    _instance: Optional["VoicePipeline"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VoicePipeline, cls).__new__(cls)
            cls._instance.is_listening = False
            cls._instance._broadcast_callback = None
        return cls._instance

    def set_broadcast_callback(self, cb: Callable):
        self._broadcast_callback = cb

    async def speak(self, text: str):
        """Synthesize text and stream audio chunks to connected WebSocket clients."""
        if not text or not text.strip():
            return

        if self._broadcast_callback:
            await self._broadcast_callback("status", "speaking")

        async for chunk in tts_engine.stream_audio(text):
            if self._broadcast_callback:
                await self._broadcast_callback("audio_chunk", chunk)

        if self._broadcast_callback:
            await self._broadcast_callback("status", "idle")

    def interrupt(self):
        """Barge-in: Immediately cut off TTS playback."""
        tts_engine.stop()


# Global singleton
voice_pipeline = VoicePipeline()
