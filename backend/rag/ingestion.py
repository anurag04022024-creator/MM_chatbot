"""Document Ingestion and Parsing Pipeline.

Supports:
- PDF (via pypdf)
- DOCX (via python-docx)
- TXT (UTF-8)

Extracts clean text, generates chunks, computes embeddings, and indexes into VectorStore.
"""

import io
from pathlib import Path
from typing import Tuple, List, Dict, Any
from pypdf import PdfReader
from docx import Document as DocxDocument
from fastapi import HTTPException, status
from backend.rag.chunker import TextChunker
from backend.providers.factory import get_embedding_provider
from backend.rag.vector_store import get_vector_store
from backend.core.logging_config import setup_logging

logger = setup_logging()


def extract_text_from_pdf(content: bytes) -> str:
    """Extracts text pages from PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception as exc:
        logger.error(f"Failed to parse PDF: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the uploaded PDF. The file may be encrypted or corrupted.",
        )


def extract_text_from_docx(content: bytes) -> str:
    """Extracts text paragraphs from DOCX bytes."""
    try:
        doc = DocxDocument(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as exc:
        logger.error(f"Failed to parse DOCX: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the uploaded DOCX document.",
        )


def extract_text_from_txt(content: bytes) -> str:
    """Extracts text from TXT bytes with multi-encoding fallback."""
    for encoding in ["utf-8", "latin-1", "cp1252"]:
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Text file encoding not supported. Please use UTF-8.",
    )


def parse_document_content(filename: str, content: bytes) -> Tuple[str, str]:
    """
    Parses document bytes into raw text based on extension.
    Returns (cleaned_text, document_type).
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        text = extract_text_from_pdf(content)
        doc_type = "pdf"
    elif ext == "docx":
        text = extract_text_from_docx(content)
        doc_type = "docx"
    elif ext == "txt":
        text = extract_text_from_txt(content)
        doc_type = "txt"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format: .{ext}. Supported formats are: PDF, DOCX, TXT.",
        )

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The document does not contain readable text.",
        )

    return text.strip(), doc_type


def ingest_document_bytes(
    document_id: str,
    filename: str,
    content: bytes,
    extra_metadata: Dict[str, Any] | None = None,
) -> Tuple[int, int, str, List[Dict[str, Any]]]:
    """
    Parses, chunks, embeds, and indexes document into the vector store.

    Returns:
        (chunks_created_count, total_characters, document_type, structured_chunks)
    """
    raw_text, doc_type = parse_document_content(filename, content)

    chunker = TextChunker(chunk_size=500, chunk_overlap=80)
    chunks = chunker.create_chunks(
        document_id=document_id,
        filename=filename,
        text=raw_text,
        extra_metadata=extra_metadata,
    )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to generate chunks from the document content.",
        )

    texts_to_embed = [c["text"] for c in chunks]
    embedding_provider = get_embedding_provider()
    embeddings = embedding_provider.embed_documents(texts_to_embed)

    vector_store = get_vector_store()
    vector_store.add_documents(chunks, embeddings)

    logger.info(f"Ingested document {filename} ({document_id}): {len(chunks)} chunks, {len(raw_text)} chars.")
    return len(chunks), len(raw_text), doc_type, chunks
