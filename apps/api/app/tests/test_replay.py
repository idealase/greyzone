"""Tests for replay and event endpoints."""

import pytest
from httpx import AsyncClient


async def _authenticate(client: AsyncClient, username: str) -> str:
    resp = await client.post(
        "/api/v1/users",
        json={"username": username, "display_name": username},
    )
    user_id = resp.json()["id"]
    client.headers["X-User-Id"] = user_id
    return user_id


async def _create_run_with_events(client: AsyncClient) -> str:
    """Create a scenario and run, advance a turn so events exist."""
    user_id = await _authenticate(client, "replay_owner")

    resp = await client.post(
        "/api/v1/scenarios",
        json={"name": "Replay Scenario", "config": {"turns": 10}},
    )
    scenario_id = resp.json()["id"]

    resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Replay Run"},
    )
    run_id = resp.json()["id"]

    await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )
    await client.post(f"/api/v1/runs/{run_id}/start")
    await client.post(f"/api/v1/runs/{run_id}/advance")

    return run_id


@pytest.mark.asyncio
async def test_get_events(client: AsyncClient):
    run_id = await _create_run_with_events(client)
    resp = await client.get(f"/api/v1/runs/{run_id}/events")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_replay(client: AsyncClient):
    run_id = await _create_run_with_events(client)
    resp = await client.get(f"/api/v1/runs/{run_id}/replay")
    assert resp.status_code == 200
    data = resp.json()
    assert "events" in data
    assert "snapshots" in data


@pytest.mark.asyncio
async def test_get_replay_at_turn(client: AsyncClient):
    run_id = await _create_run_with_events(client)
    resp = await client.get(f"/api/v1/runs/{run_id}/replay/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["turn"] == 1


@pytest.mark.asyncio
async def test_get_snapshots(client: AsyncClient):
    run_id = await _create_run_with_events(client)
    resp = await client.get(f"/api/v1/runs/{run_id}/snapshots")
    assert resp.status_code == 200
    assert "items" in resp.json()
