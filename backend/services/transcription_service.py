"""Audio Transcription Service.

Coordinates speech-to-text processing for uploaded and recorded voice inputs.
"""

from pathlib import Path
from backend.providers.factory import get_stt_provider
from backend.models.schemas import AudioTranscribeResponse
from backend.core.logging_config import setup_logging

logger = setup_logging()


class TranscriptionService:
    """Manages audio transcription requests."""

    @staticmethod
    def transcribe(audio_bytes: bytes, filename: str) -> AudioTranscribeResponse:
        stt_provider = get_stt_provider()
        transcript = stt_provider.transcribe_audio(audio_bytes, filename)
        logger.info(f"Transcribed audio file {filename}: {len(transcript)} characters.")
        return AudioTranscribeResponse(
            transcript=transcript,
            duration_seconds=None,
            confidence=0.95,
        )
