"""Multimodal Processing and Unified Representation Service.

Aggregates text, image visual semantics, and audio transcripts into a unified internal
representation before orchestrating RAG and LLM response generation.
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.database_models import UploadedFile
from backend.providers.factory import get_vision_provider, get_stt_provider
from backend.core.logging_config import setup_logging

logger = setup_logging()


class UnifiedMultimodalContext:
    """Internal standardized representation of multimodal user inputs."""

    def __init__(
        self,
        session_id: str,
        input_types: List[str],
        text: str = "",
        image_context: str = "",
        audio_transcript: str = "",
        combined_query: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.session_id = session_id
        self.input_types = input_types
        self.text = text
        self.image_context = image_context
        self.audio_transcript = audio_transcript
        self.combined_query = combined_query
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "input_types": self.input_types,
            "text": self.text,
            "image_context": self.image_context,
            "audio_transcript": self.audio_transcript,
            "combined_query": self.combined_query,
            "metadata": self.metadata,
        }


class MultimodalService:
    """Processes diverse modalities and builds unified context."""

    @staticmethod
    def process_inputs(
        db: Session,
        session_id: str,
        text: Optional[str] = None,
        image_file_id: Optional[str] = None,
        audio_file_id: Optional[str] = None,
    ) -> UnifiedMultimodalContext:
        input_types = []
        user_text = (text or "").strip()
        if user_text:
            input_types.append("text")

        image_context = ""
        if image_file_id:
            file_rec = db.query(UploadedFile).filter(UploadedFile.id == image_file_id).first()
            if file_rec and Path(file_rec.storage_path).exists():
                try:
                    with open(file_rec.storage_path, "rb") as f:
                        img_bytes = f.read()
                    vision_provider = get_vision_provider()
                    image_context = vision_provider.analyze_image(
                        image_bytes=img_bytes,
                        mime_type=file_rec.file_type,
                        user_prompt=user_text,
                    )
                    input_types.append("image")
                    logger.info(f"Processed image {file_rec.original_filename} into semantic context.")
                except Exception as exc:
                    logger.error(f"Error processing image {image_file_id}: {exc}")
                    image_context = "[Image could not be fully analyzed]"

        audio_transcript = ""
        if audio_file_id:
            file_rec = db.query(UploadedFile).filter(UploadedFile.id == audio_file_id).first()
            if file_rec and Path(file_rec.storage_path).exists():
                try:
                    with open(file_rec.storage_path, "rb") as f:
                        audio_bytes = f.read()
                    stt_provider = get_stt_provider()
                    audio_transcript = stt_provider.transcribe_audio(
                        audio_bytes=audio_bytes,
                        filename=file_rec.original_filename,
                    )
                    input_types.append("audio")
                    logger.info(f"Transcribed audio {file_rec.original_filename} successfully.")
                except Exception as exc:
                    logger.error(f"Error transcribing audio {audio_file_id}: {exc}")
                    audio_transcript = "[Audio transcription failed]"

        if not input_types:
            input_types.append("text")

        # Synthesize combined query for RAG retrieval
        query_parts = []
        if user_text:
            query_parts.append(user_text)
        if audio_transcript:
            query_parts.append(audio_transcript)
        if image_context:
            query_parts.append(f"Image context: {image_context}")

        combined_query = " ".join(query_parts).strip()

        return UnifiedMultimodalContext(
            session_id=session_id,
            input_types=input_types,
            text=user_text,
            image_context=image_context,
            audio_transcript=audio_transcript,
            combined_query=combined_query,
            metadata={"image_file_id": image_file_id, "audio_file_id": audio_file_id},
        )
