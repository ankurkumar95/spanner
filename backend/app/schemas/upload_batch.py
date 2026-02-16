"""Upload Batch Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.upload_batch import UploadTypeEnum, BatchStatusEnum


class UploadBatchBase(BaseModel):
    """Base upload batch schema with common fields."""

    upload_type: UploadTypeEnum
    file_name: str = Field(min_length=1)
    file_size_bytes: int = Field(gt=0)

    model_config = ConfigDict(from_attributes=True)


class UploadBatchCreate(UploadBatchBase):
    """Schema for creating a new upload batch."""

    pass


class UploadBatchUpdate(BaseModel):
    """Schema for updating an upload batch (used internally)."""

    total_rows: int | None = Field(None, ge=0)
    valid_rows: int | None = Field(None, ge=0)
    invalid_rows: int | None = Field(None, ge=0)
    status: BatchStatusEnum | None = None
    error_report_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UploadBatchResponse(UploadBatchBase):
    """Full upload batch response schema."""

    id: UUID
    total_rows: int
    valid_rows: int
    invalid_rows: int
    status: BatchStatusEnum
    error_report_url: str | None
    uploaded_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UploadBatchWithProgress(UploadBatchResponse):
    """Upload batch response with progress percentage."""

    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)
