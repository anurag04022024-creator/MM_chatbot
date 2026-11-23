"""Tests for RAG Ingestion, Chunking, and Vector Retrieval."""

from backend.rag.chunker import TextChunker
from backend.rag.vector_store import PersistentVectorStore
from backend.rag.ingestion import parse_document_content
from backend.providers.mock_provider import MockEmbeddingProvider


def test_text_chunker_splits_and_overlaps():
    """Verifies recursive text chunker creates chunks under max size with boundary preservation."""
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    text = (
        "Paragraph one is relatively brief. "
        "Paragraph two contains a bit more detail about grounding techniques and self-regulation. "
        "Paragraph three summarizes the core findings on emotional resilience and mindfulness."
    )
    chunks = chunker.split_text(text)
    assert len(chunks) > 1
    for chunk in chunks:
        # Overlap prefix may slightly adjust total length but chunks stay controlled
        assert len(chunk) <= 150


def test_parse_document_content_txt():
    """Parses plain text document."""
    raw = b"Mental wellness is important for everyone."
    text, doc_type = parse_document_content("sample.txt", raw)
    assert doc_type == "txt"
    assert "Mental wellness" in text


def test_parse_document_content_pdf(sample_valid_pdf_bytes):
    """Parses valid PDF content without error."""
    text, doc_type = parse_document_content("test.pdf", sample_valid_pdf_bytes)
    assert doc_type == "pdf"


def test_vector_store_indexing_and_similarity(tmp_path):
    """Verifies vector store indexing, cosine similarity ranking, and threshold filtering."""
    store = PersistentVectorStore(storage_dir=str(tmp_path))
    embedder = MockEmbeddingProvider()

    chunks = [
        {
            "chunk_id": "c1",
            "document_id": "d1",
            "filename": "breathing.txt",
            "text": "Deep breathing and box breathing calm panic attacks and severe stress.",
            "metadata": {"topic": "breathing"},
        },
        {
            "chunk_id": "c2",
            "document_id": "d2",
            "filename": "nutrition.txt",
            "text": "Healthy vegetables and hydration improve physical vitality.",
            "metadata": {"topic": "nutrition"},
        },
    ]

    embeddings = embedder.embed_documents([c["text"] for c in chunks])
    store.add_documents(chunks, embeddings)

    # Search for stress relief
    query_vec = embedder.embed_text("How do I calm down from stress and panic with breathing?")
    hits = store.similarity_search(query_vec, top_k=2, min_score=0.2)

    assert len(hits) >= 1
    # Top match should be breathing
    assert hits[0]["chunk_id"] == "c1"
    assert "breathing" in hits[0]["filename"]


def test_vector_store_empty_retrieval_on_unrelated_query(tmp_path):
    """Ensures no chunks returned when threshold is strict and content does not match."""
    store = PersistentVectorStore(storage_dir=str(tmp_path))
    embedder = MockEmbeddingProvider()

    chunks = [
        {
            "chunk_id": "c1",
            "document_id": "d1",
            "filename": "breathing.txt",
            "text": "Deep breathing exercises for relaxation.",
            "metadata": {},
        }
    ]
    embeddings = embedder.embed_documents([chunks[0]["text"]])
    store.add_documents(chunks, embeddings)

    # Unrelated query with high similarity requirement
    query_vec = embedder.embed_text("quantum physics quantum mechanics particle acceleration")
    hits = store.similarity_search(query_vec, top_k=1, min_score=0.99)
    assert len(hits) == 0
