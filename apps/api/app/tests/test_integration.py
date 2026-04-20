"""Integration tests covering critical game flows end-to-end.

Tests: quick-start (AI opponent init), multi-player join,
turn submission flow, state retrieval, and game metrics.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_scenario(client: AsyncClient, name: str = "Integration Scenario") -> str:
    resp = await client.post(
        "/api/v1/scenarios",
        json={
            "name": name,
            "description": "Scenario for integration tests",
            "config": {"map": "test", "turns": 20, "players": 2},
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _register_user(client: AsyncClient, username: str) -> dict:
    """Register a user and return {id, access_token}."""
    resp = await client.post(
        "/api/auth/register",
        json={
            "username": username,
            "display_name": username.title(),
            "email": f"{username}@test.com",
            "password": "testpassword123",
        },
    )
    assert resp.status_code in (200, 201), resp.text
    data = resp.json()
    return {"id": data["user"]["id"], "access_token": data["access_token"]}


async def _auth_as(client: AsyncClient, username: str) -> str:
    """Register user and set both Bearer token and X-User-Id header."""
    user = await _register_user(client, username)
    client.headers["Authorization"] = f"Bearer {user['access_token']}"
    client.headers["X-User-Id"] = user["id"]
    return user["id"]


async def _setup_running_game(client: AsyncClient, owner: str = "int_owner") -> tuple[str, str, str]:
    """Create scenario, create run, start it. Returns (run_id, user_id, scenario_id)."""
    user_id = await _auth_as(client, owner)
    scenario_id = await _create_scenario(client)
    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Integration Game"},
    )
    assert run_resp.status_code == 201
    run_id = run_resp.json()["id"]

    # Join as blue_commander so we can start
    join_resp = await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )
    assert join_resp.status_code == 201

    # Start the run
    start_resp = await client.post(f"/api/v1/runs/{run_id}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "in_progress"

    return run_id, user_id, scenario_id


# ---------------------------------------------------------------------------
# 1. Quick-start / AI opponent initialization
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_quick_start_creates_ai_game(client: AsyncClient):
    """POST /quick-start creates run with human + AI participants and starts it."""
    user_id = await _auth_as(client, "qs_player")
    scenario_id = await _create_scenario(client, "Quick Start Scenario")

    resp = await client.post(
        "/api/v1/runs/quick-start",
        json={
            "user_id": user_id,
            "scenario_id": scenario_id,
            "name": "AI Battle",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "AI Battle"
    assert data["status"] == "in_progress"

    # Fetch run details to verify participant roles (quick-start response
    # may not include eager-loaded participants)
    run_resp = await client.get(f"/api/v1/runs/{data['id']}")
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    participants = run_data.get("participants", [])
    assert len(participants) == 2
    roles = {p["role_id"] for p in participants}
    assert "blue_commander" in roles
    assert "red_commander" in roles

    for p in participants:
        if p["role_id"] == "blue_commander":
            assert p["is_ai"] is False
        elif p["role_id"] == "red_commander":
            assert p["is_ai"] is True


@pytest.mark.asyncio
async def test_quick_start_user_mismatch_rejected(client: AsyncClient):
    """Quick-start rejects request when user_id doesn't match authenticated user."""
    await _auth_as(client, "qs_mismatch")
    scenario_id = await _create_scenario(client, "Mismatch Scenario")

    fake_user_id = str(uuid.uuid4())
    resp = await client.post(
        "/api/v1/runs/quick-start",
        json={
            "user_id": fake_user_id,
            "scenario_id": scenario_id,
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_quick_start_invalid_scenario_rejected(client: AsyncClient):
    """Quick-start with non-existent scenario returns 404."""
    user_id = await _auth_as(client, "qs_bad_scen")

    resp = await client.post(
        "/api/v1/runs/quick-start",
        json={
            "user_id": user_id,
            "scenario_id": str(uuid.uuid4()),
        },
    )
    assert resp.status_code in (404, 400, 422)


@pytest.mark.asyncio
async def test_quick_start_default_name(client: AsyncClient):
    """Quick-start without name uses default."""
    user_id = await _auth_as(client, "qs_default")
    scenario_id = await _create_scenario(client, "Default Name Scenario")

    resp = await client.post(
        "/api/v1/runs/quick-start",
        json={"user_id": user_id, "scenario_id": scenario_id},
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Quick Start Game"


# ---------------------------------------------------------------------------
# 2. Multi-player join flow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_multiple_players_join_run(client: AsyncClient):
    """Two players can join the same run with different roles."""
    owner_id = await _auth_as(client, "mp_owner")
    scenario_id = await _create_scenario(client, "Multi Player Scenario")

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Multi Player Game"},
    )
    run_id = run_resp.json()["id"]

    # Owner joins as blue
    join1 = await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": owner_id, "role_id": "blue_commander"},
    )
    assert join1.status_code == 201

    # Second player joins as red
    player2_id = await _auth_as(client, "mp_player2")
    join2 = await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": player2_id, "role_id": "red_commander"},
    )
    assert join2.status_code == 201

    # Verify run has 2 participants
    run_resp = await client.get(f"/api/v1/runs/{run_id}")
    assert run_resp.status_code == 200
    participants = run_resp.json().get("participants", [])
    assert len(participants) == 2


