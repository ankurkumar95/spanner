"""Assignment Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.assignment import EntityTypeEnum


class AssignmentBase(BaseModel):
    """Base assignment schema with common fields."""

    entity_type: EntityTypeEnum
    entity_id: UUID
    assigned_to: UUID

    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(AssignmentBase):
    """Schema for creating a new assignment."""

    pass


class AssignmentBulkCreate(BaseModel):
    """Schema for creating multiple assignments."""

    entity_type: EntityTypeEnum
    entity_ids: list[UUID]
    assigned_to: UUID

    model_config = ConfigDict(from_attributes=True)


class AssignmentResponse(AssignmentBase):
    """Full assignment response schema."""

    id: UUID
    assigned_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignmentDelete(BaseModel):
    """Schema for deleting an assignment."""

    entity_type: EntityTypeEnum
    entity_id: UUID
    assigned_to: UUID

    model_config = ConfigDict(from_attributes=True)
