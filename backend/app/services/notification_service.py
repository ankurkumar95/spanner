"""Notification service layer for business logic."""
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationTypeEnum
from app.schemas.notification import NotificationStats


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationTypeEnum,
    title: str,
    message: str,
    link: str | None = None,
    actor_id: UUID | None = None,
    entity_type: str | None = None,
    entity_id: UUID | None = None
) -> Notification:
    """
    Create a new notification.

    Args:
        db: Database session
        user_id: UUID of user receiving the notification
        type: Type of notification
        title: Notification title
        message: Notification message
        link: Optional link URL
        actor_id: Optional UUID of user who triggered the notification
        entity_type: Optional entity type related to notification
        entity_id: Optional entity ID related to notification

    Returns:
        Created notification instance
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id
    )

    db.add(notification)
    await db.flush()
    await db.refresh(notification)

    return notification


async def get_notifications(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    is_read: bool | None = None
) -> list[Notification]:
    """
    Get notifications for a user with pagination.

    Args:
        db: Database session
        user_id: UUID of user
        skip: Number of records to skip
        limit: Maximum number of records to return
        is_read: Optional filter by read status

    Returns:
        List of notification instances
    """
    query = select(Notification).where(Notification.user_id == user_id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_notifications(
    db: AsyncSession,
    user_id: UUID,
    is_read: bool | None = None
) -> int:
    """
    Count total notifications for a user.

    Args:
        db: Database session
        user_id: UUID of user
        is_read: Optional filter by read status

    Returns:
        Total count of notifications
    """
    query = select(func.count()).select_from(Notification).where(
        Notification.user_id == user_id
    )

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    result = await db.execute(query)
    return result.scalar() or 0


async def mark_read(
    db: AsyncSession,
    notification_id: UUID,
    user_id: UUID
) -> Notification | None:
    """
    Mark a notification as read.

    Args:
        db: Database session
        notification_id: Notification UUID
        user_id: UUID of user (for ownership verification)

    Returns:
        Updated notification instance or None if not found/not owned by user
    """
    query = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id
    )

    result = await db.execute(query)
    notification = result.scalar_one_or_none()

    if notification is None:
        return None

    notification.is_read = True
    await db.flush()
    await db.refresh(notification)

    return notification


async def mark_all_read(
    db: AsyncSession,
    user_id: UUID
) -> int:
    """
    Mark all notifications as read for a user.

    Args:
        db: Database session
        user_id: UUID of user

    Returns:
        Number of notifications updated
    """
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        .values(is_read=True)
    )

    result = await db.execute(stmt)
    await db.flush()

    return result.rowcount or 0


async def bulk_mark_read(
    db: AsyncSession,
    notification_ids: list[UUID],
    user_id: UUID
) -> int:
    """
    Mark multiple notifications as read.

    Args:
        db: Database session
        notification_ids: List of notification UUIDs
        user_id: UUID of user (for ownership verification)

    Returns:
        Number of notifications updated
    """
    stmt = (
        update(Notification)
        .where(
            Notification.id.in_(notification_ids),
            Notification.user_id == user_id
        )
        .values(is_read=True)
    )

    result = await db.execute(stmt)
    await db.flush()

    return result.rowcount or 0


async def get_stats(
    db: AsyncSession,
    user_id: UUID
) -> NotificationStats:
    """
    Get notification statistics for a user.

    Args:
        db: Database session
        user_id: UUID of user

    Returns:
        NotificationStats with total and unread counts
    """
    total = await count_notifications(db, user_id)
    unread = await count_notifications(db, user_id, is_read=False)

    return NotificationStats(total=total, unread=unread)
