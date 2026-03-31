"""Run schemas."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


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
    username: str = ""
    display_name: str = ""
    is_human: bool = True
    is_online: bool = False
    role: str = ""

    @model_validator(mode="before")
    @classmethod
    def _populate_computed(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            # ORM object
            obj = data
            d: dict[str, Any] = {}
            for field in ("id", "run_id", "user_id", "role_id", "is_ai", "joined_at"):
                d[field] = getattr(obj, field, None)
            d["is_human"] = not getattr(obj, "is_ai", False)
            d["role"] = getattr(obj, "role_id", "")
            user = getattr(obj, "user", None)
            if user is not None:
                d["username"] = getattr(user, "username", "")
                d["display_name"] = getattr(user, "display_name", "")
            return d
        # Already a dict (e.g. from JSON)
        if "is_human" not in data and "is_ai" in data:
            data["is_human"] = not data["is_ai"]
        if "role" not in data and "role_id" in data:
            data["role"] = data["role_id"]
        return data


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
    scenario_name: str = ""
    order_parameter: float = 0.0
    world_state: dict | None = None
    participant_count: int = 0

    @model_validator(mode="before")
    @classmethod
    def _populate_computed(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            # ORM object
            obj = data
            d: dict[str, Any] = {}
            for field in (
                "id", "scenario_id", "name", "seed",
                "current_turn", "current_phase", "config",
                "created_at", "updated_at", "participants",
            ):
                d[field] = getattr(obj, field, None)
            # Map DB "running" to frontend "in_progress"
            status = getattr(obj, "status", None)
            status_str: str = str(getattr(status, 'value', status))
            d["status"] = "in_progress" if status_str == "running" else status_str
            scenario = getattr(obj, "scenario", None)
            if scenario is not None:
                d["scenario_name"] = getattr(scenario, "name", "")
            participants = getattr(obj, "participants", None)
            d["participant_count"] = len(participants) if participants else 0
            return d
        # Already a dict
        if "scenario_name" not in data:
            scenario = data.get("scenario")
            if scenario and isinstance(scenario, dict):
                data["scenario_name"] = scenario.get("name", "")
        if "participant_count" not in data:
            participants = data.get("participants")
            data["participant_count"] = len(participants) if participants else 0
        return data


class RunList(BaseModel):
    items: list[RunRead]
    total: int


class QuickStartRequest(BaseModel):
    user_id: uuid.UUID
    scenario_id: uuid.UUID
    name: str | None = None
    seed: int | None = None


class RunStateResponse(BaseModel):
    run_id: uuid.UUID
    turn: int
    phase: str
    state: dict
    role_id: str | None = None
