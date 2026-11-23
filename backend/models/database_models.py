"""SQLAlchemy Database Models for Relational Storage.

Defines schemas for conversations, messages, uploaded files, and RAG document metadata.
Uses UUID primary keys and indexes for query efficiency.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid() -> str:
    """Generates unique UUID4 string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Returns current UTC timestamp."""
    return datetime.now(timezone.utc)


class Conversation(Base):
    """Conversation session container."""

    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at"
    )
    uploaded_files = relationship(
        "UploadedFile", back_populates="conversation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_conversations_session_created", "session_id", "created_at"),
    )


class Message(Base):
    """Individual chat messages within a conversation."""

    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    input_type = Column(String(32), default="text", nullable=False)  # "text", "image", "audio", "multimodal"
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("idx_messages_conv_created", "conversation_id", "created_at"),
    )


class UploadedFile(Base):
    """Metadata tracking for uploaded media and user files."""

    __tablename__ = "uploaded_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_type = Column(String(100), nullable=False)  # e.g., "image/png", "audio/mp3", "application/pdf"
    file_size = Column(Integer, nullable=False)      # Size in bytes
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="uploaded_files")


class RAGDocument(Base):
    """Knowledge base ingested document record."""

    __tablename__ = "rag_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    document_type = Column(String(20), nullable=False)  # "pdf", "txt", "docx"
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    chunks = relationship("RAGChunk", back_populates="document", cascade="all, delete-orphan")


class RAGChunk(Base):
    """Text chunks extracted from RAG documents with vector references."""

    __tablename__ = "rag_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("rag_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding_reference = Column(String(128), nullable=True)  # ID in vector store
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    document = relationship("RAGDocument", back_populates="chunks")

    __table_args__ = (
        Index("idx_rag_chunks_doc_idx", "document_id", "chunk_index"),
    )
