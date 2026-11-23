"""Provider Factory.

Dynamically instantiates and returns the configured AI provider implementations.
Defaults to MockProvider when LLM_PROVIDER="mock" or when credentials are not supplied.
"""

from backend.config import get_settings
from backend.core.providers import (
    LLMProvider,
    VisionProvider,
    SpeechToTextProvider,
    EmbeddingProvider,
)
from backend.providers.mock_provider import (
    MockLLMProvider,
    MockVisionProvider,
    MockSpeechToTextProvider,
    MockEmbeddingProvider,
)
from backend.core.logging_config import setup_logging

logger = setup_logging()

_llm_instance = None
_vision_instance = None
_stt_instance = None
_embedding_instance = None


def _is_valid_gemini_key(key: str) -> bool:
    """Validates that the Gemini API key is present and not an unedited placeholder."""
    if not key or not key.strip():
        return False
    k = key.strip()
    if "PASTE_" in k or "YOUR_" in k or len(k) < 10:
        return False
    return True


def reset_providers() -> None:
    """Resets all cached provider singletons. Used in tests and after config changes."""
    global _llm_instance, _vision_instance, _stt_instance, _embedding_instance
    _llm_instance = None
    _vision_instance = None
    _stt_instance = None
    _embedding_instance = None


def get_llm_provider() -> LLMProvider:
    """Returns singleton LLMProvider instance."""
    global _llm_instance
    if _llm_instance is not None:
        return _llm_instance

    settings = get_settings()
    if settings.LLM_PROVIDER == "gemini" and _is_valid_gemini_key(settings.GEMINI_API_KEY or ""):
        from backend.providers.gemini_provider import GeminiProvider
        logger.info("Initializing Google Gemini LLM provider.")
        _llm_instance = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        if settings.LLM_PROVIDER == "gemini":
            logger.warning(
                "LLM_PROVIDER=gemini but GEMINI_API_KEY is missing or invalid. Falling back to Mock provider."
            )
        logger.info("Using Mock LLM provider (offline/development mode).")
        _llm_instance = MockLLMProvider()

    return _llm_instance


def get_vision_provider() -> VisionProvider:
    """Returns singleton VisionProvider instance."""
    global _vision_instance
    if _vision_instance is not None:
        return _vision_instance

    settings = get_settings()
    if settings.LLM_PROVIDER == "gemini" and _is_valid_gemini_key(settings.GEMINI_API_KEY or ""):
        from backend.providers.gemini_provider import GeminiProvider
        logger.info("Initializing Google Gemini Vision provider.")
        _vision_instance = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        logger.info("Using Mock Vision provider.")
        _vision_instance = MockVisionProvider()

    return _vision_instance


def get_stt_provider() -> SpeechToTextProvider:
    """Returns singleton SpeechToTextProvider instance."""
    global _stt_instance
    if _stt_instance is not None:
        return _stt_instance

    settings = get_settings()
    if settings.LLM_PROVIDER == "gemini" and _is_valid_gemini_key(settings.GEMINI_API_KEY or ""):
        from backend.providers.gemini_provider import GeminiProvider
        logger.info("Initializing Google Gemini Speech-to-Text provider.")
        _stt_instance = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        logger.info("Using Mock Speech-to-Text provider.")
        _stt_instance = MockSpeechToTextProvider()

    return _stt_instance


def get_embedding_provider() -> EmbeddingProvider:
    """Returns singleton EmbeddingProvider instance."""
    global _embedding_instance
    if _embedding_instance is not None:
        return _embedding_instance

    settings = get_settings()
    if settings.LLM_PROVIDER == "gemini" and _is_valid_gemini_key(settings.GEMINI_API_KEY or ""):
        from backend.providers.gemini_provider import GeminiProvider
        logger.info("Initializing Google Gemini Embedding provider.")
        _embedding_instance = GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        logger.info("Using Mock Embedding provider.")
        _embedding_instance = MockEmbeddingProvider()

    return _embedding_instance
