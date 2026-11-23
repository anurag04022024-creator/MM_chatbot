"""Deterministic Mock Provider for Testing and Zero-Credential Local Execution.

Generates realistic responses, semantic vision descriptions, audio transcriptions,
and deterministic dense vectors without requiring external network calls or API keys.
"""

import hashlib
import io
import math
from typing import List, Dict, Optional, Any
from PIL import Image
from backend.core.providers import (
    LLMProvider,
    VisionProvider,
    SpeechToTextProvider,
    EmbeddingProvider,
)
from backend.core.logging_config import setup_logging

logger = setup_logging()


class MockLLMProvider(LLMProvider):
    """Generates empathetic mock responses grounded in provided RAG context."""

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        return self._craft_response(prompt)

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        last_msg = messages[-1].get("content", "") if messages else ""
        return self._craft_response(last_msg)

    def _craft_response(self, prompt: str) -> str:
        lower = prompt.lower()

        # Coding queries
        if "loop" in lower and "python" in lower:
            return (
                "In Python, loops allow repeating a block of code. Here are the primary forms:\n\n"
                "### 1. `for` Loop\n"
                "```python\n"
                "fruits = ['apple', 'banana', 'cherry']\n"
                "for index, fruit in enumerate(fruits, start=1):\n"
                "    print(f'{index}. {fruit}')\n"
                "```\n\n"
                "### 2. `while` Loop\n"
                "```python\n"
                "count = 3\n"
                "while count > 0:\n"
                "    print(f'Counting down: {count}')\n"
                "    count -= 1\n"
                "```\n\n"
                "### 3. List Comprehension\n"
                "```python\n"
                "squares = [x**2 for x in range(1, 6)]\n"
                "print(squares)  # [1, 4, 9, 16, 25]\n"
                "```"
            )

        if "photo" in lower and "synth" in lower:
            return (
                "**Photosynthesis** is the process by which green plants and algae convert light energy into chemical energy:\n\n"
                "$$6CO_2 + 6H_2O + \\text{Light} \\longrightarrow C_6H_{12}O_6 + 6O_2$$\n\n"
                "1. **Light Reactions**: Occur in thylakoids; sunlight splits water into oxygen, ATP, and NADPH.\n"
                "2. **Calvin Cycle**: Occurs in stroma; ATP and NADPH fix carbon dioxide into glucose."
            )

        # Check if RAG context was provided
        has_rag = "<RETRIEVED_KNOWLEDGE>" in prompt and "No relevant knowledge" not in prompt
        if has_rag:
            return (
                "Based on the verified knowledge base resources:\n\n"
                "The core principles emphasize systematic understanding, steady pacing, and practical application. "
                "How would you like to explore this further?"
            )

        return (
            f"Here is a direct answer regarding your inquiry on **{prompt.strip()[:60]}**:\n\n"
            "1. **Core Concept**: The topic relies on foundational principles and systematic verification.\n"
            "2. **Practical Application**: In real-world scenarios, breaking complex problems into modular steps yields clear and reproducible results.\n"
            "3. **Next Steps**: Let me know if you would like code examples, detailed mathematical derivations, or specific domain explanations!"
        )


class MockVisionProvider(VisionProvider):
    """Inspects uploaded image properties and generates a structured semantic summary."""

    def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_prompt: Optional[str] = None,
    ) -> str:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            mode = image.mode
            format_name = image.format or mime_type

            return (
                f"[Visual Context: Image of format {format_name}, resolution {width}x{height}px, color mode {mode}. "
                f"The image exhibits a calm, serene atmosphere. User query regarding this image: '{user_prompt or 'Describe this image'}']"
            )
        except Exception as exc:
            logger.warning(f"Mock vision failed to parse image bytes: {exc}")
            return "[Visual Context: Uploaded image detected and verified.]"


class MockSpeechToTextProvider(SpeechToTextProvider):
    """Simulates realistic audio transcription."""

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
    ) -> str:
        size_kb = len(audio_bytes) / 1024
        return (
            f"I have been feeling quite overwhelmed lately and needed a safe space to talk through what is on my mind."
        )


class MockEmbeddingProvider(EmbeddingProvider):
    """
    Produces deterministic normalized dense vectors (128 dimensions).
    Uses word frequency hashing so semantically similar phrases have higher cosine similarity.
    """

    DIMENSION = 128

    def _vectorize(self, text: str) -> List[float]:
        # Normalize text tokens
        tokens = text.lower().split()
        vec = [0.0] * self.DIMENSION

        if not tokens:
            return [1.0 / math.sqrt(self.DIMENSION)] * self.DIMENSION

        for token in tokens:
            # Deterministic hash mapping to dimension slots
            h = int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16)
            slot = h % self.DIMENSION
            weight = 1.0 + (h % 5) * 0.2
            vec[slot] += weight

        # L2 normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def embed_text(self, text: str) -> List[float]:
        return self._vectorize(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._vectorize(t) for t in texts]
