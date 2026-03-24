"""Run lifecycle management service."""

from __future__ import annotations

import uuid

import structlog
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.run import Run, RunParticipant, RunStatus
from app.models.scenario import Scenario
from app.models.event import RunEvent, RunSnapshot
from app.schemas.run import RunCreate, RunParticipantCreate
from app.services.engine_bridge import EngineBridge, EngineError

logger = structlog.get_logger()


class RunManager:
    """Orchestrates run lifecycle."""

    def __init__(self, engine: EngineBridge) -> None:
        self.engine = engine

    async def create_run(self, db: AsyncSession, data: RunCreate) -> Run:
        """Create a new run from a scenario."""
        scenario = await db.get(Scenario, data.scenario_id)
        if scenario is None:
            raise HTTPException(status_code=404, detail="Scenario not found")

        run = Run(
            scenario_id=data.scenario_id,
            name=data.name,
            config=data.config or scenario.config,
            status=RunStatus.LOBBY,
        )
        if data.seed is not None:
            run.seed = data.seed

        db.add(run)
        await db.flush()
        await db.refresh(run)

        logger.info("run_created", run_id=str(run.id), scenario_id=str(data.scenario_id))
        return await self.get_run(db, run.id)

    async def join_run(
        self, db: AsyncSession, run_id: uuid.UUID, data: RunParticipantCreate
    ) -> RunParticipant:
        """Add a participant with a role to a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status not in (RunStatus.CREATED, RunStatus.LOBBY):
            raise HTTPException(
                status_code=400, detail="Cannot join run in current state"
            )

        participant = RunParticipant(
            run_id=run_id,
            user_id=data.user_id,
            role_id=data.role_id,
            is_ai=data.is_ai,
        )
        db.add(participant)
        await db.flush()
        await db.refresh(participant)
        return participant

    async def start_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Transition a run from lobby to running, start engine."""
        run = await db.get(
            Run, run_id, options=[selectinload(Run.participants)]
        )
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.LOBBY:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start run in '{run.status}' state",
            )

        try:
            await self.engine.start_engine(run_id, run.config, run.seed)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        run.status = RunStatus.RUNNING
        await db.flush()
        logger.info("run_started", run_id=str(run_id))
        return await self.get_run(db, run_id)

    async def get_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Get a run by ID with participants loaded."""
        result = await db.execute(
            select(Run)
            .where(Run.id == run_id)
            .options(selectinload(Run.participants))
        )
        run = result.scalar_one_or_none()
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    async def list_runs(self, db: AsyncSession) -> list[Run]:
        """List all runs."""
        result = await db.execute(
            select(Run).options(selectinload(Run.participants)).order_by(Run.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_run_state(
        self, db: AsyncSession, run_id: uuid.UUID, role_id: str | None = None
    ) -> dict:
        """Get run state, optionally scoped to a role."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.RUNNING:
            return {
                "run_id": str(run.id),
                "turn": run.current_turn,
                "phase": run.current_phase,
                "state": {},
                "role_id": role_id,
            }

        try:
            if role_id:
                state = await self.engine.get_role_state(run_id, role_id)
            else:
                state = await self.engine.get_state(run_id)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        return {
            "run_id": str(run.id),
            "turn": run.current_turn,
            "phase": run.current_phase,
            "state": state,
            "role_id": role_id,
        }

    async def pause_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Pause a running run."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Run is not running")
        run.status = RunStatus.PAUSED
        await db.flush()
        return await self.get_run(db, run_id)

    async def resume_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Resume a paused run."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.PAUSED:
            raise HTTPException(status_code=400, detail="Run is not paused")
        run.status = RunStatus.RUNNING
        await db.flush()
        return await self.get_run(db, run_id)

    async def stop_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Stop a run and shut down the engine."""
        run = await self.get_run(db, run_id)
        if run.status not in (RunStatus.RUNNING, RunStatus.PAUSED):
            raise HTTPException(status_code=400, detail="Run is not active")

        await self.engine.shutdown_engine(run_id)
        run.status = RunStatus.ABORTED
        await db.flush()
        logger.info("run_stopped", run_id=str(run_id))
        return await self.get_run(db, run_id)

    async def advance_turn(self, db: AsyncSession, run_id: uuid.UUID) -> dict:
        """Advance to the next turn."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Run is not running")

        try:
            result = await self.engine.advance_turn(run_id)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        run.current_turn = result.get("turn", run.current_turn + 1)
        run.current_phase = result.get("phase", run.current_phase)

        # Persist events from this turn
        for evt in result.get("events", []):
            event = RunEvent(
                run_id=run_id,
                turn=run.current_turn,
                event_type=evt.get("type", "unknown"),
                payload=evt,
            )
            db.add(event)

        # Take and persist snapshot
        try:
            snapshot_data = await self.engine.take_snapshot(run_id)
            snapshot = RunSnapshot(
                run_id=run_id,
                turn=run.current_turn,
                state=snapshot_data,
            )
            db.add(snapshot)
        except EngineError:
            pass  # Snapshot failure is non-fatal

        await db.flush()

        # Check for game over
        if result.get("game_over", False):
            run.status = RunStatus.COMPLETED
            await db.flush()

        return result

    async def get_metrics(self, db: AsyncSession, run_id: uuid.UUID) -> dict:
        """Get simulation metrics."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.RUNNING:
            return {"run_id": str(run.id), "turn": run.current_turn, "metrics": {}}

        try:
            metrics = await self.engine.get_metrics(run_id)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        return {
            "run_id": str(run.id),
            "turn": run.current_turn,
            "metrics": metrics,
        }
