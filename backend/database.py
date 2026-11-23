"""Database Connection and Session Management.

Supports MySQL as primary relational store with graceful fallback
to SQLite for zero-dependency local testing and development.
"""

import socket
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config import get_settings
from backend.core.logging_config import setup_logging

logger = setup_logging()
settings = get_settings()

Base = declarative_base()

_engine = None
_SessionLocal = None


def is_mysql_reachable(host: str, port: int, timeout: float = 0.5) -> bool:
    """Fast non-blocking socket check before attempting SQLAlchemy MySQL connection."""
    try:
        target_host = "127.0.0.1" if host.lower() == "localhost" else host
        with socket.create_connection((target_host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


def get_engine():
    """Initializes or returns cached database engine with MySQL -> SQLite fallback."""
    global _engine, _SessionLocal
    if _engine is not None:
        return _engine

    # If running in testing environment or SQLite fallback is requested when MySQL is down
    mysql_online = False
    if settings.ENVIRONMENT != "testing":
        mysql_online = is_mysql_reachable(settings.DB_HOST, settings.DB_PORT, timeout=0.5)

    if mysql_online:
        try:
            candidate_engine = create_engine(
                settings.mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3},
            )
            with candidate_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Connected successfully to MySQL at {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
            _engine = candidate_engine
        except Exception as exc:
            logger.warning(f"MySQL handshake failed ({exc.__class__.__name__}). Falling back to SQLite.")
            mysql_online = False

    if not mysql_online:
        if settings.DB_USE_SQLITE_FALLBACK or settings.ENVIRONMENT == "testing":
            logger.info(f"Using local SQLite storage at {settings.SQLITE_DB_PATH}")
            _engine = create_engine(
                settings.sqlite_url,
                connect_args={"check_same_thread": False},
            )
        else:
            raise RuntimeError(f"Cannot connect to MySQL at {settings.DB_HOST}:{settings.DB_PORT} and SQLite fallback is disabled.")

    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


def get_session_factory():
    """Returns initialized session factory."""
    if _SessionLocal is None:
        get_engine()
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding transactional database sessions."""
    session_factory = get_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager for standalone database operations."""
    session_factory = get_session_factory()
    db = session_factory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """Creates database tables defined in database_models."""
    engine = get_engine()
    # Import models so Base metadata is populated
    import backend.models.database_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas verified and initialized.")
