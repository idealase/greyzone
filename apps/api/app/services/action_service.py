"""Action submission and validation service."""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.action import UserActionLog
from app.models.run import Run, RunParticipant, RunStatus
from app.schemas.action import ActionSubmit
from app.services.engine_bridge import EngineBridge, EngineError
from app.observability.metrics import actions_submitted_total, record_engine_error

logger = structlog.get_logger()


class ActionService:
    """Handles action validation, submission, and logging."""

    def __init__(self, engine: EngineBridge) -> None:
        self.engine = engine

    async def get_legal_actions(
        self, db: AsyncSession, run_id: uuid.UUID, role_id: str
    ) -> dict:
        """Get legal actions for a role in a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Run is not running")

        try:
            actions = await self.engine.get_legal_actions(run_id, role_id)
        except EngineError as e:
            raise HTTPException(status_code=503, detail=str(e))

        return {
            "run_id": str(run_id),
            "role_id": role_id,
            "turn": run.current_turn,
            "actions": actions,
        }

    async def submit_action(
        self, db: AsyncSession, run_id: uuid.UUID, data: ActionSubmit
    ) -> UserActionLog:
        """Validate and submit an action."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Run is not running")

        # If role_id is missing, look it up from RunParticipant
        if not data.role_id:
            result = await db.execute(
                select(RunParticipant).where(
                    RunParticipant.run_id == run_id,
                    RunParticipant.user_id == data.user_id,
                )
            )
            participant = result.scalar_one_or_none()
            if participant is None:
                raise HTTPException(
                    status_code=403,
                    detail="User is not a participant in this run",
                )
            data.role_id = participant.role_id
        else:
            # Verify the user owns the role
            result = await db.execute(
                select(RunParticipant).where(
                    RunParticipant.run_id == run_id,
                    RunParticipant.user_id == data.user_id,
                    RunParticipant.role_id == data.role_id,
                )
            )
            participant = result.scalar_one_or_none()
            if participant is None:
                raise HTTPException(
                    status_code=403,
                    detail=f"User does not have role '{data.role_id}' in this run",
                )

        # Build action_payload from individual fields if payload is empty
        if not data.action_payload:
            payload: dict[str, Any] = {}
            if data.target_domain is not None:
                payload["target_domain"] = data.target_domain
            if data.target_actor is not None:
                payload["target_actor"] = data.target_actor
            if data.intensity is not None:
                payload["intensity"] = data.intensity
            if payload:
                data.action_payload = payload

        # Build action matching Rust engine's Action struct
        engine_action = {
            "id": str(uuid.uuid4()),
            "actor_id": data.target_actor or str(uuid.uuid4()),
            "role_id": data.role_id,
            "action_type": data.action_type,
            "target_layer": data.target_domain or "Cyber",
            "target_actor_id": None,
            "parameters": {"intensity": data.intensity or data.action_payload.get("intensity", 0.5)},
            "turn": run.current_turn,
        }
        try:
            engine_result = await self.engine.submit_action(run_id, engine_action)
        except EngineError as e:
            record_engine_error("submit_action")
            logger.warning(
                "engine_action_submit_failed",
                run_id=str(run_id),
                role_id=data.role_id,
                action_type=data.action_type,
                error=str(e),
            )
            raise HTTPException(status_code=503, detail=str(e))

        # Engine may return a dict with validation/effects, a list of effects, or None
        if isinstance(engine_result, dict):
            validation = engine_result.get("validation", "accepted")
            effects = engine_result.get("effects", {})
        elif isinstance(engine_result, list):
            validation = "accepted"
            effects = {"effects": engine_result}
        else:
            validation = "accepted"
            effects = {}

        # Log the action
        action_log = UserActionLog(
            run_id=run_id,
            user_id=data.user_id,
            turn=run.current_turn,
            role_id=data.role_id,
            action_type=data.action_type,
            action_payload=data.action_payload,
            validation_result=validation,
            applied_effects=effects,
        )
        db.add(action_log)
        await db.flush()
        await db.refresh(action_log)
        actions_submitted_total.inc()

        if validation != "accepted":
            raise HTTPException(
                status_code=422, detail=f"Action rejected: {validation}"
            )

        logger.info(
            "action_submitted",
            run_id=str(run_id),
            role_id=data.role_id,
            action_type=data.action_type,
        )
        return action_log

    async def get_action_history(
        self, db: AsyncSession, run_id: uuid.UUID
    ) -> list[UserActionLog]:
        """Get action history for a run."""
        result = await db.execute(
            select(UserActionLog)
            .where(UserActionLog.run_id == run_id)
            .order_by(UserActionLog.created_at)
        )
        return list(result.scalars().all())
