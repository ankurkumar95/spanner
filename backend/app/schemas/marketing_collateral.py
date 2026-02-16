"""Marketing Collateral Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MarketingCollateralBase(BaseModel):
    """Base marketing collateral schema with common fields."""

    title: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=2048)
    description: str | None = Field(None, max_length=1000)
    scope_type: str = Field(pattern="^(segment|offering|lead)$")
    scope_id: UUID

    model_config = ConfigDict(from_attributes=True)


class MarketingCollateralCreate(MarketingCollateralBase):
    """Schema for creating new marketing collateral."""

    segment_id: UUID | None = None
    offering_id: UUID | None = None


class MarketingCollateralUpdate(BaseModel):
    """Schema for updating marketing collateral."""

    title: str | None = Field(None, min_length=1, max_length=255)
    url: str | None = Field(None, min_length=1, max_length=2048)
    description: str | None = Field(None, max_length=1000)
    scope_type: str | None = Field(None, pattern="^(segment|offering|lead)$")
    scope_id: UUID | None = None
    segment_id: UUID | None = None
    offering_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class MarketingCollateralResponse(MarketingCollateralBase):
    """Full marketing collateral response schema."""

    id: UUID
    segment_id: UUID | None
    offering_id: UUID | None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MarketingCollateralBrief(BaseModel):
    """Brief marketing collateral schema for lists."""

    id: UUID
    title: str
    url: str
    scope_type: str

    model_config = ConfigDict(from_attributes=True)
