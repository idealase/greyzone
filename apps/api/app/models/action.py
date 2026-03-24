"""User Action Log model."""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserActionLog(Base):
    __tablename__ = "user_action_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("runs.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    turn: Mapped[int]
    role_id: Mapped[str] = mapped_column(String(100))
    action_type: Mapped[str] = mapped_column(String(100))
    action_payload: Mapped[dict] = mapped_column(JSONB)
    validation_result: Mapped[str] = mapped_column(String(50))
    applied_effects: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
