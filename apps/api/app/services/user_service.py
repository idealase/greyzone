"""User management service."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate


class UserService:
    """Handles user creation and retrieval."""

    async def create_user(self, db: AsyncSession, data: UserCreate) -> User:
        """Create a new user."""
        # Check for existing username
        result = await db.execute(
            select(User).where(User.username == data.username)
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409, detail="Username already taken"
            )

        user = User(
            username=data.username,
            display_name=data.display_name,
            is_ai=data.is_ai,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def get_user(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        """Get a user by ID."""
        user = await db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def list_users(self, db: AsyncSession) -> list[User]:
        """List all users."""
        result = await db.execute(select(User).order_by(User.created_at))
        return list(result.scalars().all())
