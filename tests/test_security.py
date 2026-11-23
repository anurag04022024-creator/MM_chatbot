"""Tests for Security Validation, File Verification, and Path Traversal Defense."""

import pytest
from fastapi import HTTPException
from backend.security.file_validator import validate_uploaded_file
from backend.security.sanitization import sanitize_filename, get_safe_storage_path


def test_sanitize_filename_removes_path_traversal():
    """Ensures directory traversal components and slashes are stripped."""
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\Windows\\System32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("safe_image.png") == "safe_image.png"


def test_sanitize_filename_removes_null_bytes():
    """Ensures null-byte poison sequences are removed."""
    sanitized = sanitize_filename("exploit.php\x00.png")
    assert "\x00" not in sanitized
    assert sanitized.endswith(".png") or sanitized == "exploit_php.png"


def test_safe_storage_path_enforces_directory_containment(tmp_path):
    """Verifies that generated storage path stays within target root."""
    file_id, safe_path = get_safe_storage_path("../../sensitive.txt", directory=tmp_path)
    assert safe_path.parent == tmp_path
    assert tmp_path in safe_path.parents


def test_validate_uploaded_file_valid_png(sample_valid_png_bytes):
    """Accepts authentic PNG image bytes."""
    ext, mime, size, cat = validate_uploaded_file("photo.png", sample_valid_png_bytes)
    assert ext == "png"
    assert mime == "image/png"
    assert size == len(sample_valid_png_bytes)
    assert cat == "image"


def test_validate_uploaded_file_rejects_disallowed_extension():
    """Rejects disallowed file extensions like .exe or .sh."""
    with pytest.raises(HTTPException) as exc:
        validate_uploaded_file("malicious.exe", b"MZ\x90\x00\x03...")
    assert exc.value.status_code == 400
    assert "not permitted" in exc.value.detail


def test_validate_uploaded_file_rejects_spoofed_signature():
    """Rejects spoofed file claiming to be PNG but containing bogus text bytes."""
    fake_png = b"This is plain text, not a PNG image."
    with pytest.raises(HTTPException) as exc:
        validate_uploaded_file("fake.png", fake_png)
    assert exc.value.status_code == 400
    assert "does not match" in exc.value.detail


def test_validate_uploaded_file_rejects_oversized_content():
    """Rejects payload exceeding maximum upload size."""
    # 11MB dummy payload
    oversized = b"A" * (11 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc:
        validate_uploaded_file("large.txt", oversized)
    assert exc.value.status_code == 413
    assert "exceeds maximum" in exc.value.detail
