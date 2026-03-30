"""Run and RunParticipant models."""

from __future__ import annotations

import enum
import random
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Enum as SAEnum, ForeignKey, String, func
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.event import RunEvent, RunSnapshot
    from app.models.scenario import Scenario
    from app.models.user import User


class RunStatus(str, enum.Enum):
    CREATED = "created"
    LOBBY = "lobby"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABORTED = "aborted"


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scenarios.id"))
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[RunStatus] = mapped_column(
        SAEnum(
            RunStatus,
            name="run_status",
            create_type=False,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=RunStatus.CREATED,
    )
    seed: Mapped[int] = mapped_column(BigInteger, default=lambda: random.randint(0, 2**63))
    current_turn: Mapped[int] = mapped_column(default=0)
    current_phase: Mapped[str] = mapped_column(String(50), default="CompetitiveNormality")
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    scenario: Mapped[Scenario] = relationship(back_populates="runs")
    participants: Mapped[list[RunParticipant]] = relationship(back_populates="run")
    events: Mapped[list[RunEvent]] = relationship(back_populates="run")
    snapshots: Mapped[list[RunSnapshot]] = relationship(back_populates="run")


class RunParticipant(Base):
    __tablename__ = "run_participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("runs.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[str] = mapped_column(String(100))
    is_ai: Mapped[bool] = mapped_column(default=False)
    joined_at: Mapped[datetime] = mapped_column(default=func.now())

    run: Mapped[Run] = relationship(back_populates="participants")
    user: Mapped[User] = relationship()
