"""Path Traversal Defense and Filename Sanitization.

Prevents directory traversal, null-byte injection, and arbitrary file overwrite attacks.
"""

import os
import re
import uuid
from pathlib import Path
from fastapi import HTTPException, status
from backend.config import get_settings

settings = get_settings()


def sanitize_filename(original_filename: str) -> str:
    """
    Sanitizes raw user filename:
    - Strips directory path separators (/ and \\).
    - Removes null bytes and control characters.
    - Limits alphanumeric slug characters.
    """
    # Remove directory paths if provided
    base_name = os.path.basename(original_filename)

    # Strip null bytes
    base_name = base_name.replace("\x00", "")

    # Split name and extension
    if "." in base_name:
        name_part, ext_part = base_name.rsplit(".", 1)
    else:
        name_part, ext_part = base_name, ""

    # Sanitize name part to alphanumeric, underscores, hyphens
    sanitized_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name_part).strip("_")
    if not sanitized_name:
        sanitized_name = "upload"

    sanitized_ext = re.sub(r"[^a-zA-Z0-9]", "", ext_part).lower()

    if sanitized_ext:
        return f"{sanitized_name[:50]}.{sanitized_ext[:10]}"
    return sanitized_name[:50]


def get_safe_storage_path(original_filename: str, directory: str | Path | None = None) -> tuple[str, Path]:
    """
    Generates a collision-resistant unique storage path within the designated directory.
    Verifies that the resolved path does not traverse outside the target directory.

    Returns:
        (unique_file_id, resolved_path)
    """
    target_dir = Path(directory or settings.UPLOAD_DIR).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)

    sanitized = sanitize_filename(original_filename)
    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}_{sanitized}"

    candidate_path = (target_dir / unique_filename).resolve()

    # Enforce path containment within target directory
    try:
        common = os.path.commonpath([str(target_dir), str(candidate_path)])
        if Path(common).resolve() != target_dir:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Path traversal detected in file operation.",
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid destination path for file storage.",
        )

    return file_id, candidate_path
