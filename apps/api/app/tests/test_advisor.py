"""Tests for advisor endpoint."""

from __future__ import annotations

import httpx
import pytest
import uuid
from httpx import AsyncClient


class _MockResponse:
    def __init__(self, status_code: int, payload: dict, text: str = "") -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self) -> dict:
        return self._payload


class _MockAdvisorClient:
    def __init__(
        self,
        captured: dict[str, object],
        response: _MockResponse | None = None,
        error: Exception | None = None,
    ) -> None:
        self._captured = captured
        self._response = response
        self._error = error

    async def __aenter__(self) -> _MockAdvisorClient:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        _ = (exc_type, exc, tb)
        return False

    async def post(self, url: str, json: dict) -> _MockResponse:
        self._captured["url"] = url
        self._captured["json"] = json
        if self._error is not None:
            raise self._error
        assert self._response is not None
        return self._response


async def _setup_running_run(client: AsyncClient) -> tuple[str, str]:
    scenario_resp = await client.post(
        "/api/v1/scenarios",
        json={"name": "Advisor Scenario", "config": {"turns": 10}},
    )
    scenario_id = scenario_resp.json()["id"]

    run_resp = await client.post(
        "/api/v1/runs",
        json={"scenario_id": scenario_id, "name": "Advisor Run"},
    )
    run_data = run_resp.json()
    run_id = run_data["id"]
    user_id = run_data["owner_id"]

    await client.post(
        f"/api/v1/runs/{run_id}/join",
        json={"user_id": user_id, "role_id": "blue_commander"},
    )
    await client.post(f"/api/v1/runs/{run_id}/start")
    return run_id, user_id


@pytest.mark.asyncio
async def test_advisor_success(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    run_id, user_id = await _setup_running_run(client)
    captured: dict[str, object] = {}

    response = _MockResponse(
        status_code=200,
        payload={
            "state_summary": "Stable posture",
            "strategic_outlook": "Maintain pressure",
            "suggestions": [],
        },
    )

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured=captured, response=response)

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander", "max_suggestions": 2},
    )

    assert resp.status_code == 200
    assert resp.json()["state_summary"] == "Stable posture"
    assert captured["url"] == "http://localhost:3100/ai/advisor"
    assert captured["json"] == {
        "runId": run_id,
        "roleId": "blue_commander",
        "maxSuggestions": 2,
        "userId": user_id,
    }


@pytest.mark.asyncio
async def test_advisor_normalizes_camelcase_upstream_payload(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, _ = await _setup_running_run(client)

    response = _MockResponse(
        status_code=200,
        payload={
            "stateSummary": "Stable posture",
            "strategicOutlook": "Maintain pressure",
            "suggestions": [
                {
                    "rank": 1,
                    "action": {
                        "actionType": "deescalate",
                        "targetDomain": "Cyber",
                        "targetActorId": "blue-alliance",
                        "intensity": 0.6,
                    },
                    "rationale": "Reduce risk in cyber domain",
                    "confidence": 0.77,
                    "expectedLocalEffects": {
                        "summary": "Stress eases in target domain",
                        "stressDelta": -0.1,
                        "resilienceDelta": 0.05,
                    },
                }
            ],
        },
    )

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured={}, response=response)

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 200
    payload = resp.json()
    assert payload["state_summary"] == "Stable posture"
    assert payload["strategic_outlook"] == "Maintain pressure"
    assert payload["suggestions"][0]["action"]["action_type"] == "deescalate"
    assert payload["suggestions"][0]["action"]["target_domain"] == "Cyber"
    assert payload["suggestions"][0]["expected_local_effects"]["stress_delta"] == -0.1


@pytest.mark.asyncio
async def test_advisor_infers_participant_role(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, user_id = await _setup_running_run(client)
    captured: dict[str, object] = {}

    response = _MockResponse(
        status_code=200,
        payload={
            "state_summary": "Steady",
            "strategic_outlook": "Hold line",
            "suggestions": [],
        },
    )

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured=captured, response=response)

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id},
    )

    assert resp.status_code == 200
    assert captured["json"] == {
        "runId": run_id,
        "roleId": "blue_commander",
        "maxSuggestions": 3,
        "userId": user_id,
    }


@pytest.mark.asyncio
async def test_advisor_rejects_wrong_role(client: AsyncClient):
    run_id, _ = await _setup_running_run(client)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "red_commander"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Role does not belong to user"


@pytest.mark.asyncio
async def test_advisor_rejects_mismatched_run_id(client: AsyncClient):
    run_id, _ = await _setup_running_run(client)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": str(uuid.uuid4()), "role_id": "blue_commander"},
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "run_id must match the requested run"


@pytest.mark.asyncio
async def test_advisor_rejects_non_member(client: AsyncClient):
    run_id, _ = await _setup_running_run(client)
    intruder_resp = await client.post(
        "/api/auth/register",
        json={
            "username": "advisor_intruder",
            "display_name": "Advisor Intruder",
            "email": "advisor_intruder@example.com",
            "password": "testpassword123",
        },
    )
    intruder_token = intruder_resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {intruder_token}"

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Not authorized for this run"


@pytest.mark.asyncio
async def test_advisor_maps_upstream_non_2xx(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, _ = await _setup_running_run(client)

    response = _MockResponse(status_code=500, payload={}, text="upstream boom")

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured={}, response=response)

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 502
    assert "status 500" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_advisor_maps_transport_timeout(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, _ = await _setup_running_run(client)

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured={}, error=httpx.TimeoutException("timed out"))

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 504
    assert resp.json()["detail"] == "AI advisor request timed out"


@pytest.mark.asyncio
async def test_advisor_maps_transport_error(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, _ = await _setup_running_run(client)

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        request = httpx.Request("POST", "http://localhost:3100/ai/advisor")
        return _MockAdvisorClient(
            captured={},
            error=httpx.RequestError("connection refused", request=request),
        )

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 503
    assert resp.json()["detail"] == "AI advisor service unavailable"


@pytest.mark.asyncio
async def test_advisor_rejects_invalid_upstream_payload(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    run_id, _ = await _setup_running_run(client)

    response = _MockResponse(
        status_code=200,
        payload={
            "state_summary": "Only partial payload",
            "suggestions": [],
        },
    )

    def _client_factory(*_args, **_kwargs) -> _MockAdvisorClient:
        return _MockAdvisorClient(captured={}, response=response)

    monkeypatch.setattr("app.routers.advisor.httpx.AsyncClient", _client_factory)

    resp = await client.post(
        f"/api/v1/runs/{run_id}/advisor",
        json={"run_id": run_id, "role_id": "blue_commander"},
    )

    assert resp.status_code == 502
    assert resp.json()["detail"] == "AI advisor returned invalid response"
