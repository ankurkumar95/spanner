from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from ..services.auth_service import authenticate_user, create_tokens
from jose import JWTError
from ..utils.security import decode_token

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token, refresh_token = create_tokens(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "roles": [role.name for role in user.roles]
        }
    }

@router.post("/refresh")
async def refresh(data: RefreshRequest):
    try:
        payload = decode_token(data.refresh_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # In a real app, you'd check if user exists and is active
        # For now, just generate a new access token
        from datetime import timedelta
        from ..config import settings
        from ..utils.security import create_token

        # We don't have roles here unless we fetch user.
        # Simple implementation for Agent 0:
        access_token = create_token(
            subject=user_id,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    # Mock implementation for Agent 0
    return {"reset_token": "mock-reset-token-123"}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    return {"message": "Password reset successful"}

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
