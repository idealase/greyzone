"""AI audit trail service."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import AiActionLog
from app.models.run import Run


class AiAuditService:
    """Provides access to AI action audit logs."""

    async def get_audit_log(
        self, db: AsyncSession, run_id: uuid.UUID
    ) -> list[AiActionLog]:
        """Get all AI action logs for a run."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")

        result = await db.execute(
            select(AiActionLog)
            .where(AiActionLog.run_id == run_id)
            .order_by(AiActionLog.turn, AiActionLog.created_at)
        )
        return list(result.scalars().all())

    async def get_audit_for_turn(
        self, db: AsyncSession, run_id: uuid.UUID, turn: int
    ) -> list[AiActionLog]:
        """Get AI action logs for a specific turn."""
        run = await db.get(Run, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")

        result = await db.execute(
            select(AiActionLog).where(
                AiActionLog.run_id == run_id,
                AiActionLog.turn == turn,
            )
        )
        return list(result.scalars().all())
