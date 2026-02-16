"""Upload batch model for CSV upload tracking."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin


class UploadTypeEnum(str, enum.Enum):
    """Upload type enumeration matching PostgreSQL enum."""

    COMPANY = "company"
    CONTACT = "contact"


class BatchStatusEnum(str, enum.Enum):
    """Batch status enumeration matching PostgreSQL enum."""

    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadBatch(Base, UUIDPKMixin):
    """Upload batch model for tracking CSV uploads."""

    __tablename__ = "upload_batches"

    upload_type: Mapped[UploadTypeEnum] = mapped_column(
        SAEnum(UploadTypeEnum, name="upload_type", create_type=False),
        nullable=False,
        index=True
    )
    file_name: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    invalid_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[BatchStatusEnum] = mapped_column(
        SAEnum(BatchStatusEnum, name="batch_status", create_type=False),
        nullable=False,
        default=BatchStatusEnum.PROCESSING,
        server_default="processing",
        index=True
    )
    error_report_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
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
    uploaded_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="upload_batches"
    )

    def __repr__(self) -> str:
        return f"<UploadBatch(id={self.id}, type={self.upload_type}, status={self.status}, rows={self.total_rows})>"
