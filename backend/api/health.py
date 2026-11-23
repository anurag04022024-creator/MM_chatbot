"""Health Check API Router."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.models.schemas import HealthResponse
from backend.database import get_db, get_engine
from backend.config import get_settings

router = APIRouter(tags=["Health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Returns application health status, database connection, and active AI provider."""
    db_type = "unknown"
    status_str = "healthy"

    try:
        engine = get_engine()
        db_type = engine.name
        db.execute(text("SELECT 1"))
    except Exception:
        status_str = "degraded"

    return HealthResponse(
        status=status_str,
        environment=settings.ENVIRONMENT,
        database_type=db_type,
        llm_provider=settings.LLM_PROVIDER,
        timestamp=datetime.now(timezone.utc),
    )
