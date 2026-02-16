"""Assignment model for polymorphic entity assignments."""
import enum
import uuid

from sqlalchemy import (
    Enum as SAEnum,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin
from datetime import datetime
from sqlalchemy import DateTime


class EntityTypeEnum(str, enum.Enum):
    """Entity type enumeration matching PostgreSQL enum."""

    SEGMENT = "segment"
    COMPANY = "company"
    CONTACT = "contact"


class Assignment(Base, UUIDPKMixin):
    """Assignment model for polymorphic entity assignments to users."""

    __tablename__ = "assignments"

    entity_type: Mapped[EntityTypeEnum] = mapped_column(
        SAEnum(EntityTypeEnum, name="entity_type", create_type=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    # Note: entity_id has no FK constraint (polymorphic relationship)
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    assigned_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        server_default="now()",
        index=True
    )

    # Relationships
    assigned_to_user: Mapped["User"] = relationship(
        "User",
        back_populates="assignments_received",
        foreign_keys=[assigned_to]
    )
    assigned_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="assignments_made",
        foreign_keys=[assigned_by]
    )

    __table_args__ = (
        UniqueConstraint(
            "entity_type",
            "entity_id",
            "assigned_to",
            name="unique_assignment"
        ),
    )

    def __repr__(self) -> str:
        return f"<Assignment(id={self.id}, entity_type={self.entity_type}, entity_id={self.entity_id})>"
