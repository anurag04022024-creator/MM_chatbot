"""Document Ingestion and Management API Router."""

from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.schemas import DocumentIngestResponse
from backend.database import get_db
from backend.security.file_validator import validate_uploaded_file
from backend.services.document_service import DocumentService
from backend.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/ingest", response_model=DocumentIngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Ingests PDF, TXT, or DOCX document into RAG knowledge base.
    Validates, extracts text, chunks, computes embeddings, and indexes.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required for document ingestion.",
        )

    content = await file.read()
    ext, mime_type, file_size, category = validate_uploaded_file(file.filename, content)

    if category != "document":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected a document file (.pdf, .txt, .docx), but received {category}.",
        )

    return DocumentService.ingest_document(
        db=db,
        filename=file.filename,
        content=content,
        extra_metadata={"source": "api_upload", "file_size": file_size},
    )


@router.get("", response_model=List[dict])
def list_documents(db: Session = Depends(get_db)):
    """Lists all documents registered in the RAG knowledge base."""
    repo = DocumentRepository(db)
    docs = repo.list_documents()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "document_type": d.document_type,
            "chunk_count": len(d.chunks),
            "created_at": d.created_at,
        }
        for d in docs
    ]
