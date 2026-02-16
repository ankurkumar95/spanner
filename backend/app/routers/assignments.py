"""Assignment router for assignment management endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.models.assignment import EntityTypeEnum
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentBulkCreate,
    AssignmentDelete,
    AssignmentResponse
)
from app.services import assignment_service

router = APIRouter()


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    """
    Create a new assignment.

    Requires admin or segment_owner role.
    """
    try:
        assignment = await assignment_service.create_assignment(
            db=db,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            assigned_to=data.assigned_to,
            assigned_by=UUID(current_user["id"])
        )
        return assignment
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment already exists for this entity and user"
        )


@router.post("/bulk", response_model=list[AssignmentResponse], status_code=status.HTTP_201_CREATED)
async def create_bulk_assignments(
    data: AssignmentBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    """
    Create multiple assignments at once.

    Requires admin or segment_owner role.
    """
    try:
        assignments = await assignment_service.create_bulk_assignments(
            db=db,
            entity_type=data.entity_type,
            entity_ids=data.entity_ids,
            assigned_to=data.assigned_to,
            assigned_by=UUID(current_user["id"])
        )
        return assignments
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="One or more assignments already exist"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    data: AssignmentDelete,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    """
    Delete an assignment.

    Requires admin or segment_owner role.
    """
    deleted = await assignment_service.delete_assignment(
        db=db,
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        assigned_to=data.assigned_to
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )


@router.get("/entity/{entity_type}/{entity_id}", response_model=list[AssignmentResponse])
async def get_assignments_for_entity(
    entity_type: EntityTypeEnum,
    entity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get all assignments for a specific entity.

    Accessible to all authenticated users.
    """
    assignments = await assignment_service.get_assignments_for_entity(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id
    )
    return assignments


@router.get("/user/{user_id}", response_model=list[AssignmentResponse])
async def get_assignments_for_user(
    user_id: UUID,
    entity_type: EntityTypeEnum | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get assignments for a specific user.

    Accessible to all authenticated users.
    """
    assignments = await assignment_service.get_assignments_for_user(
        db=db,
        assigned_to=user_id,
        entity_type=entity_type,
        skip=skip,
        limit=limit
    )
    return assignments


@router.get("/me", response_model=list[AssignmentResponse])
async def get_my_assignments(
    entity_type: EntityTypeEnum | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get assignments for the current user.

    Accessible to all authenticated users.
    """
    assignments = await assignment_service.get_assignments_for_user(
        db=db,
        assigned_to=UUID(current_user["id"]),
        entity_type=entity_type,
        skip=skip,
        limit=limit
    )
    return assignments
