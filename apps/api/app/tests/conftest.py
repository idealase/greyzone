"""Shared test fixtures."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_session
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager
from app.services.streaming import ConnectionManager

# Use aiosqlite for testing (no postgres required)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create an async in-memory SQLite engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # SQLite needs special handling for JSON columns -- treat them as text
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Yield an async session for each test, rolled back after."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest.fixture
def mock_engine_bridge() -> EngineBridge:
    """Create a mock engine bridge that doesn't need a real binary."""
    bridge = MagicMock(spec=EngineBridge)
    bridge.binary_path = "/fake/engine"
    bridge._processes = {}

    bridge.start_engine = AsyncMock(return_value=None)
    bridge.send_command = AsyncMock(return_value={"status": "ok"})
    bridge.get_state = AsyncMock(
        return_value={"turn": 0, "phase": "CompetitiveNormality", "units": []}
    )
    bridge.get_role_state = AsyncMock(
        return_value={"turn": 0, "phase": "CompetitiveNormality", "visible_units": []}
    )
    bridge.get_legal_actions = AsyncMock(
        return_value=[
            {"action_type": "move", "params": {"unit_id": "u1", "target": "zone_a"}},
            {"action_type": "hold", "params": {"unit_id": "u1"}},
        ]
    )
    bridge.submit_action = AsyncMock(
        return_value={"validation": "accepted", "effects": {"moved": True}}
    )
    bridge.advance_turn = AsyncMock(
        return_value={
            "turn": 1,
            "phase": "CompetitiveNormality",
            "events": [{"type": "turn_advanced", "turn": 1}],
            "game_over": False,
        }
    )
    bridge.take_snapshot = AsyncMock(
        return_value={"turn": 1, "state": {"snapshot": True}}
    )
    bridge.get_event_log = AsyncMock(return_value=[])
    bridge.replay_to_turn = AsyncMock(return_value={"turn": 0, "state": {}})
    bridge.get_metrics = AsyncMock(
        return_value={"escalation_level": 0.3, "force_balance": 0.5}
    )
    bridge.shutdown_engine = AsyncMock(return_value=None)
    bridge.shutdown_all = AsyncMock(return_value=None)
    return bridge


@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession, mock_engine_bridge: EngineBridge
) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with overridden dependencies."""
    from app.main import app
    from app.routers import runs as runs_mod
    from app.routers import actions as actions_mod
    from app.routers import replay as replay_mod

    run_manager = RunManager(mock_engine_bridge)
    ws_manager = ConnectionManager()

    runs_mod.set_services(mock_engine_bridge, run_manager, ws_manager)
    actions_mod.set_services(mock_engine_bridge, run_manager)
    replay_mod.set_services(mock_engine_bridge)

    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        auth_resp = await ac.post(
            "/api/auth/register",
            json={
                "username": "testauthuser",
                "display_name": "Test Auth User",
                "email": "testauthuser@example.com",
                "password": "testpassword123",
            },
        )
        token = auth_resp.json()["access_token"]
        ac.headers.update({"Authorization": f"Bearer {token}"})
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauth_client(
    db_session: AsyncSession, mock_engine_bridge: EngineBridge
) -> AsyncGenerator[AsyncClient, None]:
    """Create client without auth headers for auth guard tests."""
    from app.main import app
    from app.routers import actions as actions_mod
    from app.routers import replay as replay_mod
    from app.routers import runs as runs_mod

    run_manager = RunManager(mock_engine_bridge)
    ws_manager = ConnectionManager()

    runs_mod.set_services(mock_engine_bridge, run_manager, ws_manager)
    actions_mod.set_services(mock_engine_bridge, run_manager)
    replay_mod.set_services(mock_engine_bridge)

    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_scenario_data() -> dict:
    return {
        "name": "Baltic Flashpoint",
        "description": "A scenario in the Baltic region",
        "config": {"map": "baltic", "turns": 20, "players": 2},
    }


@pytest.fixture
def sample_user_data() -> dict:
    return {
        "username": "testplayer",
        "display_name": "Test Player",
        "email": "testplayer@example.com",
        "password": "testpassword123",
        "is_ai": False,
    }


@pytest.fixture
def sample_user_id() -> uuid.UUID:
    return uuid.uuid4()
