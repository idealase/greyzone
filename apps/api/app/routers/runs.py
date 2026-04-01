"""Run lifecycle endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.auth import decode_access_token, get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas.metrics import MetricsResponse
from app.schemas.run import (
    QuickStartRequest,
    RunCreate,
    RunList,
    RunParticipantCreate,
    RunParticipantRead,
    RunRead,
    RunStateResponse,
)
from app.services.access_control import ensure_run_member
from app.services.engine_bridge import EngineBridge
from app.services.run_manager import RunManager
from app.services.streaming import ConnectionManager

router = APIRouter(prefix="/api/v1/runs", tags=["runs"])
ws_router = APIRouter(prefix="/api/v1/runs", tags=["runs-ws"])

# These will be overridden by the app lifespan via dependency injection
_engine_bridge: EngineBridge | None = None
_run_manager: RunManager | None = None
_ws_manager: ConnectionManager | None = None


def set_services(
    engine: EngineBridge, run_mgr: RunManager, ws_mgr: ConnectionManager
) -> None:
    global _engine_bridge, _run_manager, _ws_manager
    _engine_bridge = engine
    _run_manager = run_mgr
    _ws_manager = ws_mgr


def get_run_manager() -> RunManager:
    assert _run_manager is not None
    return _run_manager


def get_ws_manager() -> ConnectionManager:
    assert _ws_manager is not None
    return _ws_manager


@router.post("", response_model=RunRead, status_code=201)
async def create_run(
    data: RunCreate,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.create_run(db, data, owner_id=current_user.id)


@router.get("", response_model=RunList)
async def list_runs(
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> dict:
    items = await mgr.list_runs(db, user_id=current_user.id)
    return {"items": items, "total": len(items)}


@router.post("/quick-start", response_model=RunRead, status_code=201)
async def quick_start(
    data: QuickStartRequest,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    if data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="User mismatch for quick start")
    return await mgr.quick_start(
        db,
        user_id=current_user.id,
        scenario_id=data.scenario_id,
        name=data.name,
        seed=data.seed,
    )


@router.get("/{run_id}", response_model=RunRead)
async def get_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    run, _ = await ensure_run_member(db, run_id, current_user.id)
    return run


@router.post("/{run_id}/join", response_model=RunParticipantRead, status_code=201)
async def join_run(
    run_id: uuid.UUID,
    data: RunParticipantCreate,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.join_run(db, run_id, data, requester_id=current_user.id)


@router.post("/{run_id}/start", response_model=RunRead)
async def start_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.start_run(db, run_id, user_id=current_user.id)


@router.post("/{run_id}/pause", response_model=RunRead)
async def pause_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.pause_run(db, run_id, user_id=current_user.id)


@router.post("/{run_id}/resume", response_model=RunRead)
async def resume_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.resume_run(db, run_id, user_id=current_user.id)


@router.post("/{run_id}/stop", response_model=RunRead)
async def stop_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> object:
    return await mgr.stop_run(db, run_id, user_id=current_user.id)


@router.get("/{run_id}/state", response_model=RunStateResponse)
async def get_run_state(
    run_id: uuid.UUID,
    role_id: str | None = Query(None),
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> dict:
    return await mgr.get_run_state(db, run_id, role_id, user_id=current_user.id)


@router.get("/{run_id}/metrics", response_model=MetricsResponse)
async def get_run_metrics(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    mgr: RunManager = Depends(get_run_manager),
    current_user: User = Depends(get_current_user),
) -> dict:
    return await mgr.get_metrics(db, run_id, user_id=current_user.id)


@ws_router.websocket("/{run_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    run_id: uuid.UUID,
    token: str | None = Query(None),
    db: AsyncSession = Depends(get_session),
) -> None:
    # WebSocket cannot use HTTPBearer, so authenticate via query param token
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = decode_access_token(token)
        user_id_val = uuid.UUID(payload["sub"])
    except (HTTPException, ValueError):
        await websocket.close(code=1008)
        return

    user = await db.get(User, user_id_val)
    if user is None or not user.is_active:
        await websocket.close(code=1008)
        return

    try:
        await ensure_run_member(db, run_id, user.id)
    except HTTPException:
        await websocket.close(code=1008)
        return

    ws_mgr = get_ws_manager()
    await ws_mgr.connect(run_id, str(user.id), websocket)
    try:
        while True:
            data = await websocket.receive_text()
            _ = data
    except WebSocketDisconnect:
        await ws_mgr.disconnect(run_id, str(user.id))
