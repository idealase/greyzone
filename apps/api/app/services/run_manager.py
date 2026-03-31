"""Run lifecycle management service."""

from __future__ import annotations

import uuid

import httpx
import structlog
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.run import Run, RunParticipant, RunStatus
from app.models.scenario import Scenario
from app.models.user import User
from app.models.event import RunEvent, RunSnapshot
from app.schemas.run import RunCreate, RunParticipantCreate
from app.services.engine_bridge import EngineBridge, EngineError

logger = structlog.get_logger()


class RunManager:
    """Orchestrates run lifecycle."""

    def __init__(self, engine: EngineBridge) -> None:
        self.engine = engine

    async def restore_running_runs(self, db: AsyncSession) -> None:
        """Restore engine processes for runs marked RUNNING from latest snapshots."""
        result = await db.execute(
            select(Run)
            .where(Run.status == RunStatus.RUNNING)
            .options(selectinload(Run.scenario))
        )
        running_runs = list(result.scalars().all())

        for run in running_runs:
            try:
                await self.engine.start_engine(run.id, run.scenario.name, run.seed)
            except EngineError as e:
                logger.warning(
                    "run_restore_engine_start_failed",
                    run_id=str(run.id),
                    error=str(e),
                )
                continue

            latest_snapshot_result = await db.execute(
                select(RunSnapshot)
                .where(RunSnapshot.run_id == run.id)
                .order_by(RunSnapshot.turn.desc(), RunSnapshot.created_at.desc())
                .limit(1)
            )
            latest_snapshot = latest_snapshot_result.scalar_one_or_none()
            if latest_snapshot is None:
                logger.warning("run_restore_snapshot_missing", run_id=str(run.id))
                await self.engine.shutdown_engine(run.id)
                continue

            try:
                await self.engine.load_snapshot(run.id, latest_snapshot.state)
                logger.info(
                    "run_restored_from_snapshot",
                    run_id=str(run.id),
                    turn=latest_snapshot.turn,
                )
            except EngineError as e:
                logger.warning(
                    "run_restore_load_snapshot_failed",
                    run_id=str(run.id),
                    turn=latest_snapshot.turn,
                    error=str(e),
                )
                await self.engine.shutdown_engine(run.id)

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
        # Eager-load user relationship for serialization
        result = await db.execute(
            select(RunParticipant)
            .where(RunParticipant.id == participant.id)
            .options(selectinload(RunParticipant.user))
        )
        return result.scalar_one()

    async def start_run(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Transition a run from lobby to running, start engine."""
        run = await self.get_run(db, run_id)
        if run.status != RunStatus.LOBBY:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start run in '{run.status}' state",
            )

        try:
            await self.engine.start_engine(run_id, run.scenario.name, run.seed)
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
            .options(
                selectinload(Run.scenario),
                selectinload(Run.participants).selectinload(RunParticipant.user),
            )
        )
        run = result.scalar_one_or_none()
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    async def list_runs(self, db: AsyncSession) -> list[Run]:
        """List all runs."""
        result = await db.execute(
            select(Run)
            .options(
                selectinload(Run.scenario),
                selectinload(Run.participants).selectinload(RunParticipant.user),
            )
            .order_by(Run.created_at.desc())
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

        old_phase = run.current_phase

        try:
            result = await self.engine.advance_turn(run_id)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        # Get full world state from engine
        try:
            state = await self.engine.get_state(run_id)
        except EngineError:
            state = {}

        new_turn = result.get("turn", run.current_turn + 1)
        current_phase = result.get("phase", run.current_phase)
        events = result.get("events", [])

        # Update run in database
        run.current_turn = new_turn
        run.current_phase = current_phase

        # Persist events from this turn
        for evt in events:
            event = RunEvent(
                run_id=run_id,
                turn=new_turn,
                event_type=evt.get("type", "unknown"),
                payload=evt,
            )
            db.add(event)

        # Take and persist snapshot
        try:
            snapshot_data = await self.engine.take_snapshot(run_id)
            snapshot = RunSnapshot(
                run_id=run_id,
                turn=new_turn,
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

        # Step 6: AI auto-play after human turn
        try:
            ai_result = await db.execute(
                select(RunParticipant).where(
                    RunParticipant.run_id == run_id,
                    RunParticipant.is_ai == True,  # noqa: E712
                )
            )
            ai_participants = list(ai_result.scalars().all())
            if ai_participants:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    for ai_p in ai_participants:
                        try:
                            await client.post(
                                "http://localhost:3100/ai/take-turn",
                                json={
                                    "runId": str(run_id),
                                    "roleId": ai_p.role_id,
                                },
                            )
                        except Exception as ai_err:
                            logger.warning(
                                "ai_auto_play_failed",
                                run_id=str(run_id),
                                role_id=ai_p.role_id,
                                error=str(ai_err),
                            )
        except Exception as e:
            logger.warning("ai_auto_play_query_failed", error=str(e))

        # Return TurnResult shape expected by frontend
        return {
            "turn": new_turn,
            "phase": current_phase,
            "order_parameter": state.get("order_parameter", 0.0),
            "world_state": state,
            "events": events,
            "phase_changed": old_phase != current_phase,
            "previous_phase": old_phase,
        }

    async def quick_start(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        scenario_id: uuid.UUID,
        name: str | None = None,
        seed: int | None = None,
    ) -> Run:
        """Create a single-player run with human as blue and AI as red, then start."""
        # Ensure AI user exists
        result = await db.execute(
            select(User).where(User.username == "ai_commander")
        )
        ai_user = result.scalar_one_or_none()
        if ai_user is None:
            ai_user = User(
                username="ai_commander",
                display_name="AI Commander",
                is_ai=True,
            )
            db.add(ai_user)
            await db.flush()
            await db.refresh(ai_user)

        # Create the run
        run_name = name or "Quick Start Game"
        run_data = RunCreate(
            scenario_id=scenario_id,
            name=run_name,
            seed=seed,
        )
        run = await self.create_run(db, run_data)

        # Join human as blue_commander
        await self.join_run(
            db,
            run.id,
            RunParticipantCreate(
                user_id=user_id,
                role_id="blue_commander",
                is_ai=False,
            ),
        )

        # Join AI as red_commander
        await self.join_run(
            db,
            run.id,
            RunParticipantCreate(
                user_id=ai_user.id,
                role_id="red_commander",
                is_ai=True,
            ),
        )

        # Start the run
        run = await self.start_run(db, run.id)

        logger.info(
            "quick_start_created",
            run_id=str(run.id),
            user_id=str(user_id),
            scenario_id=str(scenario_id),
        )
        return run

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
