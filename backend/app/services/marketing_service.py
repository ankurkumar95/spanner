"""Marketing collateral service layer for business logic."""
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.marketing_collateral import MarketingCollateral
from app.schemas.marketing_collateral import MarketingCollateralCreate, MarketingCollateralUpdate


async def create_collateral(
    db: AsyncSession,
    data: MarketingCollateralCreate,
    created_by: UUID
) -> MarketingCollateral:
    """
    Create new marketing collateral.

    Args:
        db: Database session
        data: Marketing collateral creation data
        created_by: UUID of user creating the collateral

    Returns:
        Created marketing collateral instance
    """
    collateral = MarketingCollateral(
        title=data.title,
        url=data.url,
        description=data.description,
        scope_type=data.scope_type,
        scope_id=data.scope_id,
        segment_id=data.segment_id,
        offering_id=data.offering_id,
        created_by=created_by
    )

    db.add(collateral)
    await db.flush()
    await db.refresh(collateral)

    return collateral


async def get_collateral(
    db: AsyncSession,
    collateral_id: UUID
) -> MarketingCollateral | None:
    """
    Get a marketing collateral by ID.

    Args:
        db: Database session
        collateral_id: Marketing collateral UUID

    Returns:
        Marketing collateral instance or None if not found
    """
    query = select(MarketingCollateral).where(MarketingCollateral.id == collateral_id)

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_collateral(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    scope_type: str | None = None,
    segment_id: UUID | None = None,
    offering_id: UUID | None = None,
    search: str | None = None
) -> list[MarketingCollateral]:
    """
    List marketing collateral with pagination and filters.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        scope_type: Optional scope type filter
        segment_id: Optional segment filter
        offering_id: Optional offering filter
        search: Optional search term for title/description

    Returns:
        List of marketing collateral instances
    """
    query = select(MarketingCollateral)

    if scope_type is not None:
        query = query.where(MarketingCollateral.scope_type == scope_type)

    if segment_id is not None:
        query = query.where(MarketingCollateral.segment_id == segment_id)

    if offering_id is not None:
        query = query.where(MarketingCollateral.offering_id == offering_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                MarketingCollateral.title.ilike(search_pattern),
                MarketingCollateral.description.ilike(search_pattern)
            )
        )

    query = query.order_by(MarketingCollateral.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_collateral(
    db: AsyncSession,
    scope_type: str | None = None,
    segment_id: UUID | None = None,
    offering_id: UUID | None = None,
    search: str | None = None
) -> int:
    """
    Count total marketing collateral with filters.

    Args:
        db: Database session
        scope_type: Optional scope type filter
        segment_id: Optional segment filter
        offering_id: Optional offering filter
        search: Optional search term for title/description

    Returns:
        Total count of marketing collateral
    """
    query = select(func.count()).select_from(MarketingCollateral)

    if scope_type is not None:
        query = query.where(MarketingCollateral.scope_type == scope_type)

    if segment_id is not None:
        query = query.where(MarketingCollateral.segment_id == segment_id)

    if offering_id is not None:
        query = query.where(MarketingCollateral.offering_id == offering_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                MarketingCollateral.title.ilike(search_pattern),
                MarketingCollateral.description.ilike(search_pattern)
            )
        )

    result = await db.execute(query)
    return result.scalar() or 0


async def update_collateral(
    db: AsyncSession,
    collateral_id: UUID,
    data: MarketingCollateralUpdate
) -> MarketingCollateral | None:
    """
    Update marketing collateral.

    Args:
        db: Database session
        collateral_id: Marketing collateral UUID
        data: Update data

    Returns:
        Updated marketing collateral instance or None if not found
    """
    collateral = await get_collateral(db, collateral_id)

    if collateral is None:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(collateral, key, value)

    await db.flush()
    await db.refresh(collateral)

    return collateral


async def delete_collateral(
    db: AsyncSession,
    collateral_id: UUID
) -> bool:
    """
    Delete marketing collateral.

    Args:
        db: Database session
        collateral_id: Marketing collateral UUID

    Returns:
        True if deleted, False if not found
    """
    collateral = await get_collateral(db, collateral_id)

    if collateral is None:
        return False

    await db.delete(collateral)
    await db.flush()

    return True
