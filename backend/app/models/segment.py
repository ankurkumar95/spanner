"""Segment and offering models."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    PrimaryKeyConstraint,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin


class SegmentStatusEnum(str, enum.Enum):
    """Segment status enumeration matching PostgreSQL enum."""

    ACTIVE = "active"
    ARCHIVED = "archived"


class OfferingStatusEnum(str, enum.Enum):
    """Offering status enumeration matching PostgreSQL enum."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class Segment(Base, UUIDPKMixin, TimestampMixin):
    """Segment model (ABM sales/marketing segments)."""

    __tablename__ = "segments"

    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SegmentStatusEnum] = mapped_column(
        SAEnum(SegmentStatusEnum, name="segment_status", create_type=False),
        nullable=False,
        default=SegmentStatusEnum.ACTIVE,
        server_default="active",
        index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Relationships
    created_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="created_segments",
        foreign_keys=[created_by]
    )
    companies: Mapped[list["Company"]] = relationship(
        "Company",
        back_populates="segment"
    )
    contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="segment"
    )
    segment_offerings: Mapped[list["SegmentOffering"]] = relationship(
        "SegmentOffering",
        back_populates="segment",
        cascade="all, delete-orphan"
    )
    # Many-to-many relationship with offerings
    offerings: Mapped[list["Offering"]] = relationship(
        "Offering",
        secondary="segment_offerings",
        back_populates="segments",
        viewonly=True
    )
    marketing_collateral: Mapped[list["MarketingCollateral"]] = relationship(
        "MarketingCollateral",
        back_populates="segment"
    )

    def __repr__(self) -> str:
        return f"<Segment(id={self.id}, name={self.name}, status={self.status})>"


class Offering(Base, UUIDPKMixin, TimestampMixin):
    """Offering model (global master list of product/service offerings)."""

    __tablename__ = "offerings"

    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OfferingStatusEnum] = mapped_column(
        SAEnum(OfferingStatusEnum, name="offering_status", create_type=False),
        nullable=False,
        default=OfferingStatusEnum.ACTIVE,
        server_default="active",
        index=True
    )

    # Relationships
    segment_offerings: Mapped[list["SegmentOffering"]] = relationship(
        "SegmentOffering",
        back_populates="offering"
    )
    # Many-to-many relationship with segments
    segments: Mapped[list["Segment"]] = relationship(
        "Segment",
        secondary="segment_offerings",
        back_populates="offerings",
        viewonly=True
    )
    marketing_collateral: Mapped[list["MarketingCollateral"]] = relationship(
        "MarketingCollateral",
        back_populates="offering"
    )

    def __repr__(self) -> str:
        return f"<Offering(id={self.id}, name={self.name}, status={self.status})>"


class SegmentOffering(Base):
    """Segment-Offering many-to-many junction table."""

    __tablename__ = "segment_offerings"

    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("segments.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
        index=True
    )
    offering_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("offerings.id", ondelete="RESTRICT"),
        nullable=False,
        primary_key=True,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default="now()"
    )

    # Relationships
    segment: Mapped["Segment"] = relationship(
        "Segment",
        back_populates="segment_offerings"
    )
    offering: Mapped["Offering"] = relationship(
        "Offering",
        back_populates="segment_offerings"
    )

    __table_args__ = (
        PrimaryKeyConstraint("segment_id", "offering_id"),
    )

    def __repr__(self) -> str:
        return f"<SegmentOffering(segment_id={self.segment_id}, offering_id={self.offering_id})>"
