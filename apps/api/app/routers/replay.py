"""Replay and event history endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas.event import EventList
from app.services.access_control import ensure_run_member
from app.services.engine_bridge import EngineBridge
from app.services.replay_service import ReplayService

router = APIRouter(prefix="/api/v1/runs/{run_id}", tags=["replay"])

_replay_service: ReplayService | None = None


def set_services(engine: EngineBridge) -> None:
    global _replay_service
    _replay_service = ReplayService(engine)


def get_replay_service() -> ReplayService:
    assert _replay_service is not None
    return _replay_service


@router.get("/replay")
async def get_replay(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    svc: ReplayService = Depends(get_replay_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    return await svc.get_replay(db, run_id)


@router.get("/replay/{turn}")
async def get_replay_at_turn(
    run_id: uuid.UUID,
    turn: int,
    db: AsyncSession = Depends(get_session),
    svc: ReplayService = Depends(get_replay_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    return await svc.replay_to_turn(db, run_id, turn)


@router.get("/events", response_model=EventList)
async def get_events(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    svc: ReplayService = Depends(get_replay_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    items = await svc.get_events(db, run_id)
    return {"items": items, "total": len(items)}


@router.get("/snapshots")
async def get_snapshots(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    svc: ReplayService = Depends(get_replay_service),
    current_user: User = Depends(get_current_user),
) -> dict:
    await ensure_run_member(db, run_id, current_user.id)
    snapshots = await svc.get_snapshots(db, run_id)
    return {
        "items": [
            {
                "id": str(s.id),
                "run_id": str(s.run_id),
                "turn": s.turn,
                "state": s.state,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in snapshots
        ],
        "total": len(snapshots),
    }
