"""Persistent Vector Store Implementation with Cosine Similarity Search.

Implements the VectorStore interface using local disk persistence and NumPy vector math.
Provides thread-safe indexing, similarity scoring, metadata filtering, and thresholding.
"""

import json
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from backend.core.vector_interface import VectorStore
from backend.config import get_settings
from backend.core.logging_config import setup_logging

logger = setup_logging()
settings = get_settings()


class PersistentVectorStore(VectorStore):
    """File-backed dense vector index with cosine similarity search."""

    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir or settings.VECTOR_DB_DIR).resolve()
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_dir / "vector_index.json"
        self._lock = threading.Lock()
        self._data: List[Dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        """Loads indexed chunks and embeddings from persistent storage."""
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                logger.info(f"Loaded {len(self._data)} vectors from {self.index_file}")
            except Exception as exc:
                logger.error(f"Failed to load vector index: {exc}. Initializing empty store.")
                self._data = []
        else:
            self._data = []

    def _save(self) -> None:
        """Persists indexed chunks and embeddings to disk safely via temporary file."""
        temp_file = self.index_file.with_suffix(".tmp")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False)
            temp_file.replace(self.index_file)
        except Exception as exc:
            logger.error(f"Error persisting vector store: {exc}")
            if temp_file.exists():
                temp_file.unlink(missing_ok=True)

    def add_documents(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> List[str]:
        """Indexes new document chunks with their embedding vectors."""
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks count must exactly match embeddings count.")

        vector_ids = []
        with self._lock:
            for chunk, emb in zip(chunks, embeddings):
                vector_id = str(chunk.get("chunk_id"))
                record = {
                    "vector_id": vector_id,
                    "chunk_id": vector_id,
                    "document_id": chunk.get("document_id", ""),
                    "filename": chunk.get("filename", "Unknown"),
                    "text": chunk.get("text", ""),
                    "metadata": chunk.get("metadata", {}),
                    "embedding": emb,
                }
                # Remove existing record with same chunk_id if present
                self._data = [d for d in self._data if d.get("chunk_id") != vector_id]
                self._data.append(record)
                vector_ids.append(vector_id)

            self._save()

        logger.info(f"Indexed {len(chunks)} chunks into vector store.")
        return vector_ids

    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 4,
        min_score: float = 0.35,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Executes cosine similarity search over stored vectors.
        Filters by min_score and optional metadata fields.
        """
        with self._lock:
            candidates = list(self._data)

        if not candidates or not query_vector:
            return []

        # Apply metadata filters if provided
        if filter_metadata:
            filtered = []
            for item in candidates:
                item_meta = item.get("metadata", {})
                match = all(item_meta.get(k) == v for k, v in filter_metadata.items())
                if match:
                    filtered.append(item)
            candidates = filtered

        if not candidates:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        scored_results = []
        for item in candidates:
            doc_vec = np.array(item["embedding"], dtype=np.float32)
            if len(doc_vec) != len(q_vec):
                continue
            d_norm = np.linalg.norm(doc_vec)
            if d_norm == 0:
                score = 0.0
            else:
                score = float(np.dot(q_vec, doc_vec) / (q_norm * d_norm))

            if score >= min_score:
                scored_results.append({
                    "chunk_id": item["chunk_id"],
                    "document_id": item["document_id"],
                    "filename": item["filename"],
                    "text": item["text"],
                    "similarity_score": round(score, 4),
                    "metadata": item["metadata"],
                })

        # Sort descending by similarity score
        scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_results[:top_k]

    def delete_documents(self, document_ids: List[str]) -> None:
        """Deletes chunks belonging to the specified document IDs."""
        id_set = set(document_ids)
        with self._lock:
            initial_count = len(self._data)
            self._data = [d for d in self._data if d.get("document_id") not in id_set]
            deleted = initial_count - len(self._data)
            if deleted > 0:
                self._save()
        logger.info(f"Removed {deleted} chunks for document IDs: {document_ids}")


_vector_store_instance = None


def get_vector_store() -> VectorStore:
    """Returns singleton VectorStore instance."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = PersistentVectorStore()
    return _vector_store_instance
