"""Company router for CRUD and status workflow operations."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.schemas.company import (
    CompanyApproval,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    CompanyWithContacts,
)
from app.services import company_service

router = APIRouter()


@router.get("/")
async def list_companies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    segment_id: UUID | None = Query(None, description="Filter by segment ID"),
    status: str | None = Query(None, description="Filter by status (pending/approved/rejected)"),
    search: str | None = Query(None, description="Search by company name (case-insensitive)"),
    is_duplicate: bool | None = Query(None, description="Filter by duplicate flag"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    List companies with pagination and filters.

    Returns a paginated list of companies with total count.
    """
    companies = await company_service.list_companies(
        db=db,
        skip=skip,
        limit=limit,
        segment_id=segment_id,
        status_filter=status,
        search=search,
        is_duplicate=is_duplicate
    )

    total = await company_service.count_companies(
        db=db,
        segment_id=segment_id,
        status_filter=status,
        search=search,
        is_duplicate=is_duplicate
    )

    return {
        "items": [CompanyResponse.model_validate(c) for c in companies],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("researcher", "admin"))
):
    """
    Create a new company.

    Requires researcher or admin role.
    Company is created with pending status.
    """
    try:
        user_id = UUID(current_user["id"])
        company = await company_service.create_company(
            db=db,
            data=data,
            created_by=user_id
        )
        return company

    except IntegrityError as e:
        # Handle unique constraint violation
        if "unique_company_per_segment" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A company with this name and website already exists in the segment"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )


@router.get("/{company_id}", response_model=CompanyWithContacts)
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get company details with contact count.

    Returns detailed company information including the number of contacts.
    """
    company = await company_service.get_company(db=db, company_id=company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {company_id} not found"
        )

    # Get contact count
    contact_count = await company_service.get_company_contact_count(
        db=db,
        company_id=company_id
    )

    # Convert to response model with contact count
    company_dict = {
        "id": company.id,
        "company_name": company.company_name,
        "company_website": company.company_website,
        "company_phone": company.company_phone,
        "company_description": company.company_description,
        "company_linkedin_url": company.company_linkedin_url,
        "company_industry": company.company_industry,
        "company_sub_industry": company.company_sub_industry,
        "street": company.street,
        "city": company.city,
        "state_province": company.state_province,
        "country_region": company.country_region,
        "zip_postal_code": company.zip_postal_code,
        "founded_year": company.founded_year,
        "revenue_range": company.revenue_range,
        "employee_size_range": company.employee_size_range,
        "segment_id": company.segment_id,
        "status": company.status,
        "rejection_reason": company.rejection_reason,
        "is_duplicate": company.is_duplicate,
        "batch_id": company.batch_id,
        "created_by": company.created_by,
        "created_by_name": company.created_by_name,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
        "contact_count": contact_count
    }

    return CompanyWithContacts(**company_dict)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update company fields.

    Only provided fields will be updated.
    """
    try:
        company = await company_service.update_company(
            db=db,
            company_id=company_id,
            data=data
        )
        return company

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except IntegrityError as e:
        # Handle unique constraint violation
        if "unique_company_per_segment" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A company with this name and website already exists in the segment"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )


@router.post("/{company_id}/approve", response_model=CompanyResponse)
async def approve_company(
    company_id: UUID,
    approval: CompanyApproval,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("approver", "admin"))
):
    """
    Approve or reject a company.

    Requires approver or admin role.
    Only pending companies can be approved or rejected.
    Rejection requires a rejection_reason.
    """
    try:
        company = await company_service.approve_company(
            db=db,
            company_id=company_id,
            approval=approval
        )
        return company

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )


@router.post("/{company_id}/duplicate", response_model=CompanyResponse)
async def mark_duplicate(
    company_id: UUID,
    is_duplicate: bool,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Mark or unmark a company as duplicate.

    Toggles the is_duplicate flag for the company.
    """
    try:
        company = await company_service.mark_duplicate(
            db=db,
            company_id=company_id,
            is_duplicate=is_duplicate
        )
        return company

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/pending/list")
async def list_pending_companies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("approver", "admin"))
):
    """
    List companies pending approval.

    Requires approver or admin role.
    Returns companies in pending status ordered by creation date (oldest first).
    """
    companies = await company_service.get_pending_companies(
        db=db,
        skip=skip,
        limit=limit
    )

    total = await company_service.count_pending_companies(db=db)

    return {
        "items": [CompanyResponse.model_validate(c) for c in companies],
        "total": total,
        "skip": skip,
        "limit": limit
    }
