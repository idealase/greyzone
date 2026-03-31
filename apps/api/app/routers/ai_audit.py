"""AI audit trail endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.services.access_control import ensure_run_member
from app.services.ai_audit_service import AiAuditService

router = APIRouter(prefix="/api/v1/runs/{run_id}/ai-audit", tags=["ai-audit"])

_audit_service = AiAuditService()


@router.get("")
async def get_audit_log(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    items = await _audit_service.get_audit_log(db, run_id)
    return {
        "items": [
            {
                "id": str(a.id),
                "run_id": str(a.run_id),
                "turn": a.turn,
                "role_id": a.role_id,
                "prompt_summary": a.prompt_summary,
                "tool_calls": a.tool_calls,
                "selected_action": a.selected_action,
                "rationale": a.rationale,
                "validation_result": a.validation_result,
                "applied_effects": a.applied_effects,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ],
        "total": len(items),
    }


@router.get("/{turn}")
async def get_audit_for_turn(
    run_id: uuid.UUID,
    turn: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    items = await _audit_service.get_audit_for_turn(db, run_id, turn)
    return {
        "items": [
            {
                "id": str(a.id),
                "run_id": str(a.run_id),
                "turn": a.turn,
                "role_id": a.role_id,
                "prompt_summary": a.prompt_summary,
                "tool_calls": a.tool_calls,
                "selected_action": a.selected_action,
                "rationale": a.rationale,
                "validation_result": a.validation_result,
                "applied_effects": a.applied_effects,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ],
        "total": len(items),
    }