@pytest.mark.asyncio
async def test_join_nonexistent_run_fails(client: AsyncClient):
    """Joining a run that doesn't exist returns 404."""
    user_id = await _auth_as(client, "join_ghost")

    resp = await client.post(
        f"/api/v1/runs/{uuid.uuid4()}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 3. Turn submission flow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_legal_actions_for_running_game(client: AsyncClient):
    """Legal actions are available for a running game."""
    run_id, user_id, _ = await _setup_running_game(client, "legal_owner")

    resp = await client.get(
        f"/api/v1/runs/{run_id}/legal-actions",
        params={"role_id": "blue_commander"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["actions"], list)
    assert len(data["actions"]) > 0


@pytest.mark.asyncio
async def test_submit_action_and_advance_turn(client: AsyncClient):
    """Submit an action then advance the turn successfully."""
    run_id, user_id, _ = await _setup_running_game(client, "turn_owner")

    # Submit an action
    action_resp = await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": user_id,
            "role_id": "blue_commander",
            "action_type": "move",
            "action_payload": {"unit_id": "u1", "target": "zone_a"},
        },
    )
    assert action_resp.status_code == 201

    # Advance the turn
    advance_resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert advance_resp.status_code == 200
    data = advance_resp.json()
    assert data["turn"] >= 1


@pytest.mark.asyncio
async def test_advance_turn_multiple_times(client: AsyncClient):
    """Can advance multiple turns sequentially."""
    run_id, user_id, _ = await _setup_running_game(client, "multi_turn")

    for expected_turn in range(1, 4):
        resp = await client.post(f"/api/v1/runs/{run_id}/advance")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_action_history_accumulates(client: AsyncClient):
    """Action history grows as actions are submitted."""
    run_id, user_id, _ = await _setup_running_game(client, "hist_owner")

    # Submit two actions
    for _ in range(2):
        await client.post(
            f"/api/v1/runs/{run_id}/actions",
            json={
                "user_id": user_id,
                "role_id": "blue_commander",
                "action_type": "hold",
                "action_payload": {"unit_id": "u1"},
            },
        )

    resp = await client.get(f"/api/v1/runs/{run_id}/actions")
    assert resp.status_code == 200
    actions = resp.json()
    assert isinstance(actions, list)
    assert len(actions) >= 2


# ---------------------------------------------------------------------------
# 4. State retrieval
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_state_before_start(client: AsyncClient):
    """State of a lobby run returns empty state."""
    await _auth_as(client, "state_lobby")
    scenario_id = await _create_scenario(client, "State Lobby Scenario")

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "State Lobby"},
    )
    run_id = run_resp.json()["id"]

    resp = await client.get(f"/api/v1/runs/{run_id}/state")
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == {}


@pytest.mark.asyncio
async def test_get_state_after_start(client: AsyncClient):
    """Running game returns populated state."""
    run_id, user_id, _ = await _setup_running_game(client, "state_running")

    resp = await client.get(f"/api/v1/runs/{run_id}/state")
    assert resp.status_code == 200
    data = resp.json()
    assert data["run_id"] == run_id
    assert "turn" in data
    assert "phase" in data


