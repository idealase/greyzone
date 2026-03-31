"""Tests for run manager behaviors."""

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.event import RunSnapshot
from app.models.scenario import Scenario
from app.schemas.run import RunCreate
from app.services.engine_bridge import EngineError
from app.services.run_manager import RunManager


@pytest.mark.asyncio
async def test_advance_turn_fails_when_snapshot_missing(db_session, mock_engine_bridge):
    """Snapshot failures should surface to the caller and avoid persisting the turn."""
    run_manager = RunManager(mock_engine_bridge)

    scenario = Scenario(name="Snapshot Failure", config={"turns": 2})
    db_session.add(scenario)
    await db_session.flush()
    await db_session.refresh(scenario)

    run = await run_manager.create_run(
        db_session,
        RunCreate(scenario_id=scenario.id, name="Test Run"),
    )
    await run_manager.start_run(db_session, run.id)

    mock_engine_bridge.take_snapshot.side_effect = EngineError("snapshot boom")

    with pytest.raises(HTTPException) as excinfo:
        await run_manager.advance_turn(db_session, run.id)

    assert excinfo.value.status_code == 503

    snapshot_rows = await db_session.execute(
        select(RunSnapshot).where(RunSnapshot.run_id == run.id)
    )
    assert snapshot_rows.scalars().first() is None
