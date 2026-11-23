"""Chat Orchestrator Service.

Coordinates safety triage, prompt-injection defense, multimodal aggregation,
RAG retrieval, conversation history, and LLM generation.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.schemas import ChatRequest, ChatResponse, SafetyTier, SourceCitation
from backend.repositories.conversation_repository import ConversationRepository
from backend.services.multimodal_service import MultimodalService
from backend.services.safety_service import SafetyService
from backend.security.injection_defense import (
    detect_prompt_injection,
    format_isolated_user_input,
    format_isolated_retrieved_context,
)
from backend.rag.retriever import retrieve_relevant_chunks
from backend.providers.factory import get_llm_provider
from backend.core.logging_config import setup_logging

logger = setup_logging()

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt_file(filename: str, fallback: str) -> str:
    """Safely loads prompt text from disk."""
    path = PROMPTS_DIR / filename
    if path.exists():
        try:
            return path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            logger.warning(f"Could not read prompt {filename}: {exc}")
    return fallback


def get_system_prompt() -> str:
    return load_prompt_file(
        "system_prompt.txt",
        "You are an intelligent, helpful, compassionate, and versatile AI assistant. "
        "Answer technical, coding, and general questions helpfully and directly, while providing compassionate support for emotional inquiries. "
        "Do not diagnose, do not prescribe medication, and do not pretend to be human.",
    )


def get_rag_prompt() -> str:
    return load_prompt_file(
        "rag_prompt.txt",
        "Use retrieved knowledge when relevant. For general or technical topics not covered in the knowledge base, answer directly from general knowledge.",
    )


class ChatService:
    """Main business logic orchestrator for user chat interactions."""

    @staticmethod
    def process_chat(db: Session, request: ChatRequest) -> ChatResponse:
        repo = ConversationRepository(db)
        conv = repo.get_or_create_conversation(request.session_id)

        # 1. Multimodal context processing
        mm_context = MultimodalService.process_inputs(
            db=db,
            session_id=request.session_id,
            text=request.message,
            image_file_id=request.image_file_id,
            audio_file_id=request.audio_file_id,
        )

        input_type_str = "+".join(mm_context.input_types) if mm_context.input_types else "text"

        # 2. Prompt injection defense check
        injection_detected, injection_reason = detect_prompt_injection(mm_context.combined_query)
        if injection_detected:
            logger.warning(f"Prompt injection pattern intercepted: {injection_reason}")

        # 3. Pre-generation safety evaluation
        safety_tier, safety_reason = SafetyService.classify_input(mm_context.combined_query)

        # 4. Crisis Intervention: HIGH_RISK interceptor
        if safety_tier == SafetyTier.HIGH_RISK:
            crisis_response = SafetyService.get_crisis_response()

            # Record user input in DB
            repo.add_message(
                conversation_id=conv.id,
                role="user",
                content=mm_context.text or mm_context.audio_transcript or "[High-risk input]",
                input_type=input_type_str,
                metadata={"safety_tier": safety_tier.value, "reason": safety_reason},
            )

            # Record crisis response in DB
            asst_msg = repo.add_message(
                conversation_id=conv.id,
                role="assistant",
                content=crisis_response,
                input_type="text",
                metadata={"safety_tier": safety_tier.value, "crisis_override": True},
            )

            return ChatResponse(
                conversation_id=conv.id,
                session_id=conv.session_id,
                role="assistant",
                content=crisis_response,
                input_type="text",
                safety_tier=SafetyTier.HIGH_RISK,
                sources=[],
                created_at=asst_msg.created_at,
            )

        # 5. RAG Retrieval (if enabled and query exists)
        retrieved_chunks = []
        source_citations: List[SourceCitation] = []

        if request.use_rag and mm_context.combined_query:
            retrieved_chunks = retrieve_relevant_chunks(
                query=mm_context.combined_query,
                top_k=4,
                min_score=0.35,
                filter_doc_ids=request.document_ids or None,
            )
            for chunk in retrieved_chunks:
                source_citations.append(
                    SourceCitation(
                        document_id=chunk["document_id"],
                        filename=chunk["filename"],
                        chunk_id=chunk["chunk_id"],
                        source=chunk.get("metadata", {}).get("source", chunk["filename"]),
                        similarity_score=chunk["similarity_score"],
                        content_snippet=chunk["text"][:160] + "...",
                    )
                )

        # 6. Build prompt with instruction boundary isolation
        isolated_rag = format_isolated_retrieved_context(retrieved_chunks)
        user_body_parts = []
        if mm_context.text:
            user_body_parts.append(f"Text Message: {mm_context.text}")
        if mm_context.audio_transcript:
            user_body_parts.append(f"Audio Transcript: {mm_context.audio_transcript}")
        if mm_context.image_context:
            user_body_parts.append(f"{mm_context.image_context}")

        raw_user_content = "\n".join(user_body_parts).strip() or "Hello"
        isolated_user = format_isolated_user_input(raw_user_content)

        # System instruction assembly
        composed_system_instruction = (
            f"<SYSTEM_INSTRUCTIONS>\n"
            f"{get_system_prompt()}\n\n"
            f"{get_rag_prompt()}\n"
            f"</SYSTEM_INSTRUCTIONS>\n\n"
            f"{isolated_rag}"
        )

        # 7. Retrieve short-term conversation context
        recent_history = repo.get_recent_messages(conv.id, limit=6)
        formatted_messages = []
        for h in recent_history:
            formatted_messages.append({"role": h.role, "content": h.content})

        # Append current user turn
        formatted_messages.append({"role": "user", "content": isolated_user})

        # 8. Generate response via LLMProvider
        llm = get_llm_provider()
        raw_response = llm.generate_chat(
            messages=formatted_messages,
            system_instruction=composed_system_instruction,
            temperature=0.7,
        )

        # 9. Post-generation safety validation
        final_response_text = SafetyService.validate_output(raw_response)

        # 10. Persist user and assistant messages
        repo.add_message(
            conversation_id=conv.id,
            role="user",
            content=raw_user_content,
            input_type=input_type_str,
            metadata={
                "safety_tier": safety_tier.value,
                "sources_used": len(source_citations),
            },
        )

        asst_msg = repo.add_message(
            conversation_id=conv.id,
            role="assistant",
            content=final_response_text,
            input_type="text",
            metadata={
                "safety_tier": safety_tier.value,
                "sources": [s.model_dump() for s in source_citations],
            },
        )

        return ChatResponse(
            conversation_id=conv.id,
            session_id=conv.session_id,
            role="assistant",
            content=final_response_text,
            input_type="text",
            safety_tier=safety_tier,
            sources=source_citations,
            created_at=asst_msg.created_at,
        )
