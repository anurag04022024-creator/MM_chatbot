"""Abstract Base Classes for AI Model Providers.

Defines vendor-neutral interfaces for LLM, Vision, Speech-to-Text, and Embeddings.
Allows seamless substitution of Gemini, OpenAI, Hugging Face, or Local models.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any


class LLMProvider(ABC):
    """Abstract interface for text and conversational language models."""

    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generates single-turn text completion."""
        pass

    @abstractmethod
    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        """Generates conversational response given conversation history."""
        pass


class VisionProvider(ABC):
    """Abstract interface for multimodal vision and image understanding."""

    @abstractmethod
    def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_prompt: Optional[str] = None,
    ) -> str:
        """Extracts semantic visual details, OCR text, and emotional scene context."""
        pass


class SpeechToTextProvider(ABC):
    """Abstract interface for speech transcription."""

    @abstractmethod
    def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
    ) -> str:
        """Converts user audio recording into text."""
        pass


class EmbeddingProvider(ABC):
    """Abstract interface for dense vector embeddings."""

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generates vector embedding for single text string."""
        pass

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates vector embeddings for a list of text chunks."""
        pass
