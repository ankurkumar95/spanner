"""Company model."""
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CompanyStatusEnum(str, enum.Enum):
    """Company status enumeration matching PostgreSQL enum."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Company(BaseModel):
    """Company model scoped to segments."""

    __tablename__ = "companies"

    # Basic company information
    company_name: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    company_website: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_industry: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_sub_industry: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Company address fields
    street: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    state_province: Mapped[str | None] = mapped_column(Text, nullable=True)
    country_region: Mapped[str | None] = mapped_column(Text, nullable=True)
    zip_postal_code: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Company metadata
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    revenue_range: Mapped[str | None] = mapped_column(Text, nullable=True)
    employee_size_range: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships and status
    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("segments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    status: Mapped[CompanyStatusEnum] = mapped_column(
        SAEnum(CompanyStatusEnum, name="company_status", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=CompanyStatusEnum.PENDING,
        server_default="pending",
        index=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    segment: Mapped["Segment"] = relationship("Segment", back_populates="companies")
    created_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="created_companies",
        foreign_keys=[created_by]
    )
    contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "company_name",
            "company_website",
            "segment_id",
            name="unique_company_per_segment"
        ),
    )

    @property
    def created_by_name(self) -> str | None:
        """Return the name of the user who created this company."""
        if self.created_by_user:
            return self.created_by_user.name
        return None

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name={self.company_name}, status={self.status})>"
