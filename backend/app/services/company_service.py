"""Company service layer for business logic."""
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company, CompanyStatusEnum
from app.models.contact import Contact
from app.schemas.company import CompanyApproval, CompanyCreate, CompanyUpdate


async def create_company(
    db: AsyncSession,
    data: CompanyCreate,
    created_by: UUID
) -> Company:
    """
    Create a new company with pending status.

    Args:
        db: Database session
        data: Company creation data
        created_by: UUID of user creating the company

    Returns:
        Created company instance
    """
    company = Company(
        company_name=data.company_name,
        company_website=data.company_website,
        company_phone=data.company_phone,
        company_description=data.company_description,
        company_linkedin_url=data.company_linkedin_url,
        company_industry=data.company_industry,
        company_sub_industry=data.company_sub_industry,
        street=data.street,
        city=data.city,
        state_province=data.state_province,
        country_region=data.country_region,
        zip_postal_code=data.zip_postal_code,
        founded_year=data.founded_year,
        revenue_range=data.revenue_range,
        employee_size_range=data.employee_size_range,
        segment_id=data.segment_id,
        status=CompanyStatusEnum.PENDING,
        created_by=created_by
    )

    db.add(company)
    await db.flush()
    await db.refresh(company, ["segment", "created_by_user"])

    return company


async def get_company(
    db: AsyncSession,
    company_id: UUID
) -> Company | None:
    """
    Get a company by ID with eager-loaded segment.

    Args:
        db: Database session
        company_id: Company UUID

    Returns:
        Company instance or None if not found
    """
    query = (
        select(Company)
        .where(Company.id == company_id)
        .options(selectinload(Company.segment), selectinload(Company.created_by_user), selectinload(Company.approved_by_user))
    )

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_companies(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    segment_id: UUID | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    is_duplicate: bool | None = None
) -> list[Company]:
    """
    List companies with pagination and filters.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        segment_id: Optional segment filter
        status_filter: Optional status filter
        search: Optional case-insensitive company name search
        is_duplicate: Optional duplicate flag filter

    Returns:
        List of company instances
    """
    query = select(Company).options(selectinload(Company.segment), selectinload(Company.created_by_user), selectinload(Company.approved_by_user))

    # Apply filters
    if segment_id is not None:
        query = query.where(Company.segment_id == segment_id)

    if status_filter is not None:
        try:
            status_enum = CompanyStatusEnum(status_filter)
            query = query.where(Company.status == status_enum)
        except ValueError:
            # Invalid status filter, return empty list
            return []

    if search is not None and search.strip():
        escaped = search.replace("%", "\\%").replace("_", "\\_")
        query = query.where(Company.company_name.ilike(f"%{escaped}%"))

    if is_duplicate is not None:
        query = query.where(Company.is_duplicate == is_duplicate)

    # Apply pagination and ordering
    query = query.order_by(Company.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_companies(
    db: AsyncSession,
    segment_id: UUID | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    is_duplicate: bool | None = None
) -> int:
    """
    Count companies matching filters.

    Args:
        db: Database session
        segment_id: Optional segment filter
        status_filter: Optional status filter
        search: Optional case-insensitive company name search
        is_duplicate: Optional duplicate flag filter

    Returns:
        Count of matching companies
    """
    query = select(func.count(Company.id))

    # Apply filters
    if segment_id is not None:
        query = query.where(Company.segment_id == segment_id)

    if status_filter is not None:
        try:
            status_enum = CompanyStatusEnum(status_filter)
            query = query.where(Company.status == status_enum)
        except ValueError:
            # Invalid status filter, return 0
            return 0

    if search is not None and search.strip():
        escaped = search.replace("%", "\\%").replace("_", "\\_")
        query = query.where(Company.company_name.ilike(f"%{escaped}%"))

    if is_duplicate is not None:
        query = query.where(Company.is_duplicate == is_duplicate)

    result = await db.execute(query)
    return result.scalar_one()


async def update_company(
    db: AsyncSession,
    company_id: UUID,
    data: CompanyUpdate
) -> Company:
    """
    Update a company's fields.

    Args:
        db: Database session
        company_id: Company UUID
        data: Company update data

    Returns:
        Updated company instance

    Raises:
        ValueError: If company not found
    """
    company = await get_company(db, company_id)

    if company is None:
        raise ValueError(f"Company with id {company_id} not found")

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(company, field, value)

    await db.flush()
    await db.refresh(company, ["segment", "created_by_user"])

    return company


async def approve_company(
    db: AsyncSession,
    company_id: UUID,
    approval: CompanyApproval,
    approved_by: UUID | None = None
) -> Company:
    """
    Approve or reject a company.

    Args:
        db: Database session
        company_id: Company UUID
        approval: Approval decision with optional rejection reason

    Returns:
        Updated company instance

    Raises:
        ValueError: If company not found or status transition invalid
    """
    company = await get_company(db, company_id)

    if company is None:
        raise ValueError(f"Company with id {company_id} not found")

    # Validate status transition (only pending companies can be approved/rejected)
    if company.status != CompanyStatusEnum.PENDING:
        raise ValueError(
            f"Cannot approve/reject company with status {company.status}. "
            "Only pending companies can be approved or rejected."
        )

    # Update status and rejection reason
    company.status = approval.status
    company.rejection_reason = approval.rejection_reason
    if approved_by:
        company.approved_by = approved_by
        company.approved_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(company, ["segment", "created_by_user", "approved_by_user"])

    return company


async def get_pending_companies(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50
) -> list[Company]:
    """
    Get companies awaiting approval.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of pending companies
    """
    query = (
        select(Company)
        .where(Company.status == CompanyStatusEnum.PENDING)
        .options(selectinload(Company.segment), selectinload(Company.created_by_user), selectinload(Company.approved_by_user))
        .order_by(Company.created_at.asc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_pending_companies(db: AsyncSession) -> int:
    """
    Count companies awaiting approval.

    Args:
        db: Database session

    Returns:
        Count of pending companies
    """
    query = select(func.count(Company.id)).where(
        Company.status == CompanyStatusEnum.PENDING
    )

    result = await db.execute(query)
    return result.scalar_one()


async def mark_duplicate(
    db: AsyncSession,
    company_id: UUID,
    is_duplicate: bool
) -> Company:
    """
    Mark or unmark a company as duplicate.

    Args:
        db: Database session
        company_id: Company UUID
        is_duplicate: Duplicate flag value

    Returns:
        Updated company instance

    Raises:
        ValueError: If company not found
    """
    company = await get_company(db, company_id)

    if company is None:
        raise ValueError(f"Company with id {company_id} not found")

    company.is_duplicate = is_duplicate

    await db.flush()
    await db.refresh(company, ["segment", "created_by_user"])

    return company


async def get_companies_by_segment(
    db: AsyncSession,
    segment_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> list[Company]:
    """
    Get all companies in a specific segment.

    Args:
        db: Database session
        segment_id: Segment UUID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of companies in the segment
    """
    query = (
        select(Company)
        .where(Company.segment_id == segment_id)
        .options(selectinload(Company.segment), selectinload(Company.created_by_user))
        .order_by(Company.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_company_contact_count(
    db: AsyncSession,
    company_id: UUID
) -> int:
    """
    Get the count of contacts for a specific company.

    Args:
        db: Database session
        company_id: Company UUID

    Returns:
        Count of contacts
    """
    query = select(func.count(Contact.id)).where(Contact.company_id == company_id)

    result = await db.execute(query)
    return result.scalar_one()
