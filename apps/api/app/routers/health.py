"""Health and metrics endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.observability.metrics import generate_metrics_response
from app.services.engine_bridge import EngineBridge

router = APIRouter(prefix="/api/v1", tags=["health"])
metrics_router = APIRouter(tags=["metrics"])

_engine_bridge: EngineBridge | None = None


def set_services(engine_bridge: EngineBridge) -> None:
    """Wire shared services."""
    global _engine_bridge
    _engine_bridge = engine_bridge


def _engine_status() -> dict:
    """Summarize engine subprocess health."""
    if _engine_bridge is None:
        return {"status": "unknown", "active_runs": 0, "processes": {}}
    processes = _engine_bridge.get_process_status()
    is_healthy = all(status == "running" for status in processes.values())
    return {
        "status": "ok" if is_healthy else "degraded",
        "active_runs": len(processes),
        "processes": processes,
    }


async def _database_status(db: AsyncSession) -> dict:
    """Execute a lightweight query to ensure connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - surfaced in health responses
        return {"status": "error", "error": str(exc)}


@router.get("/health")
async def health_check(
    request: Request, db: AsyncSession = Depends(get_session)
) -> dict:
    database = await _database_status(db)
    engine = _engine_status()
    healthy = database["status"] == "ok" and engine["status"] in {"ok", "unknown"}

    request_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
    return {
        "status": "ok" if healthy else "degraded",
        "service": "greyzone-api",
        "database": database,
        "engine": engine,
        "request_id": request_id,
    }


@metrics_router.get("/metrics", include_in_schema=False)
async def metrics() -> Response:
    """Prometheus metrics endpoint."""
    return generate_metrics_response()
