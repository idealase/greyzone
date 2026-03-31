"""Tests for auth endpoints and JWT-protected routes."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(unauth_client: AsyncClient):
    register_resp = await unauth_client.post(
        "/api/auth/register",
        json={
            "username": "authuser",
            "display_name": "Auth User",
            "email": "authuser@example.com",
            "password": "strongpass123",
        },
    )
    assert register_resp.status_code == 201
    register_data = register_resp.json()
    assert register_data["access_token"]
    assert register_data["refresh_token"]
    assert register_data["user"]["username"] == "authuser"

    login_resp = await unauth_client.post(
        "/api/auth/login",
        json={"username": "authuser", "password": "strongpass123"},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["access_token"]
    assert login_data["refresh_token"]
    assert login_data["user"]["username"] == "authuser"


@pytest.mark.asyncio
async def test_login_invalid_credentials(unauth_client: AsyncClient):
    await unauth_client.post(
        "/api/auth/register",
        json={
            "username": "badlogin",
            "display_name": "Bad Login",
            "email": "badlogin@example.com",
            "password": "correctpass",
        },
    )
    resp = await unauth_client.post(
        "/api/auth/login",
        json={"username": "badlogin", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(unauth_client: AsyncClient):
    register_resp = await unauth_client.post(
        "/api/auth/register",
        json={
            "username": "refreshuser",
            "display_name": "Refresh User",
            "email": "refreshuser@example.com",
            "password": "refreshpass123",
        },
    )
    refresh_token = register_resp.json()["refresh_token"]
    resp = await unauth_client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]
    assert resp.json()["refresh_token"]


@pytest.mark.asyncio
async def test_protected_route_requires_token(unauth_client: AsyncClient):
    resp = await unauth_client.get("/api/v1/users")
    assert resp.status_code == 401
