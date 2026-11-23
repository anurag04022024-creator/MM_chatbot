"""RAG Vector Search API Router."""

from fastapi import APIRouter
from backend.models.schemas import RAGSearchRequest, RAGSearchResponse
from backend.services.document_service import DocumentService

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/search", response_model=RAGSearchResponse)
def search_rag(request: RAGSearchRequest):
    """
    Direct similarity search on the knowledge base.
    Useful for testing retrieval, inspection, and frontend citations.
    """
    return DocumentService.search_knowledge_base(
        query=request.query,
        top_k=request.top_k,
        min_score=request.min_score,
    )
