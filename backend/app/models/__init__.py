"""SQLAlchemy models for Spanner CRM.

All models are imported here for Alembic auto-discovery.
"""

from app.models.base import Base, BaseModel, TimestampMixin, UUIDPKMixin
from app.models.user import (
    User,
    UserRole,
    RoleGrant,
    UserPreference,
    UserRoleEnum,
    UserStatusEnum,
)
from app.models.segment import (
    Segment,
    Offering,
    SegmentOffering,
    SegmentStatusEnum,
    OfferingStatusEnum,
)
from app.models.company import Company, CompanyStatusEnum
from app.models.contact import Contact, ContactStatusEnum
from app.models.assignment import Assignment, EntityTypeEnum
from app.models.upload_batch import (
    UploadBatch,
    UploadTypeEnum,
    BatchStatusEnum,
)
from app.models.audit_log import AuditLog
from app.models.notification import Notification, NotificationTypeEnum
from app.models.marketing_collateral import MarketingCollateral

__all__ = [
    # Base
    "Base",
    "BaseModel",
    "TimestampMixin",
    "UUIDPKMixin",
    # User models
    "User",
    "UserRole",
    "RoleGrant",
    "UserPreference",
    "UserRoleEnum",
    "UserStatusEnum",
    # Segment models
    "Segment",
    "Offering",
    "SegmentOffering",
    "SegmentStatusEnum",
    "OfferingStatusEnum",
    # Company model
    "Company",
    "CompanyStatusEnum",
    # Contact model
    "Contact",
    "ContactStatusEnum",
    # Assignment model
    "Assignment",
    "EntityTypeEnum",
    # Upload batch models
    "UploadBatch",
    "UploadTypeEnum",
    "BatchStatusEnum",
    # Audit log model
    "AuditLog",
    # Notification model
    "Notification",
    "NotificationTypeEnum",
    # Marketing collateral model
    "MarketingCollateral",
]
