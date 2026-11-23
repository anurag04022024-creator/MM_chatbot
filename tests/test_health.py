"""Tests for System Health Endpoint."""

def test_health_check_returns_healthy(client):
    """Verifies /health endpoint returns 200 with system metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "environment" in data
    assert "database_type" in data
    assert "llm_provider" in data
    assert "timestamp" in data
