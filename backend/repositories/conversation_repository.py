"""Conversation and Message Data Access Repository.

Encapsulates SQL operations for conversation sessions, message history, and uploaded file linkages.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.database_models import Conversation, Message, UploadedFile
from backend.core.logging_config import setup_logging

logger = setup_logging()


class ConversationRepository:
    """Data access repository for conversation and message entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_conversation(self, session_id: str) -> Conversation:
        """Finds active conversation by session_id or creates a new one."""
        conv = (
            self.db.query(Conversation)
            .filter(Conversation.session_id == session_id)
            .order_by(Conversation.created_at.desc())
            .first()
        )
        if not conv:
            conv = Conversation(session_id=session_id)
            self.db.add(conv)
            self.db.commit()
            self.db.refresh(conv)
            logger.info(f"Created new conversation {conv.id} for session {session_id}")
        return conv

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        input_type: str = "text",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        """Appends a new message to the conversation."""
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            input_type=input_type,
            metadata_=metadata or {},
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_recent_messages(self, conversation_id: str, limit: int = 10) -> List[Message]:
        """Fetches recent conversation messages in chronological order."""
        messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(messages))

    def get_conversation_by_id(self, conversation_id: str) -> Optional[Conversation]:
        """Retrieves conversation by UUID."""
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def record_uploaded_file(
        self,
        original_filename: str,
        storage_path: str,
        file_type: str,
        file_size: int,
        file_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> UploadedFile:
        """Records metadata for an uploaded user file."""
        record = UploadedFile(
            id=file_id or None,
            conversation_id=conversation_id,
            original_filename=original_filename,
            storage_path=storage_path,
            file_type=file_type,
            file_size=file_size,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
