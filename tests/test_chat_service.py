"""End-to-End Multimodal Chat and API Integration Tests."""

import io
from backend.models.schemas import SafetyTier


def test_chat_endpoint_text_flow(client):
    """Executes single-turn text conversation."""
    payload = {
        "session_id": "test_session_1",
        "message": "I am feeling a little stressed with my studies today.",
        "use_rag": True,
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["role"] == "assistant"
    assert data["session_id"] == "test_session_1"
    assert len(data["content"]) > 10
    assert data["safety_tier"] in [SafetyTier.SAFE.value, SafetyTier.SENSITIVE.value]


def test_chat_endpoint_high_risk_triggers_crisis(client):
    """Executes chat request with high-risk crisis input."""
    payload = {
        "session_id": "test_crisis_session",
        "message": "I feel hopeless and I want to kill myself.",
        "use_rag": True,
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["safety_tier"] == SafetyTier.HIGH_RISK.value
    # Assert crisis response content is returned
    assert "988" in data["content"]
    assert "findahelpline.com" in data["content"]
    assert len(data["sources"]) == 0  # No RAG sources for crisis intervention


def test_chat_endpoint_rejects_empty_payload(client):
    """Rejects request with no text, image, or audio."""
    payload = {
        "session_id": "test_empty",
        "message": "",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 400
    assert "At least one modality" in response.json()["detail"]


def test_multimodal_image_upload_and_chat(client, sample_valid_png_bytes):
    """Uploads an image then submits chat referencing the uploaded image ID."""
    # 1. Upload image
    files = {"file": ("peaceful_scenery.png", sample_valid_png_bytes, "image/png")}
    upload_res = client.post("/upload", files=files)
    assert upload_res.status_code == 200
    img_data = upload_res.json()
    assert img_data["category"] == "image"
    file_id = img_data["file_id"]

    # 2. Chat with image attached
    chat_payload = {
        "session_id": "test_image_session",
        "message": "Does this scene look calming?",
        "image_file_id": file_id,
        "use_rag": False,
    }
    chat_res = client.post("/chat", json=chat_payload)
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert len(data["content"]) > 0


def test_conversation_history_persistence(client):
    """Verifies conversation history is stored and retrievable."""
    session_id = "test_persistence_session"

    # Send message 1
    client.post("/chat", json={"session_id": session_id, "message": "First message."})
    # Send message 2
    chat_res = client.post("/chat", json={"session_id": session_id, "message": "Second message."})
    conv_id = chat_res.json()["conversation_id"]

    # Retrieve conversation by ID
    history_res = client.get(f"/conversations/{conv_id}")
    assert history_res.status_code == 200
    conv_data = history_res.json()
    assert len(conv_data["messages"]) >= 4  # 2 user turns + 2 assistant turns
