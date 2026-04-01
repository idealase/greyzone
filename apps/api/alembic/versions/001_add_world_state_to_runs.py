"""Add world_state column to runs table.

Revision ID: 001
Revises:
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("runs", sa.Column("world_state", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("runs", "world_state")
