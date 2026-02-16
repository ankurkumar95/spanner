"""
Contact service layer for managing contact CRUD operations and status pipeline.

Handles business logic for contact management including creation, updates,
status pipeline (uploaded -> approved -> assigned_to_sdr -> meeting_scheduled),
SDR assignment, and duplicate flagging.
"""

from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contact import Contact, ContactStatusEnum
from app.models.company import Company
from app.schemas.contact import ContactCreate, ContactUpdate, ContactApproval


async def create_contact(
    db: AsyncSession,
    data: ContactCreate,
    created_by: UUID
) -> Contact:
    """
    Create a new contact and auto-derive segment_id from company.

    Args:
        db: Database session
        data: Contact creation data
        created_by: UUID of user creating the contact

    Returns:
        Created Contact instance with relationships loaded

    Raises:
        ValueError: If company not found or segment_id cannot be derived
    """
    # Fetch company to get segment_id
    company_result = await db.execute(
        select(Company).where(Company.id == data.company_id)
    )
    company = company_result.scalar_one_or_none()

    if not company:
        raise ValueError(f"Company with ID {data.company_id} not found")

    # Create contact with auto-derived segment_id
    contact = Contact(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        mobile_phone=data.mobile_phone,
        job_title=data.job_title,
        direct_phone_number=data.direct_phone_number,
        email_address_2=data.email_address_2,
        email_active_status=data.email_active_status,
        lead_source_global=data.lead_source_global,
        management_level=data.management_level,
        street=data.street,
        city=data.city,
        state_province=data.state_province,
        country_region=data.country_region,
        zip_postal_code=data.zip_postal_code,
        primary_time_zone=data.primary_time_zone,
        contact_linkedin_url=data.contact_linkedin_url,
        linkedin_summary=data.linkedin_summary,
        data_requester_details=data.data_requester_details,
        company_id=data.company_id,
        segment_id=company.segment_id,
        status=ContactStatusEnum.UPLOADED,
        created_by=created_by
    )

    db.add(contact)
    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def get_contact(db: AsyncSession, contact_id: UUID) -> Contact | None:
    """
    Get a contact by ID with eager-loaded company and segment.

    Args:
        db: Database session
        contact_id: UUID of contact to retrieve

    Returns:
        Contact instance or None if not found
    """
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.company), selectinload(Contact.segment))
        .where(Contact.id == contact_id)
    )
    return result.scalar_one_or_none()


async def list_contacts(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    company_id: UUID | None = None,
    segment_id: UUID | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    assigned_sdr_id: UUID | None = None,
    is_duplicate: bool | None = None
) -> list[Contact]:
    """
    List contacts with pagination and filters.

    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        company_id: Filter by company ID
        segment_id: Filter by segment ID
        status_filter: Filter by contact status
        search: Search term for first_name, last_name, or email (case-insensitive)
        assigned_sdr_id: Filter by assigned SDR
        is_duplicate: Filter by duplicate flag

    Returns:
        List of Contact instances
    """
    query = select(Contact).options(
        selectinload(Contact.company),
        selectinload(Contact.segment)
    )

    # Apply filters
    if company_id:
        query = query.where(Contact.company_id == company_id)

    if segment_id:
        query = query.where(Contact.segment_id == segment_id)

    if status_filter:
        try:
            status_enum = ContactStatusEnum(status_filter)
            query = query.where(Contact.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter

    if assigned_sdr_id:
        query = query.where(Contact.assigned_sdr_id == assigned_sdr_id)

    if is_duplicate is not None:
        query = query.where(Contact.is_duplicate == is_duplicate)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Contact.first_name.ilike(search_pattern),
                Contact.last_name.ilike(search_pattern),
                Contact.email.ilike(search_pattern)
            )
        )

    # Apply pagination and ordering
    query = query.order_by(Contact.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_contacts(
    db: AsyncSession,
    company_id: UUID | None = None,
    segment_id: UUID | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    assigned_sdr_id: UUID | None = None,
    is_duplicate: bool | None = None
) -> int:
    """
    Count contacts matching the given filters.

    Args:
        db: Database session
        company_id: Filter by company ID
        segment_id: Filter by segment ID
        status_filter: Filter by contact status
        search: Search term for first_name, last_name, or email
        assigned_sdr_id: Filter by assigned SDR
        is_duplicate: Filter by duplicate flag

    Returns:
        Count of matching contacts
    """
    query = select(func.count(Contact.id))

    # Apply same filters as list_contacts
    if company_id:
        query = query.where(Contact.company_id == company_id)

    if segment_id:
        query = query.where(Contact.segment_id == segment_id)

    if status_filter:
        try:
            status_enum = ContactStatusEnum(status_filter)
            query = query.where(Contact.status == status_enum)
        except ValueError:
            pass

    if assigned_sdr_id:
        query = query.where(Contact.assigned_sdr_id == assigned_sdr_id)

    if is_duplicate is not None:
        query = query.where(Contact.is_duplicate == is_duplicate)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Contact.first_name.ilike(search_pattern),
                Contact.last_name.ilike(search_pattern),
                Contact.email.ilike(search_pattern)
            )
        )

    result = await db.execute(query)
    return result.scalar() or 0


