"""File Validation and Content Verification Subsystem.

Enforces:
- File size limits (rejects oversized uploads before processing).
- Whitelisted file extensions.
- Binary magic-byte / file-signature verification to prevent extension spoofing.
"""

from typing import Literal, Tuple
from fastapi import HTTPException, status
from backend.config import get_settings

settings = get_settings()

# Magic bytes signatures for supported types
FILE_SIGNATURES = {
    "image": {
        "png": b"\x89PNG\r\n\x1a\n",
        "jpg": b"\xff\xd8\xff",
        "jpeg": b"\xff\xd8\xff",
        "webp": b"RIFF",  # Followed by WEBP at offset 8
    },
    "audio": {
        "mp3": (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"),
        "wav": b"RIFF",  # Followed by WAVE at offset 8
        "m4a": b"ftyp",  # Typically offset 4
    },
    "document": {
        "pdf": b"%PDF-",
        "docx": b"PK\x03\x04",  # Standard ZIP signature for DOCX
        "txt": None,  # Verified via UTF-8/ASCII decoding
    },
}

MIME_TYPE_MAP = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "m4a": "audio/m4a",
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


def get_file_category(extension: str) -> Literal["image", "audio", "document"]:
    """Determines high-level modality category from normalized extension."""
    ext = extension.lower().lstrip(".")
    if ext in ["png", "jpg", "jpeg", "webp"]:
        return "image"
    elif ext in ["mp3", "wav", "m4a"]:
        return "audio"
    elif ext in ["pdf", "docx", "txt"]:
        return "document"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported file extension: .{ext}",
    )


def validate_file_signature(content: bytes, extension: str) -> bool:
    """Verifies that the initial bytes match the expected file signature."""
    ext = extension.lower().lstrip(".")
    category = get_file_category(ext)

    if category == "document" and ext == "txt":
        try:
            content[:4096].decode("utf-8")
            return True
        except UnicodeDecodeError:
            return False

    signatures = FILE_SIGNATURES.get(category, {}).get(ext)
    if not signatures:
        return True  # Fallback if no specific binary header required

    if isinstance(signatures, tuple):
        return any(content.startswith(sig) for sig in signatures)
    elif ext == "webp":
        return content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WEBP"
    elif ext == "wav":
        return content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WAVE"
    elif ext == "m4a":
        return len(content) > 8 and (b"ftyp" in content[:12])
    else:
        return content.startswith(signatures)


def validate_uploaded_file(filename: str, content: bytes) -> Tuple[str, str, int, Literal["image", "audio", "document"]]:
    """
    Validates uploaded file against size, extension, and content signatures.

    Returns:
        (sanitized_ext, mime_type, file_size_bytes, category)
    Raises:
        HTTPException on validation error with a safe, clear message.
    """
    if not filename or "." not in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or lacks a valid extension.",
        )

    file_size = len(content)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file upload is not permitted.",
        )

    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    raw_ext = filename.rsplit(".", 1)[-1].lower()
    if raw_ext not in settings.allowed_extensions_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{raw_ext}' is not permitted. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )

    category = get_file_category(raw_ext)

    # Content signature check
    if not validate_file_signature(content, raw_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content header does not match its claimed file extension.",
        )

    mime_type = MIME_TYPE_MAP.get(raw_ext, "application/octet-stream")
    return raw_ext, mime_type, file_size, category
