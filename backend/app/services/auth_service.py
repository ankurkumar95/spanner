from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..models import User
from ..utils.security import verify_password, create_token
from ..config import settings
from fastapi import HTTPException, status

async def authenticate_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(
        select(User).where(User.email == email).options(selectinload(User.roles))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

def create_tokens(user: User):
    role_names = [role.name for role in user.roles]
    access_token = create_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        roles=role_names
    )
    refresh_token = create_token(
        subject=user.id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    return access_token, refresh_token
