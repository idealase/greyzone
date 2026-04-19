"""JWT authentication middleware and dependencies."""

import uuid

import structlog
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_session
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    # Service-to-service auth via internal service key + X-User-Id header
    service_key = request.headers.get("X-Service-Key")
    if service_key:
        if service_key != settings.internal_service_key:
            raise HTTPException(status_code=401, detail="Invalid service key")
        user_id_header = request.headers.get("X-User-Id")
        if not user_id_header:
            raise HTTPException(
                status_code=401, detail="X-User-Id header required with service key"
            )
        try:
            user_id = uuid.UUID(user_id_header)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="Invalid X-User-Id") from exc
        user = await db.get(User, user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found")
        request.state.user = user
        structlog.contextvars.bind_contextvars(user_id=str(user.id))
        return user

    # Standard JWT Bearer auth
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid token")
    request.state.user = user
    structlog.contextvars.bind_contextvars(user_id=str(user.id))
    return user
