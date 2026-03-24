"""Action submission endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.action import ActionResult, ActionSubmit, LegalActionsResponse
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
    role_id: str = Query(...),
    db: AsyncSession = Depends(get_session),
    svc: ActionService = Depends(get_action_service),
) -> dict:
    return await svc.get_legal_actions(db, run_id, role_id)


@router.post("/actions", response_model=ActionResult, status_code=201)
async def submit_action(
    run_id: uuid.UUID,
    data: ActionSubmit,
    db: AsyncSession = Depends(get_session),
    svc: ActionService = Depends(get_action_service),
) -> object:
    return await svc.submit_action(db, run_id, data)


@router.post("/advance-turn")
async def advance_turn(
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
) -> list:
    return await svc.get_action_history(db, run_id)
