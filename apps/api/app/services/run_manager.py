"""Run lifecycle management service."""

from __future__ import annotations

import asyncio
import uuid

import httpx
import structlog
from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.run import Run, RunParticipant, RunStatus
from app.models.scenario import Scenario
from app.models.user import User
from app.models.event import RunEvent, RunSnapshot
from app.models.narrative import RunNarrative
from app.schemas.run import RunCreate, RunParticipantCreate
from app.services.engine_bridge import EngineBridge, EngineError
from app.services.narrative_service import NarrativeService
from app.observability.metrics import (
    record_engine_error,
    turns_advanced_total,
)
from app.config import settings

logger = structlog.get_logger()


class RunManager:
    """Orchestrates run lifecycle."""

    def __init__(self, engine: EngineBridge) -> None:
        self.engine = engine
        self.narrative_service = NarrativeService()
        self._advance_locks: dict[uuid.UUID, asyncio.Lock] = {}
        self._ws_manager: object | None = None

    def set_ws_manager(self, ws_manager: object) -> None:
        """Inject the ConnectionManager after construction to avoid circular imports."""
        self._ws_manager = ws_manager

    async def _broadcast(self, run_id: uuid.UUID, message: dict) -> None:
        """Broadcast a WebSocket message to all clients in a run (best-effort)."""
        if self._ws_manager is None:
            return
        try:
            await self._ws_manager.broadcast_to_run(run_id, message)  # type: ignore[union-attr]
        except Exception:
            logger.warning("ws_broadcast_failed", run_id=str(run_id))

    def _get_run_lock(self, run_id: uuid.UUID) -> asyncio.Lock:
        """Return a per-run asyncio lock."""
        if run_id not in self._advance_locks:
            self._advance_locks[run_id] = asyncio.Lock()
        return self._advance_locks[run_id]

    @staticmethod
    def _assert_member(
        run: Run, user_id: uuid.UUID | None, require_participant: bool = False
    ) -> RunParticipant | None:
        """Ensure the user owns or participates in the run."""
        if user_id is None:
            raise HTTPException(status_code=401, detail="User authentication required")

        participant = next((p for p in run.participants if p.user_id == user_id), None)
        if participant is None and run.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized for this run")
        if require_participant and participant is None:
            raise HTTPException(
                status_code=403,
                detail="Only participants may perform this action",
            )
        return participant

    async def create_run(
        self, db: AsyncSession, data: RunCreate, owner_id: uuid.UUID
    ) -> Run:
        """Create a new run from a scenario."""
        scenario = await db.get(Scenario, data.scenario_id)
        if scenario is None:
            raise HTTPException(status_code=404, detail="Scenario not found")
        owner = await db.get(User, owner_id)
        if owner is None:
            raise HTTPException(status_code=404, detail="Owner not found")

        run = Run(
            scenario_id=data.scenario_id,
            name=data.name,
            config=data.config or scenario.config,
            status=RunStatus.LOBBY,
            owner_id=owner_id,
        )
        if data.seed is not None:
            run.seed = data.seed

        db.add(run)
        await db.flush()
        await db.refresh(run)

        logger.info("run_created", run_id=str(run.id), scenario_id=str(data.scenario_id))
        return await self.get_run(db, run.id)

    async def join_run(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        data: RunParticipantCreate,
        requester_id: uuid.UUID | None = None,
    ) -> RunParticipant:
        """Add a participant with a role to a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status not in (RunStatus.CREATED, RunStatus.LOBBY):
            raise HTTPException(
                status_code=400, detail="Cannot join run in current state"
            )
        if requester_id and requester_id not in (data.user_id, run.owner_id):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to add participants to this run",
            )
        user = await db.get(User, data.user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

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

    async def start_run(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> Run:
        """Transition a run from lobby to running, start engine."""
        run = await self.get_run(db, run_id)
        self._assert_member(run, user_id)
        if run.status != RunStatus.LOBBY:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start run in '{run.status}' state",
            )

        try:
            await self.engine.start_engine(run_id, run.scenario.name, run.seed)
        except EngineError as e:
            record_engine_error("start_engine")
            logger.warning(
                "engine_start_failed",
                run_id=str(run_id),
                error=str(e),
            )
            raise HTTPException(status_code=503, detail=str(e))

        run.status = RunStatus.RUNNING

        # Fetch and persist initial world state from engine
        try:
            state = await self.engine.get_state(run_id)
            if state and isinstance(state, dict):
                run.world_state = state
        except EngineError as e:
            logger.warning(
                "start_run_world_state_fetch_failed",
                run_id=str(run_id),
                error=str(e),
            )

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
                selectinload(Run.owner),
                selectinload(Run.participants).selectinload(RunParticipant.user),
            )
        )
        run = result.scalar_one_or_none()
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    async def _get_run_for_update(self, db: AsyncSession, run_id: uuid.UUID) -> Run:
        """Get a run row with a database lock when supported."""
        stmt = (
            select(Run)
            .where(Run.id == run_id)
            .options(
                selectinload(Run.scenario),
                selectinload(Run.participants).selectinload(RunParticipant.user),
            )
        )

        # SQLite does not support FOR UPDATE; rely on in-process lock there.
        bind = db.get_bind()
        if bind and getattr(bind.dialect, "name", "") != "sqlite":
            stmt = stmt.with_for_update(nowait=True)

        try:
            result = await db.execute(stmt)
        except DBAPIError as e:
            message = str(e.orig).lower() if e.orig else str(e).lower()
            if any(token in message for token in ["lock", "deadlock", "serialize"]):
                raise HTTPException(
                    status_code=409, detail="Turn advance already in progress"
                )
            raise

        run = result.scalar_one_or_none()
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    async def list_runs(self, db: AsyncSession, user_id: uuid.UUID) -> list[Run]:
        """List runs owned by or involving the user."""
        result = await db.execute(
            select(Run)
            .options(
                selectinload(Run.scenario),
                selectinload(Run.participants).selectinload(RunParticipant.user),
            )
            .outerjoin(RunParticipant, RunParticipant.run_id == Run.id)
            .where(or_(Run.owner_id == user_id, RunParticipant.user_id == user_id))
            .order_by(Run.created_at.desc())
            .distinct()
        )
        return list(result.scalars().all())

    async def get_run_state(
        self,
        db: AsyncSession,
        run_id: uuid.UUID,
        role_id: str | None = None,
        user_id: uuid.UUID | None = None,
    ) -> dict:
        """Get run state, optionally scoped to a role."""
        run = await self.get_run(db, run_id)
        participant = self._assert_member(run, user_id)
        if participant and role_id and participant.role_id != role_id:
            raise HTTPException(status_code=403, detail="Role does not belong to user")
        if participant and not role_id:
            role_id = participant.role_id
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
            record_engine_error("get_run_state")
            logger.warning(
                "engine_state_fetch_failed",
                run_id=str(run_id),
                role_id=role_id,
                error=str(e),
            )
            raise HTTPException(status_code=503, detail=str(e))

        return {
            "run_id": str(run.id),
            "turn": run.current_turn,
            "phase": run.current_phase,
            "state": state,
            "role_id": role_id,
        }

    async def pause_run(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> Run:
        """Pause a running run."""
        run = await self.get_run(db, run_id)
        self._assert_member(run, user_id)
        if run.status != RunStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Run is not running")
        run.status = RunStatus.PAUSED
        await db.flush()
        return await self.get_run(db, run_id)

    async def resume_run(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> Run:
        """Resume a paused run."""
        run = await self.get_run(db, run_id)
        self._assert_member(run, user_id)
        if run.status != RunStatus.PAUSED:
            raise HTTPException(status_code=400, detail="Run is not paused")
        run.status = RunStatus.RUNNING
        await db.flush()
        return await self.get_run(db, run_id)

    async def stop_run(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> Run:
        """Stop a run and shut down the engine."""
        run = await self.get_run(db, run_id)
        self._assert_member(run, user_id)
        if run.status not in (RunStatus.RUNNING, RunStatus.PAUSED):
            raise HTTPException(status_code=400, detail="Run is not active")

        await self.engine.shutdown_engine(run_id)
        run.status = RunStatus.ABORTED
        await db.flush()
        logger.info("run_stopped", run_id=str(run_id))
        return await self.get_run(db, run_id)

    async def advance_turn(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> dict:
        """Advance to the next turn."""
        run_lock = self._get_run_lock(run_id)
        if run_lock.locked():
            raise HTTPException(status_code=409, detail="Turn advance already in progress")

        async with run_lock:
            run = await self._get_run_for_update(db, run_id)
            if run.status != RunStatus.RUNNING:
                raise HTTPException(status_code=400, detail="Run is not running")

            old_phase = run.current_phase

            try:
                result = await self.engine.advance_turn(run_id)
            except EngineError as e:
                record_engine_error("advance_turn")
                logger.warning("engine_advance_failed", run_id=str(run_id), error=str(e))
                raise HTTPException(status_code=503, detail=str(e))

            # Get full world state from engine
            try:
                state = await self.engine.get_state(run_id)
            except EngineError as e:
                raise HTTPException(status_code=503, detail=f"Failed to fetch world state: {e}")

            if not state or not isinstance(state, dict):
                raise HTTPException(status_code=503, detail="Engine returned an empty world state")

            required_keys = ["layers", "order_parameter", "turn", "phase"]
            if any(key not in state for key in required_keys):
                raise HTTPException(
                    status_code=503, detail="Engine returned an incomplete world state"
                )

            new_turn = result.get("turn", state.get("turn", run.current_turn + 1))
            current_phase = result.get("phase", state.get("phase", run.current_phase))
            events = result.get("events", [])

            # Update run in database
            run.current_turn = new_turn
            run.current_phase = current_phase
            run.world_state = state

            # Persist events from this turn
            for evt in events:
                event = RunEvent(
                    run_id=run_id,
                    turn=new_turn,
                    event_type=evt.get("type", "unknown"),
                    payload=evt,
                )
                db.add(event)

            snapshot_taken = False
            # Take and persist snapshot
            try:
                snapshot_data = await self.engine.take_snapshot(run_id)
                snapshot = RunSnapshot(
                    run_id=run_id,
                    turn=new_turn,
                    state=snapshot_data,
                )
                db.add(snapshot)
                snapshot_taken = True
            except EngineError as e:
                record_engine_error("take_snapshot")
                logger.warning(
                    "snapshot_failed",
                    run_id=str(run_id),
                    turn=new_turn,
                    error=str(e),
                )

            # Pre-generate and persist narrative for this turn
            try:
                narrative_result = await db.execute(
                    select(RunNarrative).where(
                        RunNarrative.run_id == run_id,
                        RunNarrative.turn == new_turn,
                    )
                )
                existing_narrative = narrative_result.scalar_one_or_none()
                if existing_narrative is None:
                    prev_snapshot_result = await db.execute(
                        select(RunSnapshot).where(
                            RunSnapshot.run_id == run_id,
                            RunSnapshot.turn == new_turn - 1,
                        )
                    )
                    prev_snapshot = prev_snapshot_result.scalar_one_or_none()
                    prev_state = prev_snapshot.state if prev_snapshot is not None else state
                    domain_states = state.get("layers", {})
                    prev_domain_states = prev_state.get("layers", {})
                    order_parameter = float(state.get("order_parameter", 0.0))
                    prev_order_parameter = float(prev_state.get("order_parameter", 0.0))
                    narrative = self.narrative_service.generate(
                        turn=new_turn,
                        phase=current_phase,
                        order_parameter=order_parameter,
                        prev_order_parameter=prev_order_parameter,
                        events=[
                            {
                                "event_type": evt.get("type", "unknown"),
                                "description": evt.get("description", ""),
                                "layer": evt.get("layer", ""),
                            }
                            for evt in events
                        ],
                        domain_states=domain_states,
                        prev_domain_states=prev_domain_states,
                        scenario_name=run.scenario.name,
                        scenario_id=str(run.scenario_id),
                    )
                    db.add(
                        RunNarrative(
                            run_id=run_id,
                            turn=new_turn,
                            headline=narrative.headline,
                            body=narrative.body,
                            domain_highlights=[
                                {
                                    "domain": h.domain,
                                    "label": h.label,
                                    "direction": h.direction,
                                    "delta": h.delta,
                                    "note": h.note,
                                }
                                for h in narrative.domain_highlights
                            ],
                            threat_assessment=narrative.threat_assessment,
                            intelligence_note=narrative.intelligence_note,
                        )
                    )
            except Exception as e:
                logger.exception(
                    "turn_narrative_generation_failed",
                    run_id=str(run_id),
                    turn=new_turn,
                    error=str(e),
                )

            turns_advanced_total.inc()
            await db.flush()

            # Broadcast turn_advanced to all WebSocket clients
            turn_message = {
                "type": "turn_advanced",
                "data": {
                    "turn": new_turn,
                    "phase": current_phase,
                    "order_parameter": state.get("order_parameter", 0.0),
                    "world_state": state,
                    "events": events,
                    "phase_changed": old_phase != current_phase,
                },
            }
            await self._broadcast(run_id, turn_message)

            # Broadcast phase_change if escalation phase shifted
            if old_phase != current_phase:
                await self._broadcast(run_id, {
                    "type": "phase_change",
                    "data": {
                        "previous_phase": old_phase,
                        "new_phase": current_phase,
                        "turn": new_turn,
                    },
                })

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
                    from app.observability.metrics import (
                        ai_agent_errors_total,
                        ai_agent_request_duration_seconds,
                    )
                    import time as _time

                    async with httpx.AsyncClient(timeout=30.0) as client:
                        for ai_p in ai_participants:
                            ai_start = _time.monotonic()
                            try:
                                await client.post(
                                    f"{settings.ai_agent_url}/ai/take-turn",
                                    json={
                                        "runId": str(run_id),
                                        "roleId": ai_p.role_id,
                                    },
                                )
                                ai_agent_request_duration_seconds.labels(
                                    endpoint="/ai/take-turn"
                                ).observe(_time.monotonic() - ai_start)
                            except Exception as ai_err:
                                ai_agent_request_duration_seconds.labels(
                                    endpoint="/ai/take-turn"
                                ).observe(_time.monotonic() - ai_start)
                                ai_agent_errors_total.inc()
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
                "snapshot_taken": snapshot_taken,
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
                password_hash="!ai-service-account",
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
        run = await self.create_run(db, run_data, owner_id=user_id)

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

        # Start the run (also fetches and persists initial world state)
        run = await self.start_run(db, run.id, user_id=user_id)

        logger.info(
            "quick_start_created",
            run_id=str(run.id),
            user_id=str(user_id),
            scenario_id=str(scenario_id),
        )
        return run

    async def get_metrics(
        self, db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
    ) -> dict:
        """Get simulation metrics."""
        run = await self.get_run(db, run_id)
        self._assert_member(run, user_id)
        if run.status != RunStatus.RUNNING:
            return {"run_id": str(run.id), "turn": run.current_turn, "metrics": {}}

        try:
            metrics = await self.engine.get_metrics(run_id)
        except EngineError as e:
            record_engine_error("get_metrics")
            logger.warning(
                "engine_metrics_failed",
                run_id=str(run_id),
                error=str(e),
            )
            raise HTTPException(status_code=503, detail=str(e))

        return {
            "run_id": str(run.id),
            "turn": run.current_turn,
            "metrics": metrics,
        }
