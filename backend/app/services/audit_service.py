"""Audit log service layer for business logic."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogFilter


async def create_log(
    db: AsyncSession,
    actor_id: UUID | None,
    action: str,
    entity_type: str,
    entity_id: UUID,
    details: dict | None = None
) -> AuditLog:
    """
    Create a new audit log entry.

    Args:
        db: Database session
        actor_id: UUID of user performing the action (None for system actions)
        action: Action performed (e.g., 'created', 'updated', 'deleted')
        entity_type: Type of entity (e.g., 'company', 'contact', 'segment')
        entity_id: UUID of the entity
        details: Optional additional details in JSON format

    Returns:
        Created audit log instance
    """
    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )

    db.add(audit_log)
    await db.flush()
    await db.refresh(audit_log)

    return audit_log


async def list_logs(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    filters: AuditLogFilter | None = None
) -> list[AuditLog]:
    """
    List audit logs with pagination and filters.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional filter criteria

    Returns:
        List of audit log instances
    """
    query = select(AuditLog)

    if filters:
        if filters.actor_id is not None:
            query = query.where(AuditLog.actor_id == filters.actor_id)

        if filters.action is not None:
            query = query.where(AuditLog.action == filters.action)

        if filters.entity_type is not None:
            query = query.where(AuditLog.entity_type == filters.entity_type)

        if filters.entity_id is not None:
            query = query.where(AuditLog.entity_id == filters.entity_id)

        if filters.start_date is not None:
            query = query.where(AuditLog.created_at >= filters.start_date)

        if filters.end_date is not None:
            query = query.where(AuditLog.created_at <= filters.end_date)

    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_logs(
    db: AsyncSession,
    filters: AuditLogFilter | None = None
) -> int:
    """
    Count total audit logs with filters.

    Args:
        db: Database session
        filters: Optional filter criteria

    Returns:
        Total count of audit logs
    """
    query = select(func.count()).select_from(AuditLog)

    if filters:
        if filters.actor_id is not None:
            query = query.where(AuditLog.actor_id == filters.actor_id)

        if filters.action is not None:
            query = query.where(AuditLog.action == filters.action)

        if filters.entity_type is not None:
            query = query.where(AuditLog.entity_type == filters.entity_type)

        if filters.entity_id is not None:
            query = query.where(AuditLog.entity_id == filters.entity_id)

        if filters.start_date is not None:
            query = query.where(AuditLog.created_at >= filters.start_date)

        if filters.end_date is not None:
            query = query.where(AuditLog.created_at <= filters.end_date)

    result = await db.execute(query)
    return result.scalar() or 0


async def get_entity_history(
    db: AsyncSession,
    entity_type: str,
    entity_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> list[AuditLog]:
    """
    Get audit history for a specific entity.

    Args:
        db: Database session
        entity_type: Type of entity
        entity_id: UUID of the entity
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of audit log instances for the entity
    """
    query = (
        select(AuditLog)
        .where(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        )
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    return list(result.scalars().all())
