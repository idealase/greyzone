"""Authentication schemas."""

from pydantic import BaseModel

from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    username: str
    display_name: str
    email: str | None = None
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead
