"""Contact Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.contact import ContactStatusEnum


class ContactBase(BaseModel):
    """Base contact schema with common fields."""

    first_name: str = Field(min_length=1, max_length=200)
    last_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    mobile_phone: str | None = Field(None, max_length=50)
    job_title: str | None = Field(None, max_length=500)
    direct_phone_number: str | None = Field(None, max_length=50)
    email_address_2: EmailStr | None = None
    email_active_status: str | None = Field(None, max_length=100)

    # Metadata
    lead_source_global: str | None = Field(None, max_length=200)
    management_level: str | None = Field(None, max_length=200)

    # Address fields
    street: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=200)
    state_province: str | None = Field(None, max_length=200)
    country_region: str | None = Field(None, max_length=200)
    zip_postal_code: str | None = Field(None, max_length=50)
    primary_time_zone: str | None = Field(None, max_length=100)

    # LinkedIn and research data
    contact_linkedin_url: str | None = Field(None, max_length=2048)
    linkedin_summary: str | None = Field(None, max_length=5000)
    data_requester_details: str | None = Field(None, max_length=500)

    model_config = ConfigDict(from_attributes=True)


class ContactCreate(ContactBase):
    """Schema for creating a new contact."""

    company_id: UUID


class ContactUpdate(BaseModel):
    """Schema for updating a contact."""

    first_name: str | None = Field(None, min_length=1, max_length=200)
    last_name: str | None = Field(None, min_length=1, max_length=200)
    email: EmailStr | None = None
    mobile_phone: str | None = Field(None, max_length=50)
    job_title: str | None = Field(None, max_length=500)
    direct_phone_number: str | None = Field(None, max_length=50)
    email_address_2: EmailStr | None = None
    email_active_status: str | None = Field(None, max_length=100)

    # Metadata
    lead_source_global: str | None = Field(None, max_length=200)
    management_level: str | None = Field(None, max_length=200)

    # Address fields
    street: str | None = None
    city: str | None = Field(None, max_length=200)
    state_province: str | None = Field(None, max_length=200)
    country_region: str | None = Field(None, max_length=200)
    zip_postal_code: str | None = Field(None, max_length=50)
    primary_time_zone: str | None = Field(None, max_length=100)

    # LinkedIn and research data
    contact_linkedin_url: str | None = Field(None, max_length=2048)
    linkedin_summary: str | None = Field(None, max_length=5000)
    data_requester_details: str | None = Field(None, max_length=500)

    company_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class ContactBrief(BaseModel):
    """Brief contact schema for lists and references."""

    id: UUID
    first_name: str
    last_name: str
    email: str
    job_title: str | None
    company_id: UUID
    status: ContactStatusEnum

    model_config = ConfigDict(from_attributes=True)


class ContactResponse(ContactBase):
    """Full contact response schema."""

    id: UUID
    company_id: UUID
    segment_id: UUID
    status: ContactStatusEnum
    assigned_sdr_id: UUID | None
    is_duplicate: bool
    batch_id: UUID | None
    created_by: UUID
    created_by_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactApproval(BaseModel):
    """Schema for approving a contact."""

    status: ContactStatusEnum

    model_config = ConfigDict(from_attributes=True)


class ContactAssignment(BaseModel):
    """Schema for assigning a contact to an SDR."""

    assigned_sdr_id: UUID

    model_config = ConfigDict(from_attributes=True)


class ContactWithCompany(ContactResponse):
    """Contact response with company name."""

    company_name: str

    model_config = ConfigDict(from_attributes=True)
