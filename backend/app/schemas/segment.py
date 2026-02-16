"""Segment and Offering Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.segment import SegmentStatusEnum, OfferingStatusEnum


# Offering Schemas
class OfferingBase(BaseModel):
    """Base offering schema with common fields."""

    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)

    model_config = ConfigDict(from_attributes=True)


class OfferingCreate(OfferingBase):
    """Schema for creating a new offering."""

    status: OfferingStatusEnum = OfferingStatusEnum.ACTIVE


class OfferingUpdate(BaseModel):
    """Schema for updating an offering."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    status: OfferingStatusEnum | None = None

    model_config = ConfigDict(from_attributes=True)


class OfferingBrief(BaseModel):
    """Brief offering schema for lists and references."""

    id: UUID
    name: str
    status: OfferingStatusEnum

    model_config = ConfigDict(from_attributes=True)


class OfferingResponse(OfferingBrief):
    """Full offering response schema."""

    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Segment Schemas
class SegmentBase(BaseModel):
    """Base segment schema with common fields."""

    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)

    model_config = ConfigDict(from_attributes=True)


class SegmentCreate(SegmentBase):
    """Schema for creating a new segment."""

    status: SegmentStatusEnum = SegmentStatusEnum.ACTIVE
    offering_ids: list[UUID] = Field(default_factory=list, description="List of offering IDs to associate")


class SegmentUpdate(BaseModel):
    """Schema for updating a segment."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    status: SegmentStatusEnum | None = None
    offering_ids: list[UUID] | None = Field(None, description="List of offering IDs to associate (replaces existing)")

    model_config = ConfigDict(from_attributes=True)


class SegmentBrief(BaseModel):
    """Brief segment schema for lists and references."""

    id: UUID
    name: str
    status: SegmentStatusEnum

    model_config = ConfigDict(from_attributes=True)


class SegmentResponse(SegmentBrief):
    """Full segment response schema."""

    description: str | None
    created_by: UUID
    created_by_name: str | None = None
    created_at: datetime
    updated_at: datetime
    offerings: list[OfferingBrief] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SegmentWithStats(SegmentResponse):
    """Segment response with statistics."""

    company_count: int = 0
    contact_count: int = 0
    pending_company_count: int = 0

    model_config = ConfigDict(from_attributes=True)
