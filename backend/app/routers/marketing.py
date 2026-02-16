"""Marketing collateral router for marketing material management."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.schemas.marketing_collateral import (
    MarketingCollateralCreate,
    MarketingCollateralUpdate,
    MarketingCollateralResponse
)
from app.services import marketing_service

router = APIRouter()


@router.post("/", response_model=MarketingCollateralResponse, status_code=status.HTTP_201_CREATED)
async def create_marketing_collateral(
    data: MarketingCollateralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "marketing"))
):
    """
    Create new marketing collateral.

    Requires admin or marketing role.
    """
    collateral = await marketing_service.create_collateral(
        db=db,
        data=data,
        created_by=UUID(current_user["id"])
    )
    return collateral


@router.get("/", response_model=list[MarketingCollateralResponse])
async def list_marketing_collateral(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    scope_type: str | None = Query(None),
    segment_id: UUID | None = Query(None),
    offering_id: UUID | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    List marketing collateral with pagination and filters.

    Accessible to all authenticated users.
    """
    collateral_list = await marketing_service.list_collateral(
        db=db,
        skip=skip,
        limit=limit,
        scope_type=scope_type,
        segment_id=segment_id,
        offering_id=offering_id,
        search=search
    )
    return collateral_list


@router.get("/{collateral_id}", response_model=MarketingCollateralResponse)
async def get_marketing_collateral(
    collateral_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get a single marketing collateral by ID.

    Accessible to all authenticated users.
    """
    collateral = await marketing_service.get_collateral(db=db, collateral_id=collateral_id)

    if collateral is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing collateral not found"
        )

    return collateral


@router.patch("/{collateral_id}", response_model=MarketingCollateralResponse)
async def update_marketing_collateral(
    collateral_id: UUID,
    data: MarketingCollateralUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "marketing"))
):
    """
    Update marketing collateral.

    Requires admin or marketing role.
    """
    collateral = await marketing_service.update_collateral(
        db=db,
        collateral_id=collateral_id,
        data=data
    )

    if collateral is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing collateral not found"
        )

    return collateral


@router.delete("/{collateral_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_marketing_collateral(
    collateral_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "marketing"))
):
    """
    Delete marketing collateral.

    Requires admin or marketing role.
    """
    deleted = await marketing_service.delete_collateral(db=db, collateral_id=collateral_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing collateral not found"
        )
