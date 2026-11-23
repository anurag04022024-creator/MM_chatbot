"""Application Configuration Module.

Loads and validates environment variables using Pydantic Settings.
Ensures security, path resolution, and provider configuration.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App environment
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    LOG_LEVEL: str = "INFO"

    # AI Provider configuration
    LLM_PROVIDER: Literal["gemini", "openai", "mock"] = "mock"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # MySQL Database configuration
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "mm_chatbot"
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"

    # Resilience: SQLite fallback if MySQL is unreachable during local testing
    DB_USE_SQLITE_FALLBACK: bool = True
    SQLITE_DB_PATH: str = "data/chatbot.db"

    # Directory Paths
    UPLOAD_DIR: str = "data/uploads"
    VECTOR_DB_DIR: str = "data/vector_db"
    KNOWLEDGE_BASE_DIR: str = "data/knowledge_base"

    # Security & Upload Validation
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "png,jpg,jpeg,webp,mp3,wav,m4a,pdf,txt,docx"

    # Backend / Gateway network configuration
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_API_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def mysql_url(self) -> str:
        """Constructs MySQL SQLAlchemy connection string."""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def sqlite_url(self) -> str:
        """Constructs SQLite fallback connection string."""
        resolved = Path(self.SQLITE_DB_PATH).resolve()
        resolved.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{resolved.as_posix()}"

    @property
    def allowed_extensions_set(self) -> set[str]:
        """Returns normalized set of allowed extensions (lowercase, without dot)."""
        return {ext.strip().lower().lstrip(".") for ext in self.ALLOWED_EXTENSIONS.split(",")}

    @property
    def max_upload_size_bytes(self) -> int:
        """Max upload size converted to bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    def ensure_directories(self) -> None:
        """Ensures all runtime storage directories exist."""
        for dir_path in [self.UPLOAD_DIR, self.VECTOR_DB_DIR, self.KNOWLEDGE_BASE_DIR]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """Returns cached singleton application settings."""
    settings = Settings()
    settings.ensure_directories()
    return settings
