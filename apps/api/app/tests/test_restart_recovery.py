"""Tests for engine restart recovery behavior."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import select

from app.models.event import RunSnapshot
from app.models.run import Run, RunStatus
from app.models.scenario import Scenario
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager


@pytest.mark.asyncio
async def test_shutdown_all_snapshots_active_runs() -> None:
    bridge = EngineBridge("/fake/engine")
    run_id = uuid.uuid4()

    process = MagicMock()
    process.stdin = MagicMock()
    process.stdin.write = MagicMock()
    process.stdin.drain = AsyncMock()
    process.stdin.close = MagicMock()
    process.stdout = MagicMock()
    process.wait = AsyncMock(return_value=0)
    process.kill = MagicMock()
    bridge._processes[run_id] = process
    bridge.take_snapshot = AsyncMock(return_value={"ok": True})

    await bridge.shutdown_all()

    bridge.take_snapshot.assert_awaited_once_with(run_id)
    assert run_id not in bridge._processes


@pytest.mark.asyncio
async def test_restore_running_runs_from_latest_snapshot(db_session) -> None:
    scenario = Scenario(
        name=f"Restore Scenario {uuid.uuid4()}",
        description="",
        config={},
    )
    db_session.add(scenario)
    await db_session.flush()

    run = Run(
        scenario_id=scenario.id,
        name="Recover Me",
        status=RunStatus.RUNNING,
        seed=123,
    )
    db_session.add(run)
    await db_session.flush()

    old_snapshot = RunSnapshot(run_id=run.id, turn=2, state={"turn": 2})
    new_snapshot = RunSnapshot(run_id=run.id, turn=5, state={"turn": 5})
    db_session.add(old_snapshot)
    db_session.add(new_snapshot)
    await db_session.commit()

    engine = MagicMock(spec=EngineBridge)
    engine.start_engine = AsyncMock(return_value=None)
    engine.load_snapshot = AsyncMock(return_value={"status": "ok"})
    manager = RunManager(engine)

    await manager.restore_running_runs(db_session)

    engine.start_engine.assert_awaited_once_with(run.id, scenario.name, run.seed)
    engine.load_snapshot.assert_awaited_once_with(run.id, {"turn": 5})

    result = await db_session.execute(select(Run).where(Run.id == run.id))
    restored_run = result.scalar_one()
    assert restored_run.status == RunStatus.RUNNING
