"""Tests for user endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, sample_user_data: dict):
    register_data = {
        "username": sample_user_data["username"],
        "display_name": sample_user_data["display_name"],
        "email": sample_user_data["email"],
        "password": sample_user_data["password"],
    }
    resp = await client.post("/api/auth/register", json=register_data)
    assert resp.status_code == 201
    data = resp.json()["user"]
    assert data["username"] == sample_user_data["username"]
    assert data["display_name"] == sample_user_data["display_name"]


@pytest.mark.asyncio
async def test_create_duplicate_user(client: AsyncClient, sample_user_data: dict):
    register_data = {
        "username": sample_user_data["username"],
        "display_name": sample_user_data["display_name"],
        "email": sample_user_data["email"],
        "password": sample_user_data["password"],
    }
    await client.post("/api/auth/register", json=register_data)
    resp = await client.post("/api/auth/register", json=register_data)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, sample_user_data: dict):
    register_data = {
        "username": sample_user_data["username"],
        "display_name": sample_user_data["display_name"],
        "email": sample_user_data["email"],
        "password": sample_user_data["password"],
    }
    auth_resp = await client.post("/api/auth/register", json=register_data)
    access_token = auth_resp.json()["access_token"]
    resp = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, sample_user_data: dict):
    register_data = {
        "username": sample_user_data["username"],
        "display_name": sample_user_data["display_name"],
        "email": sample_user_data["email"],
        "password": sample_user_data["password"],
    }
    create_resp = await client.post("/api/auth/register", json=register_data)
    user_id = create_resp.json()["user"]["id"]
    access_token = create_resp.json()["access_token"]
    resp = await client.get(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == user_id


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    register_resp = await client.post(
        "/api/auth/register",
        json={
            "username": "lookupuser",
            "display_name": "Lookup User",
            "email": "lookupuser@example.com",
            "password": "testpassword123",
        },
    )
    access_token = register_resp.json()["access_token"]
    resp = await client.get(
        "/api/v1/users/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 404
