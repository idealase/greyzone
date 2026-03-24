"""Tests for user endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, sample_user_data: dict):
    resp = await client.post("/api/v1/users", json=sample_user_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == sample_user_data["username"]
    assert data["display_name"] == sample_user_data["display_name"]


@pytest.mark.asyncio
async def test_create_duplicate_user(client: AsyncClient, sample_user_data: dict):
    await client.post("/api/v1/users", json=sample_user_data)
    resp = await client.post("/api/v1/users", json=sample_user_data)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, sample_user_data: dict):
    await client.post("/api/v1/users", json=sample_user_data)
    resp = await client.get("/api/v1/users")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, sample_user_data: dict):
    create_resp = await client.post("/api/v1/users", json=sample_user_data)
    user_id = create_resp.json()["id"]
    resp = await client.get(f"/api/v1/users/{user_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == user_id


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
