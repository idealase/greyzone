"""Tests for run lifecycle endpoints."""

import pytest
from httpx import AsyncClient


async def _create_scenario(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/scenarios",
        json={
            "name": "Test Scenario",
            "description": "For run tests",
            "config": {"map": "test", "turns": 10},
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_user(client: AsyncClient, username: str = "testplayer") -> str:
    resp = await client.post(
        "/api/auth/register",
        json={
            "username": username,
            "display_name": "Test",
            "email": f"{username}@example.com",
            "password": "testpassword123",
        },
    )
    assert resp.status_code in [200, 201]
    return resp.json()["user"]["id"]


@pytest.mark.asyncio
async def test_create_run(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Test Run"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Run"
    assert data["status"] == "lobby"


@pytest.mark.asyncio
async def test_list_runs(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Run 1"},
    )
    resp = await client.get("/api/v1/runs")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_join_run(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Join Test"},
    )
    run_id = run_resp.json()["id"]
    user_id = await _create_user(client)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )
    assert resp.status_code == 201
    assert resp.json()["role_id"] == "blue_commander"


@pytest.mark.asyncio
async def test_start_run(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Start Test"},
    )
    run_id = run_resp.json()["id"]

    resp = await client.post(f"/api/v1/runs/{run_id}/start")
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_get_run_state(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "State Test"},
    )
    run_id = run_resp.json()["id"]

    # State of a non-running run should return empty state
    resp = await client.get(f"/api/v1/runs/{run_id}/state")
    assert resp.status_code == 200
    assert resp.json()["state"] == {}


@pytest.mark.asyncio
async def test_pause_resume(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Pause Test"},
    )
    run_id = run_resp.json()["id"]

    # Start run
    await client.post(f"/api/v1/runs/{run_id}/start")

    # Pause
    resp = await client.post(f"/api/v1/runs/{run_id}/pause")
    assert resp.status_code == 200
    assert resp.json()["status"] == "paused"

    # Resume
    resp = await client.post(f"/api/v1/runs/{run_id}/resume")
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_stop_run(client: AsyncClient):
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Stop Test"},
    )
    run_id = run_resp.json()["id"]

    await client.post(f"/api/v1/runs/{run_id}/start")
    resp = await client.post(f"/api/v1/runs/{run_id}/stop")
    assert resp.status_code == 200
    assert resp.json()["status"] == "aborted"
