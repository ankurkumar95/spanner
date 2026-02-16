"""Audit log router for audit trail endpoints."""
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.schemas.audit_log import AuditLogResponse, AuditLogFilter
from app.services import audit_service

router = APIRouter()


@router.get("/", response_model=list[AuditLogResponse])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    actor_id: UUID | None = Query(None),
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    entity_id: UUID | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin"))
):
    """
    List audit logs with pagination and filters.

    Requires admin role. Supports filtering by actor, action, entity type/id, and date range.
    """
    filters = AuditLogFilter(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date
    )

    logs = await audit_service.list_logs(
        db=db,
        skip=skip,
        limit=limit,
        filters=filters
    )
    return logs


@router.get("/entity/{entity_type}/{entity_id}", response_model=list[AuditLogResponse])
async def get_entity_audit_history(
    entity_type: str,
    entity_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get audit history for a specific entity.

    Accessible to all authenticated users.
    """
    logs = await audit_service.get_entity_history(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit
    )
    return logs
