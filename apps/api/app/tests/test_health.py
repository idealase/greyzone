"""Tests for health, metrics, and error response observability."""

from __future__ import annotations

import uuid

import pytest

from app.observability import metrics


@pytest.mark.asyncio
async def test_health_includes_database_and_engine(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "greyzone-api"
    assert data["database"]["status"] in {"ok", "error"}
    assert "status" in data["engine"]
    assert "request_id" in data


@pytest.mark.asyncio
async def test_error_responses_include_request_id(client):
    missing_run_id = uuid.uuid4()
    resp = await client.get(f"/api/v1/runs/{missing_run_id}")
    assert resp.status_code == 404
    data = resp.json()
    assert "request_id" in data


@pytest.mark.asyncio
async def test_metrics_endpoint_reports_counters(client):
    metrics.reset_metrics_registry()
    metrics.actions_submitted_total.inc()
    resp = await client.get("/metrics")
    assert resp.status_code == 200
    body = resp.text
    assert "greyzone_actions_submitted_total" in body
    assert "1.0" in body or "1" in body
