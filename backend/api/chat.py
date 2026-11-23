"""Chat API Router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.schemas import ChatRequest, ChatResponse, ConversationResponse
from backend.database import get_db
from backend.services.chat_service import ChatService
from backend.repositories.conversation_repository import ConversationRepository

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
def handle_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Main multimodal conversational endpoint.
    Orchestrates safety checks, multimodal inputs, RAG retrieval, and AI generation.
    """
    if not request.message and not request.image_file_id and not request.audio_file_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one modality (text message, image, or audio) must be provided.",
        )

    return ChatService.process_chat(db=db, request=request)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """Retrieves full conversation transcript and message metadata by ID."""
    repo = ConversationRepository(db)
    conv = repo.get_conversation_by_id(conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found.",
        )
    return conv


@router.get("/conversations/session/{session_id}", response_model=ConversationResponse)
def get_conversation_by_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Retrieves current conversation transcript for a given session ID."""
    repo = ConversationRepository(db)
    conv = repo.get_or_create_conversation(session_id)
    return conv