async def update_contact(
    db: AsyncSession,
    contact_id: UUID,
    data: ContactUpdate
) -> Contact:
    """
    Update contact fields.

    Args:
        db: Database session
        contact_id: UUID of contact to update
        data: Contact update data

    Returns:
        Updated Contact instance

    Raises:
        ValueError: If contact not found
    """
    contact = await get_contact(db, contact_id)

    if not contact:
        raise ValueError(f"Contact with ID {contact_id} not found")

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(contact, field):
            setattr(contact, field, value)

    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def approve_contact(
    db: AsyncSession,
    contact_id: UUID,
    approval: ContactApproval
) -> Contact:
    """
    Approve contact (set status to approved).

    Args:
        db: Database session
        contact_id: UUID of contact to approve
        approval: Contact approval data with status

    Returns:
        Updated Contact instance

    Raises:
        ValueError: If contact not found or invalid status transition
    """
    contact = await get_contact(db, contact_id)

    if not contact:
        raise ValueError(f"Contact with ID {contact_id} not found")

    # Validate status is approved
    if approval.status != ContactStatusEnum.APPROVED:
        raise ValueError("Approval status must be 'approved'")

    # Validate status pipeline: uploaded -> approved
    if contact.status != ContactStatusEnum.UPLOADED:
        raise ValueError(
            f"Cannot approve contact with status '{contact.status}'. "
            f"Contact must be in 'uploaded' status."
        )

    contact.status = ContactStatusEnum.APPROVED

    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def assign_to_sdr(
    db: AsyncSession,
    contact_id: UUID,
    sdr_id: UUID
) -> Contact:
    """
    Assign contact to an SDR and update status to assigned_to_sdr.

    Args:
        db: Database session
        contact_id: UUID of contact to assign
        sdr_id: UUID of SDR to assign contact to

    Returns:
        Updated Contact instance

    Raises:
        ValueError: If contact not found or invalid status transition
    """
    contact = await get_contact(db, contact_id)

    if not contact:
        raise ValueError(f"Contact with ID {contact_id} not found")

    # Validate status pipeline: approved -> assigned_to_sdr
    if contact.status != ContactStatusEnum.APPROVED:
        raise ValueError(
            f"Cannot assign contact with status '{contact.status}'. "
            f"Contact must be in 'approved' status."
        )

    contact.assigned_sdr_id = sdr_id
    contact.status = ContactStatusEnum.ASSIGNED_TO_SDR

    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def bulk_assign_to_sdr(
    db: AsyncSession,
    contact_ids: list[UUID],
    sdr_id: UUID
) -> list[Contact]:
    """
    Bulk assign multiple contacts to an SDR.

    Args:
        db: Database session
        contact_ids: List of contact UUIDs to assign
        sdr_id: UUID of SDR to assign contacts to

    Returns:
        List of updated Contact instances

    Raises:
        ValueError: If any contact not found or has invalid status
    """
    updated_contacts = []

    for contact_id in contact_ids:
        contact = await assign_to_sdr(db, contact_id, sdr_id)
        updated_contacts.append(contact)

    return updated_contacts


async def mark_meeting_scheduled(
    db: AsyncSession,
    contact_id: UUID
) -> Contact:
    """
    Mark contact as having a meeting scheduled.

    Args:
        db: Database session
        contact_id: UUID of contact

    Returns:
        Updated Contact instance

    Raises:
        ValueError: If contact not found or invalid status transition
    """
    contact = await get_contact(db, contact_id)

    if not contact:
        raise ValueError(f"Contact with ID {contact_id} not found")

    # Validate status pipeline: assigned_to_sdr -> meeting_scheduled
    if contact.status != ContactStatusEnum.ASSIGNED_TO_SDR:
        raise ValueError(
            f"Cannot mark meeting scheduled for contact with status '{contact.status}'. "
            f"Contact must be in 'assigned_to_sdr' status."
        )

    contact.status = ContactStatusEnum.MEETING_SCHEDULED

    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def mark_duplicate(
    db: AsyncSession,
    contact_id: UUID,
    is_duplicate: bool
) -> Contact:
    """
    Mark or unmark contact as duplicate.

    Args:
        db: Database session
        contact_id: UUID of contact
        is_duplicate: Whether to mark as duplicate

    Returns:
        Updated Contact instance

    Raises:
        ValueError: If contact not found
    """
    contact = await get_contact(db, contact_id)

    if not contact:
        raise ValueError(f"Contact with ID {contact_id} not found")

    contact.is_duplicate = is_duplicate

    await db.flush()
    await db.refresh(contact, ["company", "segment"])

    return contact


async def get_contacts_by_company(
    db: AsyncSession,
    company_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> list[Contact]:
    """
    Get all contacts for a specific company.

    Args:
        db: Database session
        company_id: UUID of company
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of Contact instances
    """
    return await list_contacts(
        db,
        skip=skip,
        limit=limit,
        company_id=company_id
    )


async def get_contacts_by_sdr(
    db: AsyncSession,
    sdr_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> list[Contact]:
    """
    Get all contacts assigned to a specific SDR.

    Args:
        db: Database session
        sdr_id: UUID of SDR
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of Contact instances
    """
    return await list_contacts(
        db,
        skip=skip,
        limit=limit,
        assigned_sdr_id=sdr_id
    )
