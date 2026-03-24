"""Replay and event history service."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import RunEvent, RunSnapshot
from app.models.run import Run
from app.services.engine_bridge import EngineBridge, EngineError


class ReplayService:
    """Provides replay and event query capabilities."""

    def __init__(self, engine: EngineBridge) -> None:
        self.engine = engine

    async def get_events(
        self, db: AsyncSession, run_id: uuid.UUID
    ) -> list[RunEvent]:
        """Get all events for a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")

        result = await db.execute(
            select(RunEvent)
            .where(RunEvent.run_id == run_id)
            .order_by(RunEvent.turn, RunEvent.created_at)
        )
        return list(result.scalars().all())

    async def get_snapshots(
        self, db: AsyncSession, run_id: uuid.UUID
    ) -> list[RunSnapshot]:
        """Get all snapshots for a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")

        result = await db.execute(
            select(RunSnapshot)
            .where(RunSnapshot.run_id == run_id)
            .order_by(RunSnapshot.turn)
        )
        return list(result.scalars().all())

    async def get_replay(
        self, db: AsyncSession, run_id: uuid.UUID
    ) -> dict:
        """Get full replay data for a run (events + snapshots)."""
        events = await self.get_events(db, run_id)
        snapshots = await self.get_snapshots(db, run_id)
        return {
            "run_id": str(run_id),
            "events": [
                {
                    "id": str(e.id),
                    "turn": e.turn,
                    "event_type": e.event_type,
                    "payload": e.payload,
                    "visibility": e.visibility,
                }
                for e in events
            ],
            "snapshots": [
                {
                    "id": str(s.id),
                    "turn": s.turn,
                    "state": s.state,
                }
                for s in snapshots
            ],
        }

    async def replay_to_turn(
        self, db: AsyncSession, run_id: uuid.UUID, turn: int
    ) -> dict:
        """Get state at a specific turn via snapshot or engine replay."""
        # Try to find a snapshot first
        result = await db.execute(
            select(RunSnapshot).where(
                RunSnapshot.run_id == run_id,
                RunSnapshot.turn == turn,
            )
        )
        snapshot = result.scalar_one_or_none()
        if snapshot is not None:
            return {
                "run_id": str(run_id),
                "turn": turn,
                "state": snapshot.state,
                "source": "snapshot",
            }

        # Fall back to engine replay if engine is running
        try:
            state = await self.engine.replay_to_turn(run_id, turn)
            return {
                "run_id": str(run_id),
                "turn": turn,
                "state": state,
                "source": "engine",
            }
        except EngineError:
            raise HTTPException(
                status_code=404,
                detail=f"No snapshot or running engine available for turn {turn}",
            )
