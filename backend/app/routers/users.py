"""
User management endpoints for creating, updating, and managing users.
"""

import logging
import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserRolesUpdate,
    UserResponse,
    UserListResponse,
    UserPermissionsResponse
)
from app.schemas.auth import MessageResponse
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def list_users(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: str | None = Query(None, pattern="^(active|deactivated)$", description="Filter by user status"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner", "approver"))
):
    """
    List users with pagination and optional status filtering.

    Requires: admin or segment_owner role
    """
    skip = (page - 1) * per_page

    # Fetch users and total count
    users = await auth_service.list_users(db, skip=skip, limit=per_page, status_filter=status_filter)
    total = await auth_service.count_users(db, status_filter=status_filter)

    total_pages = math.ceil(total / per_page) if total > 0 else 0

    logger.info(
        f"User list requested by {current_user['email']} - "
        f"Page: {page}, Per page: {per_page}, Status: {status_filter or 'all'}, Total: {total}"
    )

    return UserListResponse(
        users=[UserResponse(**user) for user in users],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    """
    Get detailed information about a specific user.

    Requires: admin or segment_owner role
    """
    user = await auth_service.get_user_by_id(db, user_id)

    if user is None:
        logger.warning(f"User not found: {user_id} (requested by {current_user['email']})")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    logger.info(f"User detail retrieved: {user['email']} by {current_user['email']}")

    return UserResponse(**user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Create (invite) a new user.

    Requires: admin role
    """
    # Check if email already exists
    existing_user = await auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        logger.warning(
            f"Attempt to create user with existing email: {user_data.email} "
            f"by {current_user['email']}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {user_data.email} already exists"
        )

    try:
        user = await auth_service.create_user(
            db,
            email=user_data.email,
            name=user_data.name,
            password=user_data.password,
            roles=user_data.roles,
            status=user_data.status
        )

        logger.info(
            f"User created: {user['email']} (ID: {user['id']}) "
            f"with roles {user['roles']} by {current_user['email']}"
        )

        return UserResponse(**user)

    except Exception as e:
        logger.error(f"Failed to create user {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.patch("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Update user information (name, email, or password).

    Requires: admin role
    """
    # Check if user exists
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(f"Attempt to update non-existent user: {user_id} by {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # If email is being changed, check it's not already in use
    if user_data.email and user_data.email != user["email"]:
        existing_user = await auth_service.get_user_by_email(db, user_data.email)
        if existing_user:
            logger.warning(
                f"Attempt to change user {user_id} email to existing email: {user_data.email} "
                f"by {current_user['email']}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email {user_data.email} is already in use"
            )

    try:
        updated_user = await auth_service.update_user(
            db,
            user_id,
            name=user_data.name,
            email=user_data.email,
            password=user_data.password
        )

        logger.info(
            f"User updated: {updated_user['email']} (ID: {user_id}) by {current_user['email']}"
        )

        return UserResponse(**updated_user)

    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.post("/{user_id}/deactivate", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Soft deactivate a user (sets status to 'deactivated').

    Requires: admin role
    """
    # Check if user exists
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(f"Attempt to deactivate non-existent user: {user_id} by {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Prevent self-deactivation
    if str(user_id) == current_user["id"]:
        logger.warning(f"User attempted to deactivate themselves: {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    if user["status"] == "deactivated":
        logger.info(f"User already deactivated: {user['email']} by {current_user['email']}")
        return MessageResponse(message=f"User {user['email']} is already deactivated")

    try:
        await auth_service.deactivate_user(db, user_id)
        logger.info(f"User deactivated: {user['email']} (ID: {user_id}) by {current_user['email']}")

        return MessageResponse(message=f"User {user['email']} has been deactivated")

    except Exception as e:
        logger.error(f"Failed to deactivate user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate user: {str(e)}"
        )


@router.post("/{user_id}/activate", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def activate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Activate a deactivated user (sets status to 'active').

    Requires: admin role
    """
    # Check if user exists
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(f"Attempt to activate non-existent user: {user_id} by {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    if user["status"] == "active":
        logger.info(f"User already active: {user['email']} by {current_user['email']}")
        return MessageResponse(message=f"User {user['email']} is already active")

    try:
        await auth_service.activate_user(db, user_id)
        logger.info(f"User activated: {user['email']} (ID: {user_id}) by {current_user['email']}")

        return MessageResponse(message=f"User {user['email']} has been activated")

    except Exception as e:
        logger.error(f"Failed to activate user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate user: {str(e)}"
        )


@router.put("/{user_id}/roles", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user_roles(
    user_id: UUID,
    roles_data: UserRolesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Update user roles (replaces existing roles with new set).

    Requires: admin role
    """
    # Check if user exists
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(f"Attempt to update roles for non-existent user: {user_id} by {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Prevent removing admin role from self
    if str(user_id) == current_user["id"] and "admin" not in roles_data.roles:
        logger.warning(
            f"User attempted to remove their own admin role: {current_user['email']}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove the admin role from your own account"
        )

    try:
        updated_user = await auth_service.update_user_roles(db, user_id, roles_data.roles)

        logger.info(
            f"User roles updated: {updated_user['email']} (ID: {user_id}) - "
            f"New roles: {updated_user['roles']} by {current_user['email']}"
        )

        return UserResponse(**updated_user)

    except Exception as e:
        logger.error(f"Failed to update roles for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user roles: {str(e)}"
        )


@router.get("/{user_id}/permissions", response_model=UserPermissionsResponse, status_code=status.HTTP_200_OK)
async def get_user_permissions(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    Get all permissions (granted actions) for a user based on their roles.

    Requires: admin role
    """
    # Check if user exists
    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(
            f"Attempt to get permissions for non-existent user: {user_id} by {current_user['email']}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    try:
        permissions = await auth_service.get_user_permissions(db, user_id)

        logger.info(
            f"Permissions retrieved for user: {user['email']} (ID: {user_id}) "
            f"by {current_user['email']} - {len(permissions)} permissions"
        )

        return UserPermissionsResponse(
            user_id=str(user_id),
            permissions=permissions
        )

    except Exception as e:
        logger.error(f"Failed to get permissions for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user permissions: {str(e)}"
        )
