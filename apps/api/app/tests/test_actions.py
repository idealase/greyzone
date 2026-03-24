"""Tests for action endpoints."""

import pytest
from httpx import AsyncClient


async def _setup_running_run(client: AsyncClient) -> tuple[str, str, str]:
    """Create a scenario, user, and running run. Returns (run_id, user_id, scenario_id)."""
    # Create scenario
    resp = await client.post(
        "/api/v1/scenarios",
        json={"name": "Action Scenario", "config": {"turns": 10}},
    )
    scenario_id = resp.json()["id"]

    # Create user
    resp = await client.post(
        "/api/v1/users",
        json={"username": "actionplayer", "display_name": "Action Player"},
    )
    user_id = resp.json()["id"]

    # Create and start run
    resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Action Run"},
    )
    run_id = resp.json()["id"]

    # Join run
    await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )

    # Start run
    await client.post(f"/api/v1/runs/{run_id}/start")

    return run_id, user_id, scenario_id


@pytest.mark.asyncio
async def test_get_legal_actions(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)
    resp = await client.get(
        f"/api/v1/runs/{run_id}/legal-actions",
        params={"role_id": "blue_commander"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "actions" in data
    assert len(data["actions"]) > 0


@pytest.mark.asyncio
async def test_submit_valid_action(client: AsyncClient):
    run_id, user_id, _ = await _setup_running_run(client)
    resp = await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": user_id,
            "role_id": "blue_commander",
            "action_type": "move",
            "action_payload": {"unit_id": "u1", "target": "zone_a"},
        },
    )
    assert resp.status_code == 201
    assert resp.json()["validation_result"] == "accepted"


@pytest.mark.asyncio
async def test_submit_action_wrong_role(client: AsyncClient):
    run_id, user_id, _ = await _setup_running_run(client)
    resp = await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": user_id,
            "role_id": "red_commander",  # user doesn't have this role
            "action_type": "move",
            "action_payload": {},
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_advance_turn(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)
    resp = await client.post(f"/api/v1/runs/{run_id}/advance-turn")
    assert resp.status_code == 200
    data = resp.json()
    assert data["turn"] == 1


@pytest.mark.asyncio
async def test_get_action_history(client: AsyncClient):
    run_id, user_id, _ = await _setup_running_run(client)

    # Submit an action first
    await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": user_id,
            "role_id": "blue_commander",
            "action_type": "move",
            "action_payload": {"unit_id": "u1"},
        },
    )

    resp = await client.get(f"/api/v1/runs/{run_id}/actions")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
