"""
End-to-End FastAPI Endpoint Integration Tests
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"


def test_tasks_list():
    resp = client.get("/api/v1/tasks")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_network_stations():
    resp = client.get("/api/v1/network/stations")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 8


def test_metrics_dashboard():
    resp = client.get("/api/v1/metrics/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "asset_availability_percentage" in data
    assert "total_maintenance_requests" in data
