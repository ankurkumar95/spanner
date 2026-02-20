"""
Segment and Offering service layer.

Handles business logic for segment and offering CRUD operations.
"""

from uuid import UUID

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company, CompanyStatusEnum
from app.models.contact import Contact
from app.models.segment import Segment, Offering, SegmentOffering, SegmentStatusEnum, OfferingStatusEnum
from app.schemas.segment import SegmentCreate, SegmentUpdate, OfferingCreate, OfferingUpdate


# Segment Service Functions

async def create_segment(
    db: AsyncSession,
    data: SegmentCreate,
    created_by: UUID
) -> Segment:
    """
    Create a new segment with associated offerings.

    Args:
        db: Database session
        data: Segment creation data
        created_by: UUID of user creating the segment

    Returns:
        Created Segment instance with offerings loaded
    """
    # Create segment instance
    segment = Segment(
        name=data.name,
        description=data.description,
        research_filter_requirements=data.research_filter_requirements,
        status=data.status,
        created_by=created_by
    )

    db.add(segment)
    await db.flush()  # Flush to get the segment ID

    # Create segment-offering associations if provided
    if data.offering_ids:
        for offering_id in data.offering_ids:
            segment_offering = SegmentOffering(
                segment_id=segment.id,
                offering_id=offering_id
            )
            db.add(segment_offering)

    await db.flush()
    await db.refresh(segment, ["offerings", "created_by_user"])

    return segment


