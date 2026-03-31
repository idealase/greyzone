"""User management service."""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
            email=data.email,
            password_hash=pwd_context.hash(data.password),
            is_active=True,
            is_ai=data.is_ai,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def get_user_by_username(self, db: AsyncSession, username: str) -> User | None:
        """Get a user by username."""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    def verify_password(self, plain_password: str, password_hash: str) -> bool:
        """Verify a plain password against hash."""
        return pwd_context.verify(plain_password, password_hash)

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
