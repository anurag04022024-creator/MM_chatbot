"""Shared Pytest Fixtures and Test Harness."""

import io
import os
import pytest
from contextlib import asynccontextmanager
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from PIL import Image
from reportlab.pdfgen import canvas

# Set testing environment BEFORE importing app modules
os.environ["ENVIRONMENT"] = "testing"
os.environ["DB_USE_SQLITE_FALLBACK"] = "True"
os.environ["LLM_PROVIDER"] = "mock"

from backend.config import get_settings  # noqa: E402
# Clear lru_cache so env overrides above take effect
get_settings.cache_clear()
settings = get_settings()

from backend.database import Base, get_db  # noqa: E402
from backend.main import app  # noqa: E402
# Reset provider singletons so mock env var is respected
from backend.providers.factory import reset_providers  # noqa: E402
reset_providers()

# In-memory SQLite engine for fast, isolated test execution
TEST_SQLITE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# ---------------------------------------------------------------------------
# Suppress FastAPI lifespan for tests so seed/DB side-effects don't interfere
# ---------------------------------------------------------------------------
@asynccontextmanager
async def _test_lifespan(app):
    """No-op lifespan: skip knowledge-base seeding and other startup I/O."""
    yield


# Patch lifespan on the router before any test runs
app.router.lifespan_context = _test_lifespan


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Creates database schema before test run, tears down after."""
    import backend.models.database_models  # noqa: F401
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Yields a transactional database session rolled back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Provides TestClient with test database session dependency override."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_valid_png_bytes() -> bytes:
    """Generates valid 10x10 PNG image in memory."""
    img = Image.new("RGB", (10, 10), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def sample_valid_pdf_bytes() -> bytes:
    """Generates authentic valid PDF bytes with text using ReportLab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Mental wellness and mindfulness techniques for stress reduction.")
    c.save()
    return buf.getvalue()
