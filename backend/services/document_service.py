"""Document Management and RAG Ingestion Service.

Tracks uploaded documents in the relational database, runs chunking,
computes vector embeddings, and registers chunks in the persistent vector store.
"""

from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models.database_models import RAGDocument, RAGChunk
from backend.models.schemas import DocumentIngestResponse, RAGSearchResult, RAGSearchResponse
from backend.rag.ingestion import ingest_document_bytes
from backend.rag.retriever import retrieve_relevant_chunks
from backend.core.logging_config import setup_logging

logger = setup_logging()


class DocumentService:
    """Coordinates document ingestion and vector retrieval operations."""

    @staticmethod
    def ingest_document(
        db: Session,
        filename: str,
        content: bytes,
        extra_metadata: Dict[str, Any] | None = None,
    ) -> DocumentIngestResponse:
        """Parses document, persists records in MySQL, and indexes vectors."""
        extra_meta = extra_metadata or {}

        # Create RAGDocument record
        doc_record = RAGDocument(
            filename=filename,
            document_type=filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown",
            metadata_=extra_meta,
        )
        db.add(doc_record)
        db.flush()  # Obtain doc_record.id

        # Ingest into vector store
        chunks_count, total_chars, doc_type, chunks = ingest_document_bytes(
            document_id=doc_record.id,
            filename=filename,
            content=content,
            extra_metadata=extra_meta,
        )

        for c in chunks:
            chunk_rec = RAGChunk(
                id=c["chunk_id"],
                document_id=doc_record.id,
                chunk_text=c["text"],
                chunk_index=c["chunk_index"],
                embedding_reference=c["chunk_id"],
                metadata_=c["metadata"],
            )
            db.add(chunk_rec)

        doc_record.document_type = doc_type
        db.commit()

        return DocumentIngestResponse(
            document_id=doc_record.id,
            filename=filename,
            document_type=doc_type,
            chunks_created=chunks_count,
            total_characters=total_chars,
        )

    @staticmethod
    def search_knowledge_base(
        query: str,
        top_k: int = 4,
        min_score: float = 0.35,
        filter_doc_ids: List[str] | None = None,
    ) -> RAGSearchResponse:
        """Performs similarity retrieval on the knowledge base."""
        hits = retrieve_relevant_chunks(
            query=query,
            top_k=top_k,
            min_score=min_score,
            filter_doc_ids=filter_doc_ids,
        )

        results = [
            RAGSearchResult(
                chunk_id=hit["chunk_id"],
                document_id=hit["document_id"],
                filename=hit["filename"],
                text=hit["text"],
                similarity_score=hit["similarity_score"],
                metadata=hit["metadata"],
            )
            for hit in hits
        ]

        return RAGSearchResponse(
            query=query,
            total_found=len(results),
            results=results,
        )
