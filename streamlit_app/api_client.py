"""Streamlit HTTP API Client.

Streamlit connects strictly to the FastAPI backend gateway.
No direct database or AI provider access from the UI.
"""

from typing import Dict, Any, List, Optional
import httpx
from backend.config import get_settings

settings = get_settings()


class APIClient:
    """Client for communicating with the FastAPI backend service."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.BACKEND_API_URL).rstrip("/")
        self.timeout = httpx.Timeout(30.0, connect=5.0)

    def check_health(self) -> Dict[str, Any]:
        """Queries backend /health endpoint."""
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(f"{self.base_url}/health")
            resp.raise_for_status()
            return resp.json()

    def send_chat(
        self,
        session_id: str,
        message: Optional[str] = None,
        image_file_id: Optional[str] = None,
        audio_file_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
        use_rag: bool = True,
    ) -> Dict[str, Any]:
        """Sends chat request to /chat."""
        payload = {
            "session_id": session_id,
            "message": message or "",
            "image_file_id": image_file_id,
            "audio_file_id": audio_file_id,
            "document_ids": document_ids or [],
            "use_rag": use_rag,
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/chat", json=payload)
            resp.raise_for_status()
            return resp.json()

    def upload_file(self, filename: str, content: bytes, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """Uploads a multimodal file via multipart/form-data to /upload."""
        files = {"file": (filename, content)}
        data = {}
        if conversation_id:
            data["conversation_id"] = conversation_id

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/upload", files=files, data=data)
            resp.raise_for_status()
            return resp.json()

    def transcribe_audio(self, filename: str, content: bytes) -> Dict[str, Any]:
        """Uploads audio file to /audio/transcribe."""
        files = {"file": (filename, content)}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/audio/transcribe", files=files)
            resp.raise_for_status()
            return resp.json()

    def ingest_document(self, filename: str, content: bytes) -> Dict[str, Any]:
        """Ingests PDF/TXT/DOCX file into knowledge base at /documents/ingest."""
        files = {"file": (filename, content)}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/documents/ingest", files=files)
            resp.raise_for_status()
            return resp.json()

    def list_documents(self) -> List[Dict[str, Any]]:
        """Retrieves list of registered RAG documents."""
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(f"{self.base_url}/documents")
            resp.raise_for_status()
            return resp.json()

    def search_rag(self, query: str, top_k: int = 4, min_score: float = 0.35) -> Dict[str, Any]:
        """Performs similarity search via /rag/search."""
        payload = {"query": query, "top_k": top_k, "min_score": min_score}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/rag/search", json=payload)
            resp.raise_for_status()
            return resp.json()

    def get_conversation_history(self, session_id: str) -> Dict[str, Any]:
        """Retrieves message history for a session."""
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(f"{self.base_url}/conversations/session/{session_id}")
            resp.raise_for_status()
            return resp.json()
