"""Tests for scenario CRUD endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_scenario(client: AsyncClient, sample_scenario_data: dict):
    resp = await client.post("/api/v1/scenarios", json=sample_scenario_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == sample_scenario_data["name"]
    assert data["description"] == sample_scenario_data["description"]
    assert data["config"] == sample_scenario_data["config"]
    assert "id" in data


@pytest.mark.asyncio
async def test_list_scenarios(client: AsyncClient, sample_scenario_data: dict):
    await client.post("/api/v1/scenarios", json=sample_scenario_data)
    resp = await client.get("/api/v1/scenarios")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_get_scenario(client: AsyncClient, sample_scenario_data: dict):
    create_resp = await client.post("/api/v1/scenarios", json=sample_scenario_data)
    scenario_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/scenarios/{scenario_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == scenario_id


@pytest.mark.asyncio
async def test_get_scenario_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/scenarios/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_scenario(client: AsyncClient, sample_scenario_data: dict):
    create_resp = await client.post("/api/v1/scenarios", json=sample_scenario_data)
    scenario_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/v1/scenarios/{scenario_id}",
        json={"name": "Updated Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_scenario(client: AsyncClient, sample_scenario_data: dict):
    create_resp = await client.post("/api/v1/scenarios", json=sample_scenario_data)
    scenario_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/scenarios/{scenario_id}")
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get(f"/api/v1/scenarios/{scenario_id}")
    assert resp.status_code == 404
