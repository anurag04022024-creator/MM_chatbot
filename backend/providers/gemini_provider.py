"""Google Gemini API Provider for Text, Multimodal Vision, Audio, and Embeddings.

Communicates with Gemini via standard secure HTTPS REST endpoints, supporting:
- Gemini 2.5 Flash for text and chat generation
- Multimodal image reasoning
- Audio transcription and audio comprehension
- Text embeddings (gemini-embedding-001)
"""

import base64
from typing import List, Dict, Optional, Any
import httpx
from backend.core.providers import (
    LLMProvider,
    VisionProvider,
    SpeechToTextProvider,
    EmbeddingProvider,
)
from backend.core.logging_config import setup_logging

logger = setup_logging()

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-flash-lite-latest"
CANDIDATE_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]
EMBEDDING_MODEL = "gemini-embedding-001"


class GeminiProvider(LLMProvider, VisionProvider, SpeechToTextProvider, EmbeddingProvider):
    """Unified Google Gemini implementation across all modality interfaces."""

    def __init__(self, api_key: str, model_name: str = DEFAULT_MODEL):
        self.api_key = api_key.strip()
        self.model_name = model_name
        self.client = httpx.Client(timeout=30.0)

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        # If calling generateContent on a model, try candidate models if quota or availability errors occur
        if ":generateContent" in endpoint:
            models_to_try = [self.model_name] + [m for m in CANDIDATE_MODELS if m != self.model_name]
            last_exc = None
            for candidate in models_to_try:
                cand_endpoint = f"models/{candidate}:generateContent"
                url = f"{GEMINI_BASE_URL}/{cand_endpoint}?key={self.api_key}"
                try:
                    response = self.client.post(url, json=payload)
                    if response.status_code == 200:
                        return response.json()
                    logger.warning(f"Candidate model {candidate} returned {response.status_code}: {response.text[:120]}")
                except Exception as exc:
                    logger.warning(f"Candidate model {candidate} exception: {exc}")
                    last_exc = exc
            if last_exc:
                raise last_exc
            raise RuntimeError("All Gemini candidate models failed to generate content.")

        url = f"{GEMINI_BASE_URL}/{endpoint}?key={self.api_key}"
        last_response = None
        for attempt in range(3):
            try:
                response = self.client.post(url, json=payload)
                last_response = response
                if response.status_code == 200:
                    return response.json()
                if response.status_code in (503, 429) and attempt < 2:
                    import time
                    time.sleep(1.5 * (attempt + 1))
                    continue
                logger.error(f"Gemini API request failed ({response.status_code}): {response.text}")
                response.raise_for_status()
            except httpx.HTTPStatusError:
                raise
            except Exception as e:
                if attempt < 2:
                    import time
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise
        if last_response is not None:
            last_response.raise_for_status()
        raise RuntimeError("Gemini API request failed after retries")

    # --- LLMProvider Implementation ---

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        data = self._post(f"models/{self.model_name}:generateContent", payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.error(f"Failed to parse Gemini response: {exc}")
            return "I apologize, but I could not formulate a response at this moment."

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"temperature": temperature}
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        data = self._post(f"models/{self.model_name}:generateContent", payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.error(f"Failed to parse Gemini chat response: {exc}")
            return "I am here with you, but I encountered an error preparing my response."

    # --- VisionProvider Implementation ---

    def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_prompt: Optional[str] = None,
    ) -> str:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        prompt = user_prompt or "Analyze this image and describe its visual elements, objects, text, and overall mood."

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": b64_image,
                            }
                        },
                    ]
                }
            ]
        }
        data = self._post(f"models/{self.model_name}:generateContent", payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return "Visual content parsed."

    # --- SpeechToTextProvider Implementation ---

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str,
    ) -> str:
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp3"
        mime_type = "audio/wav" if ext == "wav" else "audio/mp3"

        prompt = "Please transcribe the speech in this audio file accurately. Return only the transcribed text."
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": b64_audio,
                            }
                        },
                    ]
                }
            ]
        }
        data = self._post(f"models/{self.model_name}:generateContent", payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            return "[Audio transcription unavailable]"

    # --- EmbeddingProvider Implementation ---

    def embed_text(self, text: str) -> List[float]:
        payload = {
            "content": {"parts": [{"text": text}]}
        }
        data = self._post(f"models/{EMBEDDING_MODEL}:embedContent", payload)
        return data["embedding"]["values"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Batch embedding
        requests = [
            {"content": {"parts": [{"text": t}]}, "model": f"models/{EMBEDDING_MODEL}"}
            for t in texts
        ]
        payload = {"requests": requests}
        data = self._post(f"models/{EMBEDDING_MODEL}:batchEmbedContents", payload)
        return [entry["values"] for entry in data["embeddings"]]
