"""File Upload API Router.

Enforces size restrictions, whitelisted extensions, signature verification,
and path traversal prevention before storing user files.
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.schemas import FileUploadResponse
from backend.database import get_db
from backend.security.file_validator import validate_uploaded_file
from backend.security.sanitization import get_safe_storage_path
from backend.repositories.conversation_repository import ConversationRepository
from backend.core.logging_config import setup_logging

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = setup_logging()


@router.post("", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Validates, sanitizes, and securely persists uploaded user files
    (images, audio recordings, or documents).
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    # Read binary content
    content = await file.read()

    # Security validation: size, extension whitelist, and binary signature
    ext, mime_type, file_size, category = validate_uploaded_file(file.filename, content)

    # Path traversal prevention and safe filename generation
    file_id, safe_path = get_safe_storage_path(file.filename)

    # Write file securely to disk
    try:
        with open(safe_path, "wb") as f:
            f.write(content)
    except Exception as exc:
        logger.error(f"Failed to write file to disk: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving file to secure storage.",
        )

    # Record in database
    repo = ConversationRepository(db)
    repo.record_uploaded_file(
        original_filename=file.filename,
        storage_path=str(safe_path),
        file_type=mime_type,
        file_size=file_size,
        file_id=file_id,
        conversation_id=conversation_id,
    )

    logger.info(f"Successfully processed upload: {file.filename} as {category} (ID: {file_id})")

    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename,
        file_type=mime_type,
        file_size=file_size,
        category=category,
    )
