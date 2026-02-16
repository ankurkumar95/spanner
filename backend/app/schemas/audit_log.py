"""Audit Log Pydantic schemas."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditLogBase(BaseModel):
    """Base audit log schema with common fields."""

    action: str = Field(min_length=1)
    entity_type: str = Field(min_length=1)
    entity_id: UUID
    details: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(AuditLogBase):
    """Schema for creating a new audit log entry."""

    actor_id: UUID | None = None


class AuditLogResponse(AuditLogBase):
    """Full audit log response schema."""

    id: UUID
    actor_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogFilter(BaseModel):
    """Schema for filtering audit logs."""

    actor_id: UUID | None = None
    action: str | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
