"""Company Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models.company import CompanyStatusEnum


class CompanyBase(BaseModel):
    """Base company schema with common fields."""

    company_name: str = Field(min_length=1, max_length=500)
    company_website: str | None = Field(None, max_length=2048)
    company_phone: str | None = Field(None, max_length=50)
    company_description: str | None = Field(None, max_length=5000)
    company_linkedin_url: str | None = Field(None, max_length=2048)
    company_industry: str | None = Field(None, max_length=200)
    company_sub_industry: str | None = Field(None, max_length=200)

    # Address fields
    street: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=200)
    state_province: str | None = Field(None, max_length=200)
    country_region: str | None = Field(None, max_length=200)
    zip_postal_code: str | None = Field(None, max_length=50)

    # Metadata
    founded_year: int | None = Field(None, ge=1800, le=2100)
    revenue_range: str | None = Field(None, max_length=200)
    employee_size_range: str | None = Field(None, max_length=200)

    model_config = ConfigDict(from_attributes=True)


class CompanyCreate(CompanyBase):
    """Schema for creating a new company."""

    segment_id: UUID


class CompanyUpdate(BaseModel):
    """Schema for updating a company."""

    company_name: str | None = Field(None, min_length=1, max_length=500)
    company_website: str | None = Field(None, max_length=2048)
    company_phone: str | None = Field(None, max_length=50)
    company_description: str | None = Field(None, max_length=5000)
    company_linkedin_url: str | None = Field(None, max_length=2048)
    company_industry: str | None = Field(None, max_length=200)
    company_sub_industry: str | None = Field(None, max_length=200)

    # Address fields
    street: str | None = None
    city: str | None = Field(None, max_length=200)
    state_province: str | None = Field(None, max_length=200)
    country_region: str | None = Field(None, max_length=200)
    zip_postal_code: str | None = Field(None, max_length=50)

    # Metadata
    founded_year: int | None = Field(None, ge=1800, le=2100)
    revenue_range: str | None = Field(None, max_length=200)
    employee_size_range: str | None = Field(None, max_length=200)

    segment_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class CompanyBrief(BaseModel):
    """Brief company schema for lists and references."""

    id: UUID
    company_name: str
    company_website: str | None
    company_industry: str | None
    status: CompanyStatusEnum
    segment_id: UUID

    model_config = ConfigDict(from_attributes=True)


class CompanyResponse(CompanyBase):
    """Full company response schema."""

    id: UUID
    segment_id: UUID
    status: CompanyStatusEnum
    rejection_reason: str | None
    is_duplicate: bool
    batch_id: UUID | None
    created_by: UUID
    created_by_name: str | None = None
    approved_by_name: str | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyApproval(BaseModel):
    """Schema for approving/rejecting a company."""

    status: CompanyStatusEnum
    rejection_reason: str | None = Field(
        None,
        max_length=5000,
        description="Required when status is 'rejected'"
    )

    model_config = ConfigDict(from_attributes=True)

    def model_post_init(self, __context):
        """Validate approval schema constraints."""
        if self.status == CompanyStatusEnum.PENDING:
            raise ValueError("Cannot set status back to 'pending'")
        if self.status == CompanyStatusEnum.REJECTED and not self.rejection_reason:
            raise ValueError("rejection_reason is required when status is 'rejected'")
        if self.status != CompanyStatusEnum.REJECTED and self.rejection_reason:
            raise ValueError("rejection_reason should only be provided when status is 'rejected'")


class CompanyWithContacts(CompanyResponse):
    """Company response with contact count."""

    contact_count: int = 0

    model_config = ConfigDict(from_attributes=True)
