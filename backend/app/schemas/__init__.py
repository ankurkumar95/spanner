"""Pydantic schemas for Spanner CRM API."""

from app.schemas.common import (
    MessageResponse,
    PaginatedResponse,
    IDResponse,
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserBrief,
    UserWithRoles,
    RoleGrantResponse,
    RoleGrantCreate,
    RoleGrantUpdate,
    UserRoleResponse,
    UserPreferenceResponse,
    UserPreferenceUpdate,
)
from app.schemas.segment import (
    SegmentCreate,
    SegmentUpdate,
    SegmentResponse,
    SegmentBrief,
    SegmentWithStats,
    OfferingCreate,
    OfferingUpdate,
    OfferingResponse,
    OfferingBrief,
)
from app.schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyBrief,
    CompanyApproval,
    CompanyWithContacts,
)
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactBrief,
    ContactApproval,
    ContactAssignment,
    ContactWithCompany,
)
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentBulkCreate,
    AssignmentResponse,
    AssignmentDelete,
)
from app.schemas.upload_batch import (
    UploadBatchCreate,
    UploadBatchUpdate,
    UploadBatchResponse,
    UploadBatchWithProgress,
)
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationMarkRead,
    NotificationBulkMarkRead,
    NotificationStats,
)
from app.schemas.audit_log import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogFilter,
)
from app.schemas.marketing_collateral import (
    MarketingCollateralCreate,
    MarketingCollateralUpdate,
    MarketingCollateralResponse,
    MarketingCollateralBrief,
)

__all__ = [
    # Common
    "MessageResponse",
    "PaginatedResponse",
    "IDResponse",
    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserBrief",
    "UserWithRoles",
    "RoleGrantResponse",
    "RoleGrantCreate",
    "RoleGrantUpdate",
    "UserRoleResponse",
    "UserPreferenceResponse",
    "UserPreferenceUpdate",
    # Segment schemas
    "SegmentCreate",
    "SegmentUpdate",
    "SegmentResponse",
    "SegmentBrief",
    "SegmentWithStats",
    "OfferingCreate",
    "OfferingUpdate",
    "OfferingResponse",
    "OfferingBrief",
    # Company schemas
    "CompanyCreate",
    "CompanyUpdate",
    "CompanyResponse",
    "CompanyBrief",
    "CompanyApproval",
    "CompanyWithContacts",
    # Contact schemas
    "ContactCreate",
    "ContactUpdate",
    "ContactResponse",
    "ContactBrief",
    "ContactApproval",
    "ContactAssignment",
    "ContactWithCompany",
    # Assignment schemas
    "AssignmentCreate",
    "AssignmentBulkCreate",
    "AssignmentResponse",
    "AssignmentDelete",
    # Upload batch schemas
    "UploadBatchCreate",
    "UploadBatchUpdate",
    "UploadBatchResponse",
    "UploadBatchWithProgress",
    # Notification schemas
    "NotificationCreate",
    "NotificationResponse",
    "NotificationMarkRead",
    "NotificationBulkMarkRead",
    "NotificationStats",
    # Audit log schemas
    "AuditLogCreate",
    "AuditLogResponse",
    "AuditLogFilter",
    # Marketing collateral schemas
    "MarketingCollateralCreate",
    "MarketingCollateralUpdate",
    "MarketingCollateralResponse",
    "MarketingCollateralBrief",
]
