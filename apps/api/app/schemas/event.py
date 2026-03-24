"""Event schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    turn: int
    event_type: str
    payload: dict
    visibility: str
    created_at: datetime


class EventList(BaseModel):
    items: list[EventRead]
    total: int
