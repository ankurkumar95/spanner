"""Common Pydantic schemas."""
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Generic type for paginated responses
T = TypeVar("T")


class MessageResponse(BaseModel):
    """Standard message response."""

    message: str
    detail: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""

    items: list[T]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=1000)
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class IDResponse(BaseModel):
    """Standard ID response for created entities."""

    id: UUID
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)
