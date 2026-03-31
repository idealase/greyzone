"""Tests for action endpoints."""

import asyncio

import pytest
from httpx import AsyncClient

from app.services.engine_bridge import EngineError


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
        "/api/auth/register",
        json={
            "username": "actionplayer",
            "display_name": "Action Player",
            "email": "actionplayer@example.com",
            "password": "actionpass123",
        },
    )
    user_id = resp.json()["user"]["id"]

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
async def test_non_participant_cannot_submit_action(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)
    resp = await client.post(
        "/api/v1/users",
        json={"username": "intruder", "display_name": "Intruder"},
    )
    intruder_id = resp.json()["id"]
    client.headers["X-User-Id"] = intruder_id

    resp = await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": intruder_id,
            "role_id": "blue_commander",
            "action_type": "move",
            "action_payload": {"unit_id": "u1"},
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_advance_turn(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)
    resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert resp.status_code == 200
    data = resp.json()
    assert data["turn"] == 1


@pytest.mark.asyncio
async def test_advance_turn_legacy_route(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)
    resp = await client.post(f"/api/v1/runs/{run_id}/advance-turn")
    assert resp.status_code == 200
    data = resp.json()
    assert data["turn"] == 1


@pytest.mark.asyncio
async def test_advance_turn_pre_generates_narrative(client: AsyncClient):
    run_id, _, _ = await _setup_running_run(client)

    advance_resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert advance_resp.status_code == 200

    narrative_resp = await client.get(f"/api/v1/runs/{run_id}/turns/1/narrative")
    assert narrative_resp.status_code == 200
    narrative_data = narrative_resp.json()
    assert narrative_data["turn"] == 1
    assert narrative_data["cached"] is True


@pytest.mark.asyncio
async def test_advance_turn_rejects_concurrent_requests(
    client: AsyncClient, mock_engine_bridge
):
    run_id, _, _ = await _setup_running_run(client)

    release_event = asyncio.Event()

    async def slow_advance(*_args, **_kwargs):
        await release_event.wait()
        return {
            "turn": 1,
            "phase": "CompetitiveNormality",
            "events": [],
            "game_over": False,
        }

    mock_engine_bridge.advance_turn.side_effect = slow_advance

    first = asyncio.create_task(client.post(f"/api/v1/runs/{run_id}/advance"))
    # Give the first request a moment to acquire the lock
    await asyncio.sleep(0.05)
    second = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert second.status_code == 409

    release_event.set()
    first_response = await first
    assert first_response.status_code == 200


@pytest.mark.asyncio
async def test_advance_turn_state_failure_returns_error(
    client: AsyncClient, mock_engine_bridge
):
    run_id, _, _ = await _setup_running_run(client)
    mock_engine_bridge.get_state.side_effect = EngineError("engine state failed")

    resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert resp.status_code == 503


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
