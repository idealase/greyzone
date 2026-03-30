"""RunNarrative model — persists AI-generated turn narratives."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.run import Run


class RunNarrative(Base):
    __tablename__ = "run_narratives"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("runs.id"), nullable=False)
    turn: Mapped[int] = mapped_column(Integer, nullable=False)
    headline: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    domain_highlights: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    threat_assessment: Mapped[str] = mapped_column(String, nullable=False)
    intelligence_note: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    generated_at: Mapped[datetime] = mapped_column(default=func.now())

    __table_args__ = (UniqueConstraint("run_id", "turn"),)

    run: Mapped[Run] = relationship(back_populates="narratives")
