"""Safety Guardrails, Crisis Triage, and Post-Generation Verification Service.

Enforces:
- Tri-state classification: SAFE, SENSITIVE, HIGH_RISK.
- Deterministic crisis intervention interceptor for self-harm, suicide, or violence.
- Post-generation output validation preventing medical diagnosis or drug prescriptions.
"""

import re
from typing import Tuple, Optional
from backend.models.schemas import SafetyTier
from backend.core.logging_config import setup_logging

logger = setup_logging()

# High-Risk Signatures (Immediate crisis intervention required)
HIGH_RISK_PATTERNS = [
    re.compile(r"\b(suicid(e|al)|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hang\s+myself)\b", re.IGNORECASE),
    re.compile(r"\b(self[- ]?harm|cut(ting)?\s+myself|bleed\s+out|overdose)\b", re.IGNORECASE),
    re.compile(r"\b(kill\s+(someone|them|others|people)|mass\s+shooting|bomb|murder)\b", re.IGNORECASE),
    re.compile(r"\b(better\s+off\s+dead|no\s+reason\s+to\s+live|ready\s+to\s+end\s+it)\b", re.IGNORECASE),
]

# Sensitive Signatures (Emotional distress, needs extra empathy & grounding)
SENSITIVE_PATTERNS = [
    re.compile(r"\b(depress(ed|ion)|anxious|anxiety|panic(\s+attack)?|overwhelm(ed)?)\b", re.IGNORECASE),
    re.compile(r"\b(hopeless|worthless|crying|lonely|alone|grief|heartbroken|exhausted)\b", re.IGNORECASE),
    re.compile(r"\b(stress(ed)?|burnout|can'?t\s+take\s+it|falling\s+apart)\b", re.IGNORECASE),
]

# Medical Prescribing / Diagnosis Red Lines (For post-generation checks)
UNSAFE_OUTPUT_PATTERNS = [
    re.compile(r"\b(i\s+diagnose\s+you\s+with|you\s+definitely\s+have\s+(clinical\s+depression|bipolar|schizophrenia))\b", re.IGNORECASE),
    re.compile(r"\b(take\s+\d+\s*mg\s+of|i\s+prescribe|you\s+should\s+take\s+(prozac|zoloft|xanax|lexapro|adderall))\b", re.IGNORECASE),
]

# Deterministic Crisis Response (Neutral, compassionate, location-agnostic helplines)
CRISIS_INTERVENTION_RESPONSE = (
    "It sounds like you are going through an extraordinarily difficult and painful time right now, "
    "and I want to make sure you are safe. As an AI assistant, I cannot provide emergency support, "
    "but please know that you do not have to carry this alone. Compassionate, trained people are available "
    "to support you right now, completely free and confidentially:\n\n"
    "• **If you are in the United States or Canada**: Call or text **988** to reach the Suicide & Crisis Lifeline (24/7), "
    "or text **HOME** to **741741** for the Crisis Text Line.\n"
    "• **If you are in the United Kingdom**: Call **111** for NHS mental health services, or call **116 123** for the Samaritans.\n"
    "• **Worldwide / Any other location**: Visit **https://findahelpline.com** or **https://www.befrienders.org** "
    "to instantly connect with free, local, confidential crisis support in your country.\n"
    "• **Emergency**: If you or someone else is in immediate physical danger, please contact your local emergency services (such as 911, 999, or 112) or go to the nearest emergency room.\n\n"
    "Please consider reaching out to one of these resources or a trusted person in your life today."
)


class SafetyService:
    """Evaluates safety boundaries before and after model generation."""

    @staticmethod
    def classify_input(text: str) -> Tuple[SafetyTier, str]:
        """
        Classifies incoming user text into SAFE, SENSITIVE, or HIGH_RISK.

        Returns:
            (tier, reason)
        """
        if not text:
            return SafetyTier.SAFE, "Empty text"

        # Check High-Risk first
        for pattern in HIGH_RISK_PATTERNS:
            match = pattern.search(text)
            if match:
                logger.warning("High-risk safety trigger activated.")
                return SafetyTier.HIGH_RISK, f"High-risk distress or self-harm marker detected: '{match.group(0)}'"

        # Check Sensitive distress markers
        for pattern in SENSITIVE_PATTERNS:
            match = pattern.search(text)
            if match:
                return SafetyTier.SENSITIVE, f"Emotional distress marker detected: '{match.group(0)}'"

        return SafetyTier.SAFE, "Standard conversational text"

    @staticmethod
    def get_crisis_response() -> str:
        """Returns pre-validated, deterministic crisis guidance."""
        return CRISIS_INTERVENTION_RESPONSE

    @staticmethod
    def validate_output(output_text: str) -> str:
        """
        Post-generation check. If the model accidentally attempts to prescribe
        medication or declare medical diagnoses, sanitizes the response.
        """
        for pattern in UNSAFE_OUTPUT_PATTERNS:
            if pattern.search(output_text):
                logger.warning("Post-generation safety filter triggered: removing unsafe diagnostic/prescriptive claim.")
                return (
                    "I want to support you, but as an AI assistant, I am unable to make clinical diagnoses "
                    "or recommend specific medical prescriptions. I encourage speaking with a licensed physician "
                    "or mental healthcare provider who can evaluate your needs safely."
                )

        return output_text
