"""Contact model."""
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Enum as SAEnum,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ContactStatusEnum(str, enum.Enum):
    """Contact status enumeration matching PostgreSQL enum."""

    UPLOADED = "uploaded"
    APPROVED = "approved"
    ASSIGNED_TO_SDR = "assigned_to_sdr"
    MEETING_SCHEDULED = "meeting_scheduled"


class Contact(BaseModel):
    """Contact model linked to companies."""

    __tablename__ = "contacts"

    # Contact identity
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    mobile_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    direct_phone_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_address_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_active_status: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contact metadata
    lead_source_global: Mapped[str | None] = mapped_column(Text, nullable=True)
    management_level: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contact address fields
    street: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    state_province: Mapped[str | None] = mapped_column(Text, nullable=True)
    country_region: Mapped[str | None] = mapped_column(Text, nullable=True)
    zip_postal_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_time_zone: Mapped[str | None] = mapped_column(Text, nullable=True)

    # LinkedIn and research data
    contact_linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    linkedin_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_requester_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships and status
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("segments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    status: Mapped[ContactStatusEnum] = mapped_column(
        SAEnum(ContactStatusEnum, name="contact_status", create_type=False),
        nullable=False,
        default=ContactStatusEnum.UPLOADED,
        server_default="uploaded",
        index=True
    )
    assigned_sdr_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    is_duplicate: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="contacts")
    segment: Mapped["Segment"] = relationship("Segment", back_populates="contacts")
    created_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="created_contacts",
        foreign_keys=[created_by]
    )
    assigned_sdr: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_contacts",
        foreign_keys=[assigned_sdr_id]
    )

    __table_args__ = (
        UniqueConstraint(
            "email",
            "company_id",
            name="unique_contact_per_company"
        ),
    )

    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, name={self.first_name} {self.last_name}, email={self.email})>"