async def get_segment(db: AsyncSession, segment_id: UUID) -> Segment | None:
    """
    Get segment by ID with eager-loaded offerings.

    Args:
        db: Database session
        segment_id: Segment UUID

    Returns:
        Segment instance if found, None otherwise
    """
    stmt = (
        select(Segment)
        .where(Segment.id == segment_id)
        .options(selectinload(Segment.offerings), selectinload(Segment.created_by_user))
    )

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_segments(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status_filter: SegmentStatusEnum | None = None,
    search: str | None = None
) -> list[Segment]:
    """
    List segments with pagination and optional filters.

    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        status_filter: Optional status filter
        search: Optional case-insensitive search on name

    Returns:
        List of Segment instances with offerings loaded
    """
    stmt = select(Segment).options(selectinload(Segment.offerings), selectinload(Segment.created_by_user))

    # Apply filters
    conditions = []
    if status_filter:
        conditions.append(Segment.status == status_filter)
    if search:
        escaped = search.replace("%", "\\%").replace("_", "\\_")
        conditions.append(Segment.name.ilike(f"%{escaped}%"))

    if conditions:
        stmt = stmt.where(and_(*conditions))

    # Apply ordering and pagination
    stmt = stmt.order_by(Segment.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def count_segments(
    db: AsyncSession,
    status_filter: SegmentStatusEnum | None = None,
    search: str | None = None
) -> int:
    """
    Count total segments with optional filters.

    Args:
        db: Database session
        status_filter: Optional status filter
        search: Optional case-insensitive search on name

    Returns:
        Total count of matching segments
    """
    stmt = select(func.count(Segment.id))

    # Apply filters
    conditions = []
    if status_filter:
        conditions.append(Segment.status == status_filter)
    if search:
        escaped = search.replace("%", "\\%").replace("_", "\\_")
        conditions.append(Segment.name.ilike(f"%{escaped}%"))

    if conditions:
        stmt = stmt.where(and_(*conditions))

    result = await db.execute(stmt)
    count = result.scalar()

    return count or 0


async def update_segment(
    db: AsyncSession,
    segment_id: UUID,
    data: SegmentUpdate
) -> Segment:
    """
    Update segment fields and optionally replace offerings.

    Args:
        db: Database session
        segment_id: Segment UUID
        data: Segment update data

    Returns:
        Updated Segment instance

    Raises:
        ValueError: If segment not found
    """
    # Fetch segment
    segment = await get_segment(db, segment_id)
    if not segment:
        raise ValueError(f"Segment with id {segment_id} not found")

    # Update basic fields
    update_data = data.model_dump(exclude_unset=True, exclude={"offering_ids"})
    for field, value in update_data.items():
        setattr(segment, field, value)

    # Replace offerings if provided
    if data.offering_ids is not None:
        # Delete existing segment-offering associations
        delete_stmt = select(SegmentOffering).where(SegmentOffering.segment_id == segment_id)
        result = await db.execute(delete_stmt)
        existing_associations = result.scalars().all()
        for assoc in existing_associations:
            await db.delete(assoc)

        # Create new associations
        for offering_id in data.offering_ids:
            segment_offering = SegmentOffering(
                segment_id=segment_id,
                offering_id=offering_id
            )
            db.add(segment_offering)

    await db.flush()
    await db.refresh(segment, ["offerings", "created_by_user"])

    return segment


async def archive_segment(db: AsyncSession, segment_id: UUID) -> Segment:
    """
    Archive a segment by setting status to archived.

    Args:
        db: Database session
        segment_id: Segment UUID to archive

    Returns:
        Archived Segment instance

    Raises:
        ValueError: If segment not found
    """
    segment = await get_segment(db, segment_id)
    if not segment:
        raise ValueError(f"Segment with id {segment_id} not found")

    segment.status = SegmentStatusEnum.ARCHIVED

    await db.flush()
    await db.refresh(segment)

    return segment


async def get_segment_stats(db: AsyncSession, segment_id: UUID) -> dict:
    """
    Get statistics for a segment (company count, contact count, pending companies).

    Args:
        db: Database session
        segment_id: Segment UUID

    Returns:
        Dictionary with company_count, contact_count, pending_company_count
    """
    # Count total companies in segment
    company_count_stmt = select(func.count(Company.id)).where(Company.segment_id == segment_id)
    company_result = await db.execute(company_count_stmt)
    company_count = company_result.scalar() or 0

    # Count pending companies in segment
    pending_company_count_stmt = select(func.count(Company.id)).where(
        and_(
            Company.segment_id == segment_id,
            Company.status == CompanyStatusEnum.PENDING
        )
    )
    pending_result = await db.execute(pending_company_count_stmt)
    pending_company_count = pending_result.scalar() or 0

    # Count total contacts in segment
    contact_count_stmt = select(func.count(Contact.id)).where(Contact.segment_id == segment_id)
    contact_result = await db.execute(contact_count_stmt)
    contact_count = contact_result.scalar() or 0

    return {
        "company_count": company_count,
        "contact_count": contact_count,
        "pending_company_count": pending_company_count
    }


# Offering Service Functions

async def create_offering(db: AsyncSession, data: OfferingCreate) -> Offering:
    """
    Create a new offering.

    Args:
        db: Database session
        data: Offering creation data

    Returns:
        Created Offering instance
    """
    offering = Offering(
        name=data.name,
        description=data.description,
        status=data.status
    )

    db.add(offering)
    await db.flush()
    await db.refresh(offering)

    return offering


async def get_offering(db: AsyncSession, offering_id: UUID) -> Offering | None:
    """
    Get offering by ID.

    Args:
        db: Database session
        offering_id: Offering UUID

    Returns:
        Offering instance if found, None otherwise
    """
    stmt = select(Offering).where(Offering.id == offering_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_offerings(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status_filter: OfferingStatusEnum | None = None,
    search: str | None = None
) -> list[Offering]:
    """
    List offerings with pagination, optional status filter, and search.

    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        status_filter: Optional status filter
        search: Optional search string (case-insensitive name match)

    Returns:
        List of Offering instances
    """
    stmt = select(Offering)

    # Apply status filter
    if status_filter:
        stmt = stmt.where(Offering.status == status_filter)

    # Apply search filter
    if search:
        stmt = stmt.where(Offering.name.ilike(f"%{search}%"))

    # Apply ordering and pagination
    stmt = stmt.order_by(Offering.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def count_offerings(
    db: AsyncSession,
    status_filter: OfferingStatusEnum | None = None
) -> int:
    """
    Count total offerings with optional status filter.

    Args:
        db: Database session
        status_filter: Optional status filter

    Returns:
        Total count of offerings
    """
    stmt = select(func.count(Offering.id))

    if status_filter:
        stmt = stmt.where(Offering.status == status_filter)

    result = await db.execute(stmt)
    count = result.scalar()

    return count or 0


async def update_offering(
    db: AsyncSession,
    offering_id: UUID,
    data: OfferingUpdate
) -> Offering:
    """
    Update offering fields.

    Args:
        db: Database session
        offering_id: Offering UUID
        data: Offering update data

    Returns:
        Updated Offering instance

    Raises:
        ValueError: If offering not found
    """
    offering = await get_offering(db, offering_id)
    if not offering:
        raise ValueError(f"Offering with id {offering_id} not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offering, field, value)

    await db.flush()
    await db.refresh(offering)

    return offering
