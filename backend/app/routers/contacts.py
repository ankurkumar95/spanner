"""
Contact management endpoints for creating, updating, and managing contacts.

Supports the contact status pipeline:
uploaded -> approved -> assigned_to_sdr -> meeting_scheduled
"""

import logging
import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactApproval,
    ContactAssignment
)
from app.services import contact_service

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactListResponse(BaseModel):
    """Response schema for paginated contact list."""

    contacts: list[ContactResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class BulkAssignmentRequest(BaseModel):
    """Request schema for bulk contact assignment."""

    contact_ids: list[UUID] = Field(..., min_length=1, description="List of contact UUIDs")
    assigned_sdr_id: UUID = Field(..., description="UUID of SDR to assign contacts to")


class MarkDuplicateRequest(BaseModel):
    """Request schema for marking contact as duplicate."""

    is_duplicate: bool = Field(..., description="Whether contact is duplicate")


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


@router.get("", response_model=ContactListResponse, status_code=status.HTTP_200_OK)
async def list_contacts(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    company_id: UUID | None = Query(None, description="Filter by company ID"),
    segment_id: UUID | None = Query(None, description="Filter by segment ID"),
    status_filter: str | None = Query(None, description="Filter by contact status"),
    search: str | None = Query(None, description="Search by name or email"),
    assigned_sdr_id: UUID | None = Query(None, description="Filter by assigned SDR"),
    is_duplicate: bool | None = Query(None, description="Filter by duplicate flag"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    List contacts with pagination and filtering.

    Supports filtering by company, segment, status, assigned SDR, and duplicate flag.
    Also supports searching by first name, last name, or email.
    """
    skip = (page - 1) * per_page

    # Fetch contacts and total count
    contacts = await contact_service.list_contacts(
        db,
        skip=skip,
        limit=per_page,
        company_id=company_id,
        segment_id=segment_id,
        status_filter=status_filter,
        search=search,
        assigned_sdr_id=assigned_sdr_id,
        is_duplicate=is_duplicate
    )

    total = await contact_service.count_contacts(
        db,
        company_id=company_id,
        segment_id=segment_id,
        status_filter=status_filter,
        search=search,
        assigned_sdr_id=assigned_sdr_id,
        is_duplicate=is_duplicate
    )

    total_pages = math.ceil(total / per_page) if total > 0 else 0

    logger.info(
        f"Contact list requested by {current_user['email']} - "
        f"Page: {page}, Per page: {per_page}, Total: {total}"
    )

    return ContactListResponse(
        contacts=[ContactResponse.model_validate(contact) for contact in contacts],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("researcher", "approver", "admin"))
):
    """
    Create a new contact.

    Requires: researcher, approver, or admin role

    Auto-derives segment_id from the company's segment.
    """
    try:
        created_by = UUID(current_user["id"])
        contact = await contact_service.create_contact(
            db,
            data=contact_data,
            created_by=created_by
        )

        logger.info(
            f"Contact created: {contact.email} (ID: {contact.id}) "
            f"for company {contact.company_id} by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to create contact: {str(e)} by {current_user['email']}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create contact: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create contact: {str(e)}"
        )


@router.get("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
async def get_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get detailed information about a specific contact.

    Returns contact with company and segment information.
    """
    contact = await contact_service.get_contact(db, contact_id)

    if not contact:
        logger.warning(f"Contact not found: {contact_id} (requested by {current_user['email']})")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found"
        )

    logger.info(f"Contact detail retrieved: {contact.email} by {current_user['email']}")

    return ContactResponse.model_validate(contact)


@router.patch("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update contact information.

    Allows updating any contact fields except status (use specific endpoints for status changes).
    """
    try:
        contact = await contact_service.update_contact(db, contact_id, contact_data)

        logger.info(
            f"Contact updated: {contact.email} (ID: {contact_id}) by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to update contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to update contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update contact: {str(e)}"
        )


@router.post(
    "/{contact_id}/approve",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK
)
async def approve_contact(
    contact_id: UUID,
    approval: ContactApproval,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("approver", "admin"))
):
    """
    Approve a contact (move from uploaded to approved status).

    Requires: approver or admin role

    Status pipeline: uploaded -> approved
    """
    try:
        user_id = UUID(current_user["id"])
        contact = await contact_service.approve_contact(db, contact_id, approval, approved_by=user_id)

        logger.info(
            f"Contact approved: {contact.email} (ID: {contact_id}) by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to approve contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to approve contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve contact: {str(e)}"
        )


@router.post(
    "/{contact_id}/assign",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK
)
async def assign_contact_to_sdr(
    contact_id: UUID,
    assignment: ContactAssignment,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("approver", "admin"))
):
    """
    Assign a contact to an SDR (move from approved to assigned_to_sdr status).

    Requires: approver or admin role
    Status pipeline: approved -> assigned_to_sdr
    """
    try:
        contact = await contact_service.assign_to_sdr(
            db,
            contact_id,
            assignment.assigned_sdr_id
        )

        logger.info(
            f"Contact assigned: {contact.email} (ID: {contact_id}) "
            f"to SDR {assignment.assigned_sdr_id} by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to assign contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to assign contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign contact: {str(e)}"
        )


@router.post("/bulk-assign", response_model=list[ContactResponse], status_code=status.HTTP_200_OK)
async def bulk_assign_contacts(
    request: BulkAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("approver", "admin"))
):
    """
    Bulk assign multiple contacts to an SDR.

    Requires: approver or admin role.
    All contacts must be in 'approved' status.
    """
    try:
        contacts = await contact_service.bulk_assign_to_sdr(
            db,
            request.contact_ids,
            request.assigned_sdr_id
        )

        logger.info(
            f"Bulk assignment: {len(contacts)} contacts assigned to SDR "
            f"{request.assigned_sdr_id} by {current_user['email']}"
        )

        return [ContactResponse.model_validate(contact) for contact in contacts]

    except ValueError as e:
        logger.warning(f"Failed bulk assignment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed bulk assignment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign contacts: {str(e)}"
        )


@router.post(
    "/{contact_id}/meeting-scheduled",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK
)
async def mark_meeting_scheduled(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("sdr", "approver", "admin"))
):
    """
    Mark a contact as having a meeting scheduled.

    Requires: sdr, approver, or admin role
    Status pipeline: assigned_to_sdr -> meeting_scheduled
    """
    try:
        contact = await contact_service.mark_meeting_scheduled(db, contact_id)

        logger.info(
            f"Meeting scheduled for contact: {contact.email} (ID: {contact_id}) "
            f"by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to mark meeting scheduled for contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to mark meeting scheduled for contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark meeting scheduled: {str(e)}"
        )


@router.post(
    "/{contact_id}/duplicate",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK
)
async def mark_contact_duplicate(
    contact_id: UUID,
    request: MarkDuplicateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark or unmark a contact as duplicate.

    Allows toggling the duplicate flag without affecting status pipeline.
    """
    try:
        contact = await contact_service.mark_duplicate(
            db,
            contact_id,
            request.is_duplicate
        )

        action = "marked as duplicate" if request.is_duplicate else "unmarked as duplicate"
        logger.info(
            f"Contact {action}: {contact.email} (ID: {contact_id}) by {current_user['email']}"
        )

        return ContactResponse.model_validate(contact)

    except ValueError as e:
        logger.warning(f"Failed to mark duplicate for contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to mark duplicate for contact {contact_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark duplicate: {str(e)}"
        )
