"""
Authentication endpoints for login, token refresh, and password management.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_active_user
from app.schemas.auth import (
    Token,
    TokenRefresh,
    AccessToken,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with email and password, returning access and refresh tokens.

    The username field in OAuth2PasswordRequestForm is used for email.
    """
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)

    if user is None:
        logger.warning(f"Failed login attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens with user_id as subject
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    logger.info(f"User logged in successfully: {user['email']} (ID: {user['id']})")

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/refresh", response_model=AccessToken, status_code=status.HTTP_200_OK)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """
    Exchange a valid refresh token for a new access token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token_data.refresh_token)
        user_id: str | None = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        # Validate token type
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Refresh token required.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except JWTError as e:
        logger.warning(f"Invalid refresh token: {str(e)}")
        raise credentials_exception

    # Verify user still exists and is active
    from uuid import UUID
    user = await auth_service.get_user_by_id(db, UUID(user_id))

    if user is None or user["status"] != "active":
        logger.warning(f"Refresh token for inactive/non-existent user: {user_id}")
        raise credentials_exception

    # Create new access token
    access_token = create_access_token(data={"sub": user_id})

    logger.info(f"Access token refreshed for user: {user['email']} (ID: {user_id})")

    return AccessToken(
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get current authenticated user information.

    Requires valid access token in Authorization header.
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        status=current_user["status"],
        roles=current_user["roles"]
    )


@router.post("/forgot-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate password reset process for a user.

    This is a placeholder implementation that always returns success.
    In production, this would:
    1. Generate a secure reset token
    2. Store token with expiration in database
    3. Send password reset email to user
    """
    # Check if user exists (but don't reveal this information to prevent email enumeration)
    user = await auth_service.get_user_by_email(db, request_data.email)

    if user:
        logger.info(f"Password reset requested for user: {request_data.email}")
        # TODO: Generate reset token and send email
    else:
        logger.warning(f"Password reset requested for non-existent email: {request_data.email}")

    # Always return success to prevent email enumeration attacks
    return MessageResponse(
        message="If the email exists in our system, you will receive password reset instructions."
    )


@router.post("/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def reset_password(
    request_data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset user password using a valid reset token.

    This is a placeholder implementation.
    In production, this would:
    1. Validate the reset token
    2. Check token expiration
    3. Update user password
    4. Invalidate the reset token
    """
    # TODO: Implement actual password reset logic with token validation
    logger.info(f"Password reset attempted with token: {request_data.token[:10]}...")

    # Placeholder response
    return MessageResponse(
        message="Password reset functionality is not yet implemented. Please contact an administrator."
    )
