"""FastAPI Application Gateway.

Configures:
- Lifespan startup (database initialization, automatic knowledge base seeding)
- CORS middleware
- Secure error handling (no stack trace or internal database leakage)
- Structured request logging
- Route controllers
"""

import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.config import get_settings
from backend.core.logging_config import setup_logging
from backend.database import init_db, db_session
from backend.services.document_service import DocumentService
from backend.models.database_models import RAGDocument

from backend.api import health, chat, upload, audio, documents, rag

settings = get_settings()
logger = setup_logging(settings.LOG_LEVEL)


def seed_knowledge_base_if_empty() -> None:
    """Auto-indexes default seed files in data/knowledge_base/ if database is fresh."""
    kb_dir = Path(settings.KNOWLEDGE_BASE_DIR)
    if not kb_dir.exists():
        return

    with db_session() as db:
        existing_count = db.query(RAGDocument).count()
        if existing_count > 0:
            logger.info(f"Knowledge base already contains {existing_count} documents. Skipping auto-seed.")
            return

        logger.info("Initializing knowledge base with seed educational materials...")
        for file_path in kb_dir.glob("*.txt"):
            try:
                content = file_path.read_bytes()
                DocumentService.ingest_document(
                    db=db,
                    filename=file_path.name,
                    content=content,
                    extra_metadata={"source": "seed_knowledge_base"},
                )
                logger.info(f"Auto-seeded: {file_path.name}")
            except Exception as exc:
                logger.warning(f"Could not auto-seed {file_path.name}: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events: startup and teardown."""
    logger.info("Starting up Multimodal Chatbot Backend...")
    # Initialize relational database schemas
    init_db()
    # Seed knowledge base with default wellness resources
    seed_knowledge_base_if_empty()
    yield
    logger.info("Shutting down Multimodal Chatbot Backend.")


app = FastAPI(
    title="Multimodal Emotional-Support Chatbot API",
    description="Secure, RAG-grounded, multimodal conversational AI platform with safety guardrails.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing and audit logging middleware
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = None
    try:
        response = await call_next(request)
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"{request.method} {request.url.path} | Status: {response.status_code} | Duration: {process_time_ms}ms"
        )
        return response
    except Exception as exc:
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(
            f"{request.method} {request.url.path} | Error: {exc.__class__.__name__} | Duration: {process_time_ms}ms"
        )
        raise


# --- Secure Error Handlers (No Stack Trace or Path Leakage) ---

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Sanitize validation errors to avoid leaking internal Pydantic internals
    clean_errors = []
    for err in exc.errors():
        clean_errors.append({
            "field": ".".join(str(loc) for loc in err.get("loc", [])),
            "message": err.get("msg", "Invalid input value"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Input validation error", "errors": clean_errors},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unexpected internal errors.
    Logs full diagnostic internally while returning a safe, generic message to client.
    """
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Register API Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(audio.router)
app.include_router(documents.router)
app.include_router(rag.router)
