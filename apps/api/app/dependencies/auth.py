"""Authentication helpers for request-scoped user context."""

from __future__ import annotations

import uuid

from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.user import User


async def get_current_user(
    db: AsyncSession = Depends(get_session),
    header_user_id: uuid.UUID | None = Header(default=None, alias="X-User-Id"),
    query_user_id: uuid.UUID | None = Query(default=None, alias="user_id"),
) -> User:
    """Resolve the current user from header or query and ensure they exist."""
    user_id = header_user_id or query_user_id
    if user_id is None:
        raise HTTPException(status_code=401, detail="User authentication required")

    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
