"""User models including roles and preferences."""
import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Identity,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin


class UserRoleEnum(str, enum.Enum):
    """User role enumeration matching PostgreSQL enum."""

    ADMIN = "admin"
    SEGMENT_OWNER = "segment_owner"
    RESEARCHER = "researcher"
    APPROVER = "approver"
    SDR = "sdr"
    MARKETING = "marketing"


class UserStatusEnum(str, enum.Enum):
    """User status enumeration matching PostgreSQL enum."""

    ACTIVE = "active"
    DEACTIVATED = "deactivated"


class User(Base, UUIDPKMixin, TimestampMixin):
    """User model."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[UserStatusEnum] = mapped_column(
        SAEnum(UserStatusEnum, name="user_status", create_type=False),
        nullable=False,
        default=UserStatusEnum.ACTIVE,
        server_default="active",
        index=True
    )

    # Relationships
    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    preferences: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Reverse relationships (companies/segments created by this user, etc.)
    created_segments: Mapped[list["Segment"]] = relationship(
        "Segment",
        back_populates="created_by_user",
        foreign_keys="Segment.created_by"
    )
    created_companies: Mapped[list["Company"]] = relationship(
        "Company",
        back_populates="created_by_user",
        foreign_keys="Company.created_by"
    )
    created_contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="created_by_user",
        foreign_keys="Contact.created_by"
    )
    assigned_contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="assigned_sdr",
        foreign_keys="Contact.assigned_sdr_id"
    )
    assignments_made: Mapped[list["Assignment"]] = relationship(
        "Assignment",
        back_populates="assigned_by_user",
        foreign_keys="Assignment.assigned_by"
    )
    assignments_received: Mapped[list["Assignment"]] = relationship(
        "Assignment",
        back_populates="assigned_to_user",
        foreign_keys="Assignment.assigned_to"
    )
    upload_batches: Mapped[list["UploadBatch"]] = relationship(
        "UploadBatch",
        back_populates="uploaded_by_user"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="actor"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        foreign_keys="Notification.user_id"
    )
    triggered_notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="actor",
        foreign_keys="Notification.actor_id"
    )
    created_marketing_collateral: Mapped[list["MarketingCollateral"]] = relationship(
        "MarketingCollateral",
        back_populates="created_by_user"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, status={self.status})>"


class UserRole(Base, TimestampMixin):
    """User role junction table (multi-role support)."""

    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=True),
        primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[UserRoleEnum] = mapped_column(
        SAEnum(UserRoleEnum, name="user_role", create_type=False),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_roles")

    __table_args__ = (
        UniqueConstraint("user_id", "role", name="unique_user_role"),
    )

    def __repr__(self) -> str:
        return f"<UserRole(id={self.id}, user_id={self.user_id}, role={self.role})>"


class RoleGrant(Base, TimestampMixin):
    """Role-based permission grants (Drupal-inspired RBAC)."""

    __tablename__ = "role_grants"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=True),
        primary_key=True
    )
    role: Mapped[UserRoleEnum] = mapped_column(
        SAEnum(UserRoleEnum, name="user_role", create_type=False),
        nullable=False,
        index=True
    )
    action: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("role", "action", name="unique_role_action"),
    )

    def __repr__(self) -> str:
        return f"<RoleGrant(id={self.id}, role={self.role}, action={self.action}, granted={self.granted})>"


class UserPreference(Base, UUIDPKMixin, TimestampMixin):
    """User preferences for UI settings."""

    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    sidebar_theme: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="light",
        server_default="light"
    )
    notification_preferences: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default={"email": True, "in_app": True},
        server_default='{"email": true, "in_app": true}'
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreference(id={self.id}, user_id={self.user_id}, theme={self.sidebar_theme})>"
