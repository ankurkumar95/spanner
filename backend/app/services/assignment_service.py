"""Assignment service layer for business logic."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models.assignment import Assignment, EntityTypeEnum


async def create_assignment(
    db: AsyncSession,
    entity_type: EntityTypeEnum,
    entity_id: UUID,
    assigned_to: UUID,
    assigned_by: UUID
) -> Assignment:
    """
    Create a new assignment.

    Args:
        db: Database session
        entity_type: Type of entity (segment/company/contact)
        entity_id: UUID of the entity
        assigned_to: UUID of user being assigned
        assigned_by: UUID of user making the assignment

    Returns:
        Created assignment instance

    Raises:
        IntegrityError: If assignment already exists (unique constraint violation)
    """
    assignment = Assignment(
        entity_type=entity_type,
        entity_id=entity_id,
        assigned_to=assigned_to,
        assigned_by=assigned_by
    )

    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)

    return assignment


async def create_bulk_assignments(
    db: AsyncSession,
    entity_type: EntityTypeEnum,
    entity_ids: list[UUID],
    assigned_to: UUID,
    assigned_by: UUID
) -> list[Assignment]:
    """
    Create multiple assignments at once.

    Args:
        db: Database session
        entity_type: Type of entity (segment/company/contact)
        entity_ids: List of entity UUIDs
        assigned_to: UUID of user being assigned
        assigned_by: UUID of user making the assignment

    Returns:
        List of created assignment instances
    """
    assignments = []
    for entity_id in entity_ids:
        assignment = Assignment(
            entity_type=entity_type,
            entity_id=entity_id,
            assigned_to=assigned_to,
            assigned_by=assigned_by
        )
        assignments.append(assignment)

    db.add_all(assignments)
    await db.flush()

    for assignment in assignments:
        await db.refresh(assignment)

    return assignments


async def delete_assignment(
    db: AsyncSession,
    entity_type: EntityTypeEnum,
    entity_id: UUID,
    assigned_to: UUID
) -> bool:
    """
    Delete a specific assignment.

    Args:
        db: Database session
        entity_type: Type of entity
        entity_id: UUID of the entity
        assigned_to: UUID of assigned user

    Returns:
        True if deleted, False if not found
    """
    query = select(Assignment).where(
        Assignment.entity_type == entity_type,
        Assignment.entity_id == entity_id,
        Assignment.assigned_to == assigned_to
    )

    result = await db.execute(query)
    assignment = result.scalar_one_or_none()

    if assignment is None:
        return False

    await db.delete(assignment)
    await db.flush()

    return True


async def get_assignments_for_entity(
    db: AsyncSession,
    entity_type: EntityTypeEnum,
    entity_id: UUID
) -> list[Assignment]:
    """
    Get all assignments for a specific entity.

    Args:
        db: Database session
        entity_type: Type of entity
        entity_id: UUID of the entity

    Returns:
        List of assignment instances
    """
    query = (
        select(Assignment)
        .where(
            Assignment.entity_type == entity_type,
            Assignment.entity_id == entity_id
        )
        .order_by(Assignment.created_at.desc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_assignments_for_user(
    db: AsyncSession,
    assigned_to: UUID,
    entity_type: EntityTypeEnum | None = None,
    skip: int = 0,
    limit: int = 20
) -> list[Assignment]:
    """
    Get all assignments for a specific user with pagination.

    Args:
        db: Database session
        assigned_to: UUID of assigned user
        entity_type: Optional entity type filter
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of assignment instances
    """
    query = select(Assignment).where(Assignment.assigned_to == assigned_to)

    if entity_type is not None:
        query = query.where(Assignment.entity_type == entity_type)

    query = query.order_by(Assignment.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_assignments_for_user(
    db: AsyncSession,
    assigned_to: UUID,
    entity_type: EntityTypeEnum | None = None
) -> int:
    """
    Count total assignments for a specific user.

    Args:
        db: Database session
        assigned_to: UUID of assigned user
        entity_type: Optional entity type filter

    Returns:
        Total count of assignments
    """
    query = select(func.count()).select_from(Assignment).where(
        Assignment.assigned_to == assigned_to
    )

    if entity_type is not None:
        query = query.where(Assignment.entity_type == entity_type)

    result = await db.execute(query)
    return result.scalar() or 0
