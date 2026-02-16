"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class AccessToken(BaseModel):
    """Access token response schema."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User information response schema."""
    id: str
    email: str
    name: str
    status: str
    roles: list[str]


class ForgotPasswordRequest(BaseModel):
    """Forgot password request schema."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request schema."""
    token: str
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class MessageResponse(BaseModel):
    """Generic message response schema."""
    message: str
