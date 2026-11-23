"""Knowledge Base and RAG Inspector Component for Streamlit."""

import streamlit as st
from streamlit_app.api_client import APIClient


def render_rag_tab(api_client: APIClient) -> None:
    """Renders RAG document manager, file ingestion, and live similarity search."""
    st.header("📚 RAG Knowledge Base & Document Manager")

    st.markdown(
        "Upload educational wellness materials (PDF, DOCX, TXT). "
        "The system parses text, chunks content with boundary preservation, generates embeddings, "
        "and links sources directly into chatbot answers."
    )

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("📥 Ingest New Knowledge Document")
        doc_upload = st.file_uploader(
            "Choose Document",
            type=["pdf", "docx", "txt"],
            help="Supported: PDF, DOCX, TXT (Max 10MB)",
            key="rag_doc_uploader",
        )
        if doc_upload is not None:
            if st.button("Ingest & Index Document", type="primary"):
                try:
                    with st.spinner(f"Parsing and indexing {doc_upload.name}..."):
                        res = api_client.ingest_document(doc_upload.name, doc_upload.getvalue())
                        st.success(
                            f"✅ Ingested successfully!\n\n"
                            f"• Chunks Created: `{res['chunks_created']}`\n"
                            f"• Characters: `{res['total_characters']}`\n"
                            f"• Document ID: `{res['document_id'][:8]}...`"
                        )
                except Exception as exc:
                    st.error(f"Ingestion failed: {exc}")

    with col2:
        st.subheader("🔍 Live Knowledge Base Search")
        search_query = st.text_input(
            "Test search query against knowledge base:",
            placeholder="e.g., How does 5-4-3-2-1 grounding work?",
        )
        top_k = st.slider("Top K results", min_value=1, max_value=6, value=3)
        min_score = st.slider("Minimum similarity threshold", min_value=0.0, max_value=1.0, value=0.35, step=0.05)

        if st.button("Run Similarity Search"):
            if search_query.strip():
                try:
                    with st.spinner("Searching vector index..."):
                        search_res = api_client.search_rag(search_query, top_k=top_k, min_score=min_score)
                        hits = search_res.get("results", [])
                        if hits:
                            st.write(f"Found **{len(hits)}** matching chunks:")
                            for h in hits:
                                st.markdown(
                                    f"**{h['filename']}** `[Similarity: {h['similarity_score']:.3f}]`\n"
                                    f"> {h['text']}"
                                )
                        else:
                            st.warning("No knowledge base chunks exceeded the similarity threshold.")
                except Exception as exc:
                    st.error(f"Search failed: {exc}")
            else:
                st.info("Please enter a search query.")

    st.divider()
    st.subheader("📑 Registered Knowledge Base Documents")
    try:
        docs = api_client.list_documents()
        if docs:
            st.table([
                {
                    "Document ID": d["id"][:8] + "...",
                    "Filename": d["filename"],
                    "Type": d["document_type"].upper(),
                    "Chunks Indexed": d["chunk_count"],
                    "Created At": d["created_at"],
                }
                for d in docs
            ])
        else:
            st.info("No documents registered yet. Upload a document or restart backend to load seed files.")
    except Exception as exc:
        st.warning(f"Could not load document registry: {exc}")
