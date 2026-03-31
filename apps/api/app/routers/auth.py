"""Authentication endpoints."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_session
from app.schemas.auth import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest
from app.schemas.user import UserCreate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/api/auth", tags=["auth"])

_user_service = UserService()
_DUMMY_PASSWORD_HASH = "$2b$12$OEmvP5MyoQx14xgf20vWweVwSqXn42zsA4af8GkVkV2AlW4Bx5zue"


def _create_token(subject: str, token_type: str, expires_minutes: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _decode_token(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("type") != expected_type or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    data: RegisterRequest, db: AsyncSession = Depends(get_session)
) -> AuthResponse:
    user = await _user_service.create_user(
        db,
        UserCreate(
            username=data.username,
            display_name=data.display_name,
            email=data.email,
            password=data.password,
            is_ai=False,
        ),
    )
    access_token = _create_token(
        str(user.id), "access", settings.access_token_expire_minutes
    )
    refresh_token = _create_token(
        str(user.id), "refresh", settings.refresh_token_expire_minutes
    )
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(
    data: LoginRequest, db: AsyncSession = Depends(get_session)
) -> AuthResponse:
    user = await _user_service.get_user_by_username(db, data.username)
    password_hash = user.password_hash if user is not None else _DUMMY_PASSWORD_HASH
    valid_password = _user_service.verify_password(data.password, password_hash)
    if user is None or not valid_password or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = _create_token(
        str(user.id), "access", settings.access_token_expire_minutes
    )
    refresh_token = _create_token(
        str(user.id), "refresh", settings.refresh_token_expire_minutes
    )
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    data: RefreshRequest, db: AsyncSession = Depends(get_session)
) -> AuthResponse:
    payload = _decode_token(data.refresh_token, "refresh")
    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = await _user_service.get_user(db, user_id)
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    access_token = _create_token(
        str(user.id), "access", settings.access_token_expire_minutes
    )
    refresh_token = _create_token(
        str(user.id), "refresh", settings.refresh_token_expire_minutes
    )
    return AuthResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post("/logout", status_code=204)
async def logout() -> None:
    return None
