"""Authorization helpers for run-scoped access control."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.run import Run, RunParticipant


async def ensure_run_member(
    db: AsyncSession,
    run_id: uuid.UUID,
    user_id: uuid.UUID,
    require_participant: bool = False,
) -> tuple[Run, RunParticipant | None]:
    """Ensure the user owns or participates in the run."""
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

    participant = next((p for p in run.participants if p.user_id == user_id), None)
    if participant is None and run.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized for this run")
    if require_participant and participant is None:
        raise HTTPException(status_code=403, detail="Participation required for this run")

    return run, participant
