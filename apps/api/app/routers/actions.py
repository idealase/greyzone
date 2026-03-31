"""Action submission endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas.action import ActionResult, ActionSubmit, LegalActionsResponse
from app.services.access_control import ensure_run_member
from app.services.action_service import ActionService
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager

router = APIRouter(prefix="/api/v1/runs/{run_id}", tags=["actions"])

_action_service: ActionService | None = None
_run_manager: RunManager | None = None


def set_services(engine: EngineBridge, run_mgr: RunManager) -> None:
    global _action_service, _run_manager
    _action_service = ActionService(engine)
    _run_manager = run_mgr


def get_action_service() -> ActionService:
    assert _action_service is not None
    return _action_service


def get_run_manager() -> RunManager:
    assert _run_manager is not None
    return _run_manager


@router.get("/legal-actions", response_model=LegalActionsResponse)
async def get_legal_actions(
    run_id: uuid.UUID,
    role_id: str | None = Query(None),
    side: str | None = Query(None),
    db: AsyncSession = Depends(get_session),
    svc: ActionService = Depends(get_action_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    run, participant = await ensure_run_member(
        db, run_id, current_user.id, require_participant=True
    )
    if participant is None:
        raise HTTPException(status_code=403, detail="Only participants may request actions")
    # Map side shorthand to role_id if role_id not provided
    if not role_id and side:
        side_map = {"blue": "blue_commander", "red": "red_commander"}
        role_id = side_map.get(side.lower(), side)
    if participant and role_id and participant.role_id != role_id:
        raise HTTPException(status_code=403, detail="Role does not belong to user")
    if participant and not role_id:
        role_id = participant.role_id
    if not role_id:
        raise HTTPException(status_code=400, detail="Either role_id or side query parameter is required")
    return await svc.get_legal_actions(db, run_id, role_id, user_id=current_user.id)


@router.post("/actions", response_model=ActionResult, status_code=201)
async def submit_action(
    run_id: uuid.UUID,
    data: ActionSubmit,
    db: AsyncSession = Depends(get_session),
    svc: ActionService = Depends(get_action_service),
    current_user: User = Depends(get_current_user),
) -> object:
    run, participant = await ensure_run_member(
        db, run_id, current_user.id, require_participant=True
    )
    if participant is None:
        raise HTTPException(status_code=403, detail="Only participants may submit actions")
    if data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="User mismatch")
    if data.role_id and data.role_id != participant.role_id:
        raise HTTPException(status_code=403, detail="Role does not belong to user")
    if not data.role_id:
        data.role_id = participant.role_id
    _ = run  # run is loaded for authorization; ActionService handles run status
    return await svc.submit_action(db, run_id, data)


@router.post("/advance")
@router.post("/advance-turn")
async def advance_turn(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> dict:
    _, participant = await ensure_run_member(
        db, run_id, current_user.id, require_participant=True
    )
    if participant is None:
        raise HTTPException(status_code=403, detail="Only participants may advance turns")
    return await mgr.advance_turn(db, run_id, user_id=current_user.id)


@router.post("/advance-turn", include_in_schema=False)
async def advance_turn_legacy(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
) -> dict:
    return await mgr.advance_turn(db, run_id)


@router.get("/actions", response_model=list[ActionResult])
async def get_action_history(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    svc: ActionService = Depends(get_action_service),
    current_user: User = Depends(get_current_user),
) -> list:
    await ensure_run_member(db, run_id, current_user.id)
    return await svc.get_action_history(db, run_id)
