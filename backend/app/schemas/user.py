"""User Pydantic schemas."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRoleEnum, UserStatusEnum


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    name: str = Field(min_length=1, max_length=255)

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(min_length=8, max_length=128)
    roles: list[UserRoleEnum] = Field(default_factory=list)
    status: UserStatusEnum = UserStatusEnum.ACTIVE


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8, max_length=128)
    status: UserStatusEnum | None = None

    model_config = ConfigDict(from_attributes=True)


class UserBrief(BaseModel):
    """Brief user schema for lists and references."""

    id: UUID
    email: str
    name: str
    status: UserStatusEnum

    model_config = ConfigDict(from_attributes=True)


class RoleGrantResponse(BaseModel):
    """Schema for role grant response."""

    id: int
    role: UserRoleEnum
    action: str
    granted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserRoleResponse(BaseModel):
    """Schema for user role response."""

    id: int
    role: UserRoleEnum
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferenceResponse(BaseModel):
    """Schema for user preference response."""

    id: UUID
    user_id: UUID
    sidebar_theme: str
    notification_preferences: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPreferenceUpdate(BaseModel):
    """Schema for updating user preferences."""

    sidebar_theme: str | None = Field(None, pattern="^(light|dark|auto)$")
    notification_preferences: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBrief):
    """Full user response schema."""

    created_at: datetime
    updated_at: datetime
    roles: list[str] = Field(default_factory=list)
    preferences: UserPreferenceResponse | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserWithRoles(UserBrief):
    """User schema with roles included."""

    roles: list[UserRoleEnum]

    model_config = ConfigDict(from_attributes=True)


class UserRolesUpdate(BaseModel):
    """Schema for updating user roles."""

    roles: list[UserRoleEnum]

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated user list response."""

    users: list[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class UserPermissionsResponse(BaseModel):
    """User permissions response."""

    user_id: str
    permissions: list[str]


class RoleGrantCreate(BaseModel):
    """Schema for creating a role grant."""

    role: UserRoleEnum
    action: str = Field(min_length=1)
    granted: bool = True

    model_config = ConfigDict(from_attributes=True)


class RoleGrantUpdate(BaseModel):
    """Schema for updating a role grant."""

    granted: bool

    model_config = ConfigDict(from_attributes=True)
