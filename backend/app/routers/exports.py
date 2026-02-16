"""Export router for CSV data exports."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.services import export_service

router = APIRouter()


@router.get("/companies", response_class=StreamingResponse)
async def export_companies_csv(
    segment_id: UUID | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner", "researcher"))
):
    """
    Export companies to CSV format.

    Supports filtering by segment_id and status.
    """
    return await export_service.export_companies(
        db=db,
        segment_id=segment_id,
        status=status
    )


@router.get("/contacts", response_class=StreamingResponse)
async def export_contacts_csv(
    company_id: UUID | None = Query(None),
    segment_id: UUID | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner", "researcher"))
):
    """
    Export contacts to CSV format.

    Supports filtering by company_id, segment_id, and status.
    """
    return await export_service.export_contacts(
        db=db,
        company_id=company_id,
        segment_id=segment_id,
        status=status
    )


@router.get("/segments", response_class=StreamingResponse)
async def export_segments_csv(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    """
    Export all segments to CSV format.
    """
    return await export_service.export_segments(db=db)
