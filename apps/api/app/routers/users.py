"""User endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])

_user_service = UserService()


@router.post("", response_model=UserRead, status_code=201)
async def create_user(
    data: UserCreate, db: AsyncSession = Depends(get_session)
) -> object:
    return await _user_service.create_user(db, data)


@router.get("", response_model=list[UserRead])
async def list_users(db: AsyncSession = Depends(get_session)) -> list:
    return await _user_service.list_users(db)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID, db: AsyncSession = Depends(get_session)
) -> object:
    return await _user_service.get_user(db, user_id)
