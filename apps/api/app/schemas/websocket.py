"""WebSocket message schemas."""

from pydantic import BaseModel


class WebSocketMessage(BaseModel):
    type: str  # e.g. "state_update", "event", "turn_advance", "error"
    payload: dict = {}
