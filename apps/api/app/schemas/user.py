"""User schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    display_name: str
    email: str | None = None
    password: str
    is_ai: bool = False


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str
    email: str | None = None
    is_active: bool
    is_ai: bool
    created_at: datetime
