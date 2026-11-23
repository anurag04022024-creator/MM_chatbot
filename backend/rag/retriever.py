"""RAG Knowledge Retriever.

Embeds queries and retrieves top-K grounded chunks with similarity score thresholding.
"""

from typing import List, Dict, Any, Optional
from backend.providers.factory import get_embedding_provider
from backend.rag.vector_store import get_vector_store
from backend.core.logging_config import setup_logging

logger = setup_logging()


def retrieve_relevant_chunks(
    query: str,
    top_k: int = 4,
    min_score: float = 0.35,
    filter_doc_ids: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Embeds query and queries the vector store for top matching document chunks.

    Returns:
        List of matching chunks sorted by similarity score descending.
    """
    if not query or not query.strip():
        return []

    embedding_provider = get_embedding_provider()
    query_vector = embedding_provider.embed_text(query.strip())

    vector_store = get_vector_store()
    results = vector_store.similarity_search(
        query_vector=query_vector,
        top_k=top_k,
        min_score=min_score,
    )

    if filter_doc_ids:
        allowed_set = set(filter_doc_ids)
        results = [r for r in results if r.get("document_id") in allowed_set]

    logger.info(f"Retrieved {len(results)} chunks for query (top_k={top_k}, min_score={min_score})")
    return results
