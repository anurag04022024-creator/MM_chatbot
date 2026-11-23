"""Audio Transcription API Router."""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from backend.models.schemas import AudioTranscribeResponse
from backend.security.file_validator import validate_uploaded_file, get_file_category
from backend.services.transcription_service import TranscriptionService

router = APIRouter(prefix="/audio", tags=["Audio"])


@router.post("/transcribe", response_model=AudioTranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Validates audio file and returns text transcription.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required for audio transcription.",
        )

    content = await file.read()
    ext, mime_type, file_size, category = validate_uploaded_file(file.filename, content)

    if category != "audio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected an audio file, but received {category} (.{ext}).",
        )

    return TranscriptionService.transcribe(content, file.filename)
