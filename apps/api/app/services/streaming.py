"""WebSocket connection manager for real-time updates."""

from __future__ import annotations

import json
import uuid

import structlog
from fastapi import WebSocket

logger = structlog.get_logger()


class ConnectionManager:
    """Manages WebSocket connections for real-time run updates."""

    def __init__(self) -> None:
        # run_id -> {user_id: websocket}
        self.active_connections: dict[uuid.UUID, dict[str, WebSocket]] = {}

    async def connect(
        self, run_id: uuid.UUID, user_id: str, websocket: WebSocket
    ) -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = {}
        self.active_connections[run_id][user_id] = websocket
        logger.info("ws_connected", run_id=str(run_id), user_id=user_id)
        from app.observability.metrics import websocket_connections_active
        websocket_connections_active.inc()

    async def disconnect(self, run_id: uuid.UUID, user_id: str) -> None:
        """Remove a WebSocket connection."""
        if run_id in self.active_connections:
            self.active_connections[run_id].pop(user_id, None)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]
        logger.info("ws_disconnected", run_id=str(run_id), user_id=user_id)
        from app.observability.metrics import websocket_connections_active
        websocket_connections_active.dec()

    async def broadcast_to_run(
        self, run_id: uuid.UUID, message: dict
    ) -> None:
        """Send a message to all connections in a run."""
        connections = self.active_connections.get(run_id, {})
        dead: list[str] = []
        for user_id, ws in connections.items():
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(user_id)
        for uid in dead:
            await self.disconnect(run_id, uid)

    async def send_to_user(
        self, run_id: uuid.UUID, user_id: str, message: dict
    ) -> None:
        """Send a message to a specific user in a run."""
        connections = self.active_connections.get(run_id, {})
        ws = connections.get(user_id)
        if ws is not None:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                await self.disconnect(run_id, user_id)

    async def send_to_role(
        self, run_id: uuid.UUID, role_id: str, message: dict
    ) -> None:
        """Send a message to a specific role. Placeholder -- needs role->user mapping."""
        # In a full implementation, this would look up which user has the role
        # and send to that user's websocket. For now, broadcast.
        await self.broadcast_to_run(run_id, message)
