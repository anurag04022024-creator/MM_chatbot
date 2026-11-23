"""Recursive Text Chunker with Overlap and Boundary Preservation.

Splits extracted document text into semantic chunks while respecting natural paragraph,
sentence, and word boundaries to maintain contextual coherence for embeddings.
"""

import re
from typing import List, Dict, Any


class TextChunker:
    """Configurable recursive text chunker."""

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 80):
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size.")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        """
        Splits raw text into a list of chunks respecting paragraph and sentence boundaries.
        """
        # Normalize whitespace and carriage returns
        cleaned_text = re.sub(r"\r\n|\r", "\n", text).strip()
        if not cleaned_text:
            return []

        if len(cleaned_text) <= self.chunk_size:
            return [cleaned_text]

        chunks: List[str] = []
        # Hierarchy of split separators
        separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

        def _recursive_split(subtext: str, sep_idx: int) -> List[str]:
            if len(subtext) <= self.chunk_size or sep_idx >= len(separators):
                return [subtext.strip()] if subtext.strip() else []

            sep = separators[sep_idx]
            if sep:
                parts = subtext.split(sep)
            else:
                # Character level split
                parts = list(subtext)

            result: List[str] = []
            current_chunk = ""

            for part in parts:
                candidate = f"{current_chunk}{sep}{part}" if current_chunk and sep else f"{current_chunk}{part}"
                if len(candidate) <= self.chunk_size:
                    current_chunk = candidate
                else:
                    if current_chunk:
                        result.append(current_chunk.strip())
                    if len(part) > self.chunk_size:
                        # Further split oversized sub-part using next separator
                        subparts = _recursive_split(part, sep_idx + 1)
                        result.extend(subparts)
                        current_chunk = ""
                    else:
                        current_chunk = part

            if current_chunk.strip():
                result.append(current_chunk.strip())

            return result

        raw_chunks = _recursive_split(cleaned_text, 0)

        # Apply overlap between consecutive chunks
        overlapping_chunks: List[str] = []
        for i, chunk in enumerate(raw_chunks):
            if i > 0 and self.chunk_overlap > 0:
                prev_tail = raw_chunks[i - 1][-self.chunk_overlap :]
                merged = f"...{prev_tail} {chunk}"
                overlapping_chunks.append(merged)
            else:
                overlapping_chunks.append(chunk)

        return overlapping_chunks

    def create_chunks(
        self,
        document_id: str,
        filename: str,
        text: str,
        extra_metadata: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Splits text and packages into structured chunk dictionaries.
        """
        raw_chunks = self.split_text(text)
        structured_chunks = []
        extra_meta = extra_metadata or {}

        for idx, chunk_str in enumerate(raw_chunks):
            chunk_id = f"{document_id}_chunk_{idx}"
            structured_chunks.append({
                "chunk_id": chunk_id,
                "document_id": document_id,
                "filename": filename,
                "chunk_index": idx,
                "text": chunk_str,
                "metadata": {
                    **extra_meta,
                    "filename": filename,
                    "chunk_index": idx,
                    "char_length": len(chunk_str),
                },
            })

        return structured_chunks
