"""Pydantic Request and Response Schemas.

Enforces strict input validation, data contracts, and type safety.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class SafetyTier(str, Enum):
    """Safety classification tiers for user inputs."""
    SAFE = "safe"
    SENSITIVE = "sensitive"
    HIGH_RISK = "high_risk"


class SourceCitation(BaseModel):
    """Citation metadata for retrieved RAG chunks."""
    document_id: str
    filename: str
    chunk_id: str
    source: str
    similarity_score: float
    content_snippet: Optional[str] = None


class ChatRequest(BaseModel):
    """Input payload for user chat requests."""
    session_id: str = Field(..., min_length=1, max_length=64, description="Session identifier")
    message: Optional[str] = Field(default="", max_length=4000, description="User text input")
    image_file_id: Optional[str] = Field(default=None, description="ID of uploaded image to attach")
    audio_file_id: Optional[str] = Field(default=None, description="ID of uploaded audio to transcribe/attach")
    document_ids: Optional[List[str]] = Field(default=[], description="Specific document IDs for targeted RAG")
    use_rag: bool = Field(default=True, description="Whether to query knowledge base")


class ChatResponse(BaseModel):
    """Output payload from assistant chat generation."""
    conversation_id: str
    session_id: str
    role: str = "assistant"
    content: str
    input_type: str = "text"
    safety_tier: SafetyTier
    sources: List[SourceCitation] = []
    created_at: datetime


class MessageResponse(BaseModel):
    """Single message response schema."""
    id: str
    conversation_id: str
    role: str
    content: str
    input_type: str
    metadata_: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        serialization_alias="metadata",
        validation_alias="metadata_",
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ConversationResponse(BaseModel):
    """Full conversation history schema."""
    id: str
    session_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FileUploadResponse(BaseModel):
    """Upload confirmation schema."""
    file_id: str
    filename: str
    file_type: str
    file_size: int
    category: Literal["image", "audio", "document"]
    message: str = "File uploaded and validated successfully."


class AudioTranscribeResponse(BaseModel):
    """Audio transcription output schema."""
    transcript: str
    duration_seconds: Optional[float] = None
    confidence: Optional[float] = None


class DocumentIngestResponse(BaseModel):
    """Ingestion confirmation for RAG documents."""
    document_id: str
    filename: str
    document_type: str
    chunks_created: int
    total_characters: int
    message: str = "Document parsed, chunked, and indexed into vector store."


class RAGSearchRequest(BaseModel):
    """RAG similarity search request."""
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=4, ge=1, le=10)
    min_score: float = Field(default=0.4, ge=0.0, le=1.0)


class RAGSearchResult(BaseModel):
    """Single RAG search hit."""
    chunk_id: str
    document_id: str
    filename: str
    text: str
    similarity_score: float
    metadata: Dict[str, Any] = {}


class RAGSearchResponse(BaseModel):
    """RAG search collection response."""
    query: str
    total_found: int
    results: List[RAGSearchResult]


class HealthResponse(BaseModel):
    """System health check payload."""
    status: Literal["healthy", "degraded", "unhealthy"]
    environment: str
    database_type: str
    llm_provider: str
    timestamp: datetime
