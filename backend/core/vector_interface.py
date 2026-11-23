"""Modular Vector Store Interface.

Decouples RAG indexing and similarity retrieval from specific vector database engines
(e.g., Chroma, FAISS, Milvus, Qdrant, or embedded cosine index).
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class VectorStore(ABC):
    """Abstract contract for vector database storage and retrieval."""

    @abstractmethod
    def add_documents(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> List[str]:
        """
        Stores document chunks and corresponding embedding vectors.

        Args:
            chunks: List of dicts containing 'chunk_id', 'text', 'metadata', 'document_id'
            embeddings: List of float vectors

        Returns:
            List of generated/stored vector IDs
        """
        pass

    @abstractmethod
    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 4,
        min_score: float = 0.35,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-K most similar chunks above min_score threshold.

        Returns list of dicts:
            [{
                'chunk_id': str,
                'document_id': str,
                'filename': str,
                'text': str,
                'similarity_score': float,
                'metadata': dict
            }]
        """
        pass

    @abstractmethod
    def delete_documents(self, document_ids: List[str]) -> None:
        """Removes all indexed chunks associated with the specified document IDs."""
        pass