@pytest.mark.asyncio
async def test_state_denied_for_non_member(client: AsyncClient):
    """Non-member cannot access run state."""
    run_id, _, _ = await _setup_running_game(client, "state_owner2")

    # Switch to a different user
    await _auth_as(client, "state_intruder")
    resp = await client.get(f"/api/v1/runs/{run_id}/state")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_run_details(client: AsyncClient):
    """GET /runs/{id} returns run metadata."""
    user_id = await _auth_as(client, "detail_owner")
    scenario_id = await _create_scenario(client, "Detail Scenario")

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Detail Test"},
    )
    run_id = run_resp.json()["id"]

    resp = await client.get(f"/api/v1/runs/{run_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == run_id
    assert data["name"] == "Detail Test"
    assert data["scenario_id"] == scenario_id
    assert data["owner_id"] == user_id


# ---------------------------------------------------------------------------
# 5. Game metrics
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_metrics_running_game(client: AsyncClient):
    """Metrics endpoint returns escalation data for running game."""
    run_id, user_id, _ = await _setup_running_game(client, "metrics_owner")

    resp = await client.get(f"/api/v1/runs/{run_id}/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "escalation_level" in data or "metrics" in data


@pytest.mark.asyncio
async def test_get_metrics_lobby_game(client: AsyncClient):
    """Metrics for non-running game returns empty metrics."""
    await _auth_as(client, "metrics_lobby")
    scenario_id = await _create_scenario(client, "Metrics Lobby")

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Metrics Lobby Game"},
    )
    run_id = run_resp.json()["id"]

    resp = await client.get(f"/api/v1/runs/{run_id}/metrics")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# 6. Invalid state transitions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cannot_start_non_lobby_run(client: AsyncClient):
    """Starting an already running game fails."""
    run_id, _, _ = await _setup_running_game(client, "double_start")

    resp = await client.post(f"/api/v1/runs/{run_id}/start")
    assert resp.status_code in (400, 409, 422)


@pytest.mark.asyncio
async def test_cannot_advance_lobby_run(client: AsyncClient):
    """Cannot advance turn on a game that hasn't started."""
    await _auth_as(client, "advance_lobby")
    scenario_id = await _create_scenario(client, "Advance Lobby Scenario")

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Lobby Advance"},
    )
    run_id = run_resp.json()["id"]

    resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    # Either 400 (wrong state), 403 (not a participant), or similar
    assert resp.status_code in (400, 403, 409, 422)


@pytest.mark.asyncio
async def test_cannot_resume_non_paused_run(client: AsyncClient):
    """Resuming a run that isn't paused fails."""
    run_id, _, _ = await _setup_running_game(client, "resume_bad")

    resp = await client.post(f"/api/v1/runs/{run_id}/resume")
    assert resp.status_code in (400, 409, 422)


# ---------------------------------------------------------------------------
# 7. Auth guard coverage
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unauthenticated_access_rejected(unauth_client: AsyncClient):
    """API endpoints reject unauthenticated requests."""
    resp = await unauth_client.get("/api/v1/runs")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_quick_start_rejected(unauth_client: AsyncClient):
    """Quick-start rejects unauthenticated requests."""
    resp = await unauth_client.post(
        "/api/v1/runs/quick-start",
        json={
            "user_id": str(uuid.uuid4()),
            "scenario_id": str(uuid.uuid4()),
        },
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 8. End-to-end single player flow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_full_single_player_flow(client: AsyncClient):
    """Complete flow: quick-start → submit action → advance turn → get state."""
    user_id = await _auth_as(client, "e2e_player")
    scenario_id = await _create_scenario(client, "E2E Scenario")

    # Quick-start creates game with AI
    qs_resp = await client.post(
        "/api/v1/runs/quick-start",
        json={"user_id": user_id, "scenario_id": scenario_id},
    )
    assert qs_resp.status_code == 201
    run_id = qs_resp.json()["id"]

    # Submit an action
    action_resp = await client.post(
        f"/api/v1/runs/{run_id}/actions",
        json={
            "user_id": user_id,
            "role_id": "blue_commander",
            "action_type": "move",
            "action_payload": {"unit_id": "u1", "target": "zone_a"},
        },
    )
    assert action_resp.status_code == 201

    # Advance the turn
    advance_resp = await client.post(f"/api/v1/runs/{run_id}/advance")
    assert advance_resp.status_code == 200
    turn_data = advance_resp.json()
    assert turn_data["turn"] >= 1

    # Get current state
    state_resp = await client.get(f"/api/v1/runs/{run_id}/state")
    assert state_resp.status_code == 200
    state_data = state_resp.json()
    assert state_data["run_id"] == run_id

    # Check action history
    hist_resp = await client.get(f"/api/v1/runs/{run_id}/actions")
    assert hist_resp.status_code == 200
    assert isinstance(hist_resp.json(), list)
