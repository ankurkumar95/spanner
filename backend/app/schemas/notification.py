"""Notification Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import NotificationTypeEnum


class NotificationBase(BaseModel):
    """Base notification schema with common fields."""

    type: NotificationTypeEnum
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=1000)
    link: str | None = Field(None, max_length=2048)

    model_config = ConfigDict(from_attributes=True)


class NotificationCreate(NotificationBase):
    """Schema for creating a new notification."""

    user_id: UUID
    entity_type: str | None = None
    entity_id: UUID | None = None


class NotificationResponse(NotificationBase):
    """Full notification response schema."""

    id: UUID
    user_id: UUID
    is_read: bool
    actor_id: UUID | None
    entity_type: str | None
    entity_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationMarkRead(BaseModel):
    """Schema for marking notifications as read."""

    is_read: bool = True

    model_config = ConfigDict(from_attributes=True)


class NotificationBulkMarkRead(BaseModel):
    """Schema for bulk marking notifications as read."""

    notification_ids: list[UUID]
    is_read: bool = True

    model_config = ConfigDict(from_attributes=True)


class NotificationStats(BaseModel):
    """Schema for notification statistics."""

    total: int = 0
    unread: int = 0

    model_config = ConfigDict(from_attributes=True)
