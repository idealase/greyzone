"""Action schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActionSubmit(BaseModel):
    user_id: uuid.UUID
    role_id: str | None = None
    action_type: str
    action_payload: dict = {}
    target_domain: str | None = None
    target_actor: str | None = None
    intensity: float | None = None


class ActionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    user_id: uuid.UUID
    turn: int
    role_id: str
    action_type: str
    action_payload: dict
    validation_result: str
    applied_effects: dict
    created_at: datetime


class LegalActionsResponse(BaseModel):
    run_id: uuid.UUID
    role_id: str
    turn: int
    actions: list[dict]
