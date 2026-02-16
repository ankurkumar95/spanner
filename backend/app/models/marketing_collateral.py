"""Marketing collateral model."""
import uuid

from sqlalchemy import (
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MarketingCollateral(BaseModel):
    """Marketing collateral model for marketing material links."""

    __tablename__ = "marketing_collateral"

    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    scope_type: Mapped[str] = mapped_column(Text, nullable=False)
    # Note: scope_id has no FK constraint (polymorphic relationship)
    scope_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    segment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("segments.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    offering_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("offerings.id", ondelete="SET NULL"),
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
    segment: Mapped["Segment | None"] = relationship(
        "Segment",
        back_populates="marketing_collateral"
    )
    offering: Mapped["Offering | None"] = relationship(
        "Offering",
        back_populates="marketing_collateral"
    )
    created_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="created_marketing_collateral"
    )

    def __repr__(self) -> str:
        return f"<MarketingCollateral(id={self.id}, title={self.title}, scope_type={self.scope_type})>"
