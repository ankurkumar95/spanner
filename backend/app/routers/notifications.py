"""Notification router for in-app notification endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.schemas.notification import (
    NotificationResponse,
    NotificationMarkRead,
    NotificationBulkMarkRead,
    NotificationStats
)
from app.services import notification_service

router = APIRouter()


@router.get("/", response_model=list[NotificationResponse])
async def get_my_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get notifications for the current user with pagination.

    Optionally filter by read status.
    """
    notifications = await notification_service.get_notifications(
        db=db,
        user_id=UUID(current_user["id"]),
        skip=skip,
        limit=limit,
        is_read=is_read
    )
    return notifications


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get notification statistics for the current user.

    Returns total count and unread count.
    """
    stats = await notification_service.get_stats(
        db=db,
        user_id=UUID(current_user["id"])
    )
    return stats


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark a single notification as read.

    Only the notification owner can mark it as read.
    """
    notification = await notification_service.mark_read(
        db=db,
        notification_id=notification_id,
        user_id=UUID(current_user["id"])
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied"
        )

    return notification


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark all notifications as read for the current user.

    Returns the count of notifications updated.
    """
    count = await notification_service.mark_all_read(
        db=db,
        user_id=UUID(current_user["id"])
    )
    return {"updated_count": count}


@router.post("/bulk-read", status_code=status.HTTP_200_OK)
async def bulk_mark_notifications_read(
    data: NotificationBulkMarkRead,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark multiple notifications as read.

    Only notifications owned by the current user will be updated.
    Returns the count of notifications updated.
    """
    count = await notification_service.bulk_mark_read(
        db=db,
        notification_ids=data.notification_ids,
        user_id=UUID(current_user["id"])
    )
    return {"updated_count": count}
