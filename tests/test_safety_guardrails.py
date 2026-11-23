"""Tests for Safety Guardrails, Crisis Triage, and Post-Generation Checks."""

from backend.models.schemas import SafetyTier
from backend.services.safety_service import SafetyService


def test_classify_input_safe_query():
    """Identifies normal conversational query as SAFE."""
    tier, reason = SafetyService.classify_input("I had a nice conversation with a friend today.")
    assert tier == SafetyTier.SAFE


def test_classify_input_sensitive_distress():
    """Identifies emotional distress query as SENSITIVE."""
    tier, reason = SafetyService.classify_input("I am feeling overwhelmed with anxiety and stress.")
    assert tier == SafetyTier.SENSITIVE
    assert "distress" in reason.lower()


def test_classify_input_high_risk_suicide():
    """Identifies self-harm or suicide indicators as HIGH_RISK."""
    tier, reason = SafetyService.classify_input("I feel hopeless and want to end my life.")
    assert tier == SafetyTier.HIGH_RISK

    tier2, _ = SafetyService.classify_input("I want to kill myself.")
    assert tier2 == SafetyTier.HIGH_RISK


def test_crisis_intervention_response_contains_helplines():
    """Ensures deterministic crisis response includes verified global crisis contacts."""
    crisis_text = SafetyService.get_crisis_response()
    assert "988" in crisis_text
    assert "741741" in crisis_text
    assert "findahelpline.com" in crisis_text
    assert "befrienders.org" in crisis_text
    assert "emergency" in crisis_text.lower()


def test_post_generation_filter_blocks_prescription():
    """Ensures model outputs attempting to prescribe pharmaceutical drugs are neutralized."""
    unsafe_output = "You should definitely take 20mg of Prozac every morning to treat your depression."
    cleaned = SafetyService.validate_output(unsafe_output)
    assert "20mg of Prozac" not in cleaned
    assert "unable to make clinical diagnoses or recommend specific medical prescriptions" in cleaned
