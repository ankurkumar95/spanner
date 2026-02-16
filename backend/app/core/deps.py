"""
FastAPI dependency injection utilities for authentication and authorization.
"""

from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import get_db
from app.core.security import decode_token

# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Extract and validate current user from JWT token.

    Args:
        token: JWT access token from Authorization header
        db: Database session

    Returns:
        User dictionary with id, email, name, status, and roles

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id_str: str | None = payload.get("sub")

        if user_id_str is None:
            raise credentials_exception

        # Validate token type
        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Access token required.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Convert user_id string to UUID
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Fetch user from database with roles
    query = text("""
        SELECT
            u.id,
            u.email,
            u.name,
            u.status,
            COALESCE(
                json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL),
                '[]'::json
            ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = :user_id
        GROUP BY u.id, u.email, u.name, u.status
    """)

    result = await db.execute(query, {"user_id": user_id})
    user_row = result.fetchone()

    if user_row is None:
        raise credentials_exception

    user = {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[3],
        "roles": user_row[4] if user_row[4] else []
    }

    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Verify that current user is active (not deactivated).

    Args:
        current_user: User dictionary from get_current_user dependency

    Returns:
        User dictionary if active

    Raises:
        HTTPException: 403 if user is deactivated
    """
    if current_user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    return current_user


def require_roles(*required_roles: str) -> Callable:
    """
    Factory function that creates a dependency to check if user has at least one of the required roles.

    Args:
        *required_roles: One or more role names (e.g., 'admin', 'segment_owner')

    Returns:
        Dependency function that validates user has required role

    Example:
        @router.get("/admin-only", dependencies=[Depends(require_roles("admin"))])
        async def admin_endpoint():
            pass
    """
    async def role_checker(current_user: dict = Depends(get_current_active_user)) -> dict:
        user_roles = current_user.get("roles", [])

        # Check if user has at least one of the required roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}"
            )

        return current_user

    return role_checker


def require_permission(action: str) -> Callable:
    """
    Factory function that creates a dependency to check if user's roles have a specific permission.

    Checks the role_grants table to verify the user has at least one role with the required action granted.

    Args:
        action: Permission action string (e.g., 'approve_company', 'manage_users')

    Returns:
        Dependency function that validates user has required permission

    Example:
        @router.post("/approve", dependencies=[Depends(require_permission("approve_company"))])
        async def approve_endpoint():
            pass
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> dict:
        user_roles = current_user.get("roles", [])

        if not user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required action: {action}"
            )

        # Check if any of the user's roles have the required permission
        query = text("""
            SELECT COUNT(*)
            FROM role_grants
            WHERE role = ANY(:roles::user_role[])
            AND action = :action
            AND granted = true
        """)

        result = await db.execute(query, {"roles": user_roles, "action": action})
        count = result.scalar()

        if count == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required action: {action}"
            )

        return current_user

    return permission_checker
