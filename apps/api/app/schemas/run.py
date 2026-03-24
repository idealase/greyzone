"""Run schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RunCreate(BaseModel):
    scenario_id: uuid.UUID
    name: str
    config: dict = {}
    seed: int | None = None


class RunParticipantCreate(BaseModel):
    user_id: uuid.UUID
    role_id: str
    is_ai: bool = False


class RunParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    user_id: uuid.UUID
    role_id: str
    is_ai: bool
    joined_at: datetime


class RunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    scenario_id: uuid.UUID
    name: str
    status: str
    seed: int
    current_turn: int
    current_phase: str
    config: dict
    created_at: datetime
    updated_at: datetime
    participants: list[RunParticipantRead] = []


class RunList(BaseModel):
    items: list[RunRead]
    total: int


class RunStateResponse(BaseModel):
    run_id: uuid.UUID
    turn: int
    phase: str
    state: dict
    role_id: str | None = None
