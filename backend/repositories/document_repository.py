"""Document and RAG Metadata Repository.

Encapsulates SQL operations for ingested RAG documents and chunks.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.database_models import RAGDocument, RAGChunk


class DocumentRepository:
    """Data access repository for RAG documents and chunks."""

    def __init__(self, db: Session):
        self.db = db

    def list_documents(self) -> List[RAGDocument]:
        """Lists all ingested documents with chunk counts."""
        return self.db.query(RAGDocument).order_by(RAGDocument.created_at.desc()).all()

    def get_document(self, document_id: str) -> Optional[RAGDocument]:
        """Retrieves document by UUID."""
        return self.db.query(RAGDocument).filter(RAGDocument.id == document_id).first()

    def record_chunk(
        self,
        document_id: str,
        chunk_text: str,
        chunk_index: int,
        embedding_reference: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RAGChunk:
        """Stores a chunk record linked to a document."""
        chunk = RAGChunk(
            document_id=document_id,
            chunk_text=chunk_text,
            chunk_index=chunk_index,
            embedding_reference=embedding_reference,
            metadata_=metadata or {},
        )
        self.db.add(chunk)
        self.db.commit()
        self.db.refresh(chunk)
        return chunk
