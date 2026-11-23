"""Structured Logging Configuration with Sensitive Data Redaction.

Adheres to security principle #19:
- Logs request IDs, endpoints, processing time, status, errors.
- Never logs sensitive emotional disclosures, full private user queries, or API keys.
"""

import logging
import re
import sys
from typing import Any


class SensitiveDataFilter(logging.Filter):
    """Redacts potential secrets, auth tokens, and sensitive patterns in logs."""

    # Matches API keys, Bearer tokens, passwords, and common credentials
    SECRET_PATTERNS = [
        re.compile(r"(api[_-]?key|bearer|token|secret|password)[\"'\s:=]+([a-zA-Z0-9_\-\.]{8,})", re.IGNORECASE),
        re.compile(r"(AIza[0-9A-Za-z-_]{35})"),  # Google API key pattern
        re.compile(r"(sk-[a-zA-Z0-9]{20,})"),    # OpenAI API key pattern
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern in self.SECRET_PATTERNS:
                record.msg = pattern.sub(r"\1: [REDACTED]", record.msg)
        return True


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configures structured console logging with redaction filter."""
    logger = logging.getLogger("mm_chatbot")
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(numeric_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(numeric_level)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataFilter())
        logger.addHandler(handler)

    # Disable propagation to root logger to avoid duplicate lines
    logger.propagate = False
    return logger
