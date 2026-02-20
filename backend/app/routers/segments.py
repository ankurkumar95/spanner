"""
Segments and Offerings API endpoints.

Provides REST API for managing segments and offerings in the CRM.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.models.segment import SegmentStatusEnum, OfferingStatusEnum
from app.schemas.segment import (
    SegmentCreate,
    SegmentUpdate,
    SegmentResponse,
    SegmentWithStats,
    OfferingCreate,
    OfferingUpdate,
    OfferingResponse,
    OfferingBrief,
)
from app.services import segment_service


# Create routers
router = APIRouter()


# Segment Endpoints

@router.get("/segments/")
async def list_segments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    status: SegmentStatusEnum | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by segment name (case-insensitive)"),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List segments with pagination, optional filters, and stats.

    Requires authentication.
    """
    segments = await segment_service.list_segments(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        search=search
    )

    # Build response with stats for each segment
    result = []
    for segment in segments:
        stats = await segment_service.get_segment_stats(db=db, segment_id=segment.id)
        result.append(SegmentWithStats(
            id=segment.id,
            name=segment.name,
            description=segment.description,
            research_filter_requirements=segment.research_filter_requirements,
            status=segment.status,
            created_by=segment.created_by,
            created_by_name=segment.created_by_name,
            created_at=segment.created_at,
            updated_at=segment.updated_at,
            offerings=segment.offerings,
            company_count=stats["company_count"],
            contact_count=stats["contact_count"],
            pending_company_count=stats["pending_company_count"],
        ))

    return result


@router.post("/segments/", response_model=SegmentResponse, status_code=status.HTTP_201_CREATED)
async def create_segment(
    segment_data: SegmentCreate,
    current_user: dict = Depends(require_roles("admin", "segment_owner")),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new segment.

    Requires admin or segment_owner role.
    """
    try:
        created_by = UUID(current_user["id"])
        segment = await segment_service.create_segment(
            db=db,
            data=segment_data,
            created_by=created_by
        )
        return segment
    except Exception as e:
        # Handle unique constraint violations or other database errors
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A segment with this name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/segments/{segment_id}", response_model=SegmentWithStats)
async def get_segment(
    segment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get segment details with offerings and statistics.

    Requires authentication.
    """
    segment = await segment_service.get_segment(db=db, segment_id=segment_id)

    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segment with id {segment_id} not found"
        )

    # Get segment statistics
    stats = await segment_service.get_segment_stats(db=db, segment_id=segment_id)

    # Convert to response model with stats
    segment_dict = {
        "id": segment.id,
        "name": segment.name,
        "description": segment.description,
        "research_filter_requirements": segment.research_filter_requirements,
        "status": segment.status,
        "created_by": segment.created_by,
        "created_by_name": segment.created_by_name,
        "created_at": segment.created_at,
        "updated_at": segment.updated_at,
        "offerings": segment.offerings,
        "company_count": stats["company_count"],
        "contact_count": stats["contact_count"],
        "pending_company_count": stats["pending_company_count"]
    }

    return segment_dict


@router.patch("/segments/{segment_id}", response_model=SegmentResponse)
async def update_segment(
    segment_id: UUID,
    segment_data: SegmentUpdate,
    current_user: dict = Depends(require_roles("admin", "segment_owner")),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a segment.

    Requires admin or segment_owner role.
    """
    try:
        segment = await segment_service.update_segment(
            db=db,
            segment_id=segment_id,
            data=segment_data
        )
        return segment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A segment with this name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/segments/{segment_id}/archive", response_model=SegmentResponse)
async def archive_segment(
    segment_id: UUID,
    current_user: dict = Depends(require_roles("admin", "segment_owner")),
    db: AsyncSession = Depends(get_db)
):
    """
    Archive a segment by setting its status to archived.

    Requires admin or segment_owner role.
    """
    try:
        segment = await segment_service.archive_segment(db=db, segment_id=segment_id)
        return segment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/segments/{segment_id}/offerings", response_model=list[OfferingBrief])
async def get_segment_offerings(
    segment_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all offerings associated with a specific segment.

    Requires authentication.
    """
    segment = await segment_service.get_segment(db=db, segment_id=segment_id)

    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segment with id {segment_id} not found"
        )

    return segment.offerings


# Offering Endpoints

@router.get("/offerings/", response_model=list[OfferingResponse])
async def list_offerings(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    status: OfferingStatusEnum | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by offering name (case-insensitive)"),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all offerings with pagination, optional status filter, and search.

    Requires authentication.
    """
    offerings = await segment_service.list_offerings(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        search=search
    )

    return offerings


@router.post("/offerings/", response_model=OfferingResponse, status_code=status.HTTP_201_CREATED)
async def create_offering(
    offering_data: OfferingCreate,
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new offering.

    Requires admin role.
    """
    try:
        offering = await segment_service.create_offering(db=db, data=offering_data)
        return offering
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An offering with this name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/offerings/{offering_id}", response_model=OfferingResponse)
async def get_offering(
    offering_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get offering details by ID.

    Requires authentication.
    """
    offering = await segment_service.get_offering(db=db, offering_id=offering_id)

    if not offering:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offering with id {offering_id} not found"
        )

    return offering


@router.patch("/offerings/{offering_id}", response_model=OfferingResponse)
async def update_offering(
    offering_id: UUID,
    offering_data: OfferingUpdate,
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an offering.

    Requires admin role.
    """
    try:
        offering = await segment_service.update_offering(
            db=db,
            offering_id=offering_id,
            data=offering_data
        )
        return offering
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An offering with this name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
