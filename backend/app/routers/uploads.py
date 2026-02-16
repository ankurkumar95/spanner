"""Upload endpoints for CSV file processing."""
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_roles
from app.models.upload_batch import BatchStatusEnum, UploadTypeEnum
from app.schemas.upload_batch import UploadBatchResponse
from app.services import upload_service

router = APIRouter()


@router.post(
    "/companies",
    response_model=UploadBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload company CSV file"
)
async def upload_companies(
    file: UploadFile = File(..., description="CSV file containing company data"),
    segment_id: UUID = Form(..., description="Segment ID to assign companies to"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("researcher", "admin"))
):
    """
    Upload a CSV file containing company data.

    Required CSV columns (all others ignored):
    - company_name (required)
    - company_website
    - company_phone
    - company_description
    - company_linkedin_url
    - company_industry
    - company_sub_industry
    - street
    - city
    - state_province
    - country_region
    - zip_postal_code
    - founded_year
    - revenue_range
    - employee_size_range

    All companies are created with status=pending and require approval.
    Duplicate detection runs automatically after upload.

    Returns:
        Upload batch details with statistics and error information
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )

    # Validate file size (10MB limit)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )

    try:
        batch, errors = await upload_service.process_company_csv(
            db=db,
            file=file,
            segment_id=segment_id,
            created_by=UUID(current_user["id"])
        )

        # Build response with error details if any
        response_data = {
            "id": batch.id,
            "upload_type": batch.upload_type,
            "file_name": batch.file_name,
            "file_size_bytes": batch.file_size_bytes,
            "total_rows": batch.total_rows,
            "valid_rows": batch.valid_rows,
            "invalid_rows": batch.invalid_rows,
            "status": batch.status,
            "error_report_url": None,
            "uploaded_by": batch.uploaded_by,
            "created_at": batch.created_at
        }

        # Store errors in batch for retrieval
        if errors:
            # In production, you'd store this in object storage or a separate table
            # For now, we'll just return it inline
            batch.error_report_url = f"/api/v1/uploads/{batch.id}/errors"
            await db.flush()
            response_data["error_report_url"] = batch.error_report_url

        return response_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV file: {str(e)}"
        )


@router.post(
    "/contacts",
    response_model=UploadBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload contact CSV file"
)
async def upload_contacts(
    file: UploadFile = File(..., description="CSV file containing contact data"),
    company_id: UUID | None = Form(None, description="Company ID to assign all contacts to"),
    segment_id: UUID | None = Form(None, description="Segment ID (required if company_id not provided)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles("researcher", "admin"))
):
    """
    Upload a CSV file containing contact data.

    Either company_id or segment_id must be provided:
    - If company_id is provided: all contacts are assigned to that company
    - If segment_id is provided: CSV must include company_name column to match existing companies

    Required CSV columns:
    - first_name (required)
    - last_name (required)
    - email (required)
    - company_name (required if company_id not provided)
    - mobile_phone
    - job_title
    - direct_phone_number
    - email_address_2
    - email_active_status
    - lead_source_global
    - management_level
    - street
    - city
    - state_province
    - country_region
    - zip_postal_code
    - primary_time_zone
    - contact_linkedin_url
    - linkedin_summary
    - data_requester_details

    All contacts are created with status=uploaded.
    Duplicate detection runs automatically after upload.

    Returns:
        Upload batch details with statistics and error information
    """
    # Validate that either company_id or segment_id is provided
    if not company_id and not segment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either company_id or segment_id must be provided"
        )

    # Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )

    # Validate file size (10MB limit)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )

    try:
        batch, errors = await upload_service.process_contact_csv(
            db=db,
            file=file,
            company_id=company_id,
            segment_id=segment_id,
            created_by=UUID(current_user["id"])
        )

        # Build response with error details if any
        response_data = {
            "id": batch.id,
            "upload_type": batch.upload_type,
            "file_name": batch.file_name,
            "file_size_bytes": batch.file_size_bytes,
            "total_rows": batch.total_rows,
            "valid_rows": batch.valid_rows,
            "invalid_rows": batch.invalid_rows,
            "status": batch.status,
            "error_report_url": None,
            "uploaded_by": batch.uploaded_by,
            "created_at": batch.created_at
        }

        # Store errors in batch for retrieval
        if errors:
            batch.error_report_url = f"/api/v1/uploads/{batch.id}/errors"
            await db.flush()
            response_data["error_report_url"] = batch.error_report_url

        return response_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV file: {str(e)}"
        )


@router.get(
    "/",
    response_model=dict,
    summary="List upload batches"
)
async def list_uploads(
    skip: int = 0,
    limit: int = 50,
    upload_type: UploadTypeEnum | None = None,
    status: BatchStatusEnum | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    List all upload batches with pagination and filtering.

    Query parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 50, max: 100)
    - upload_type: Filter by type (company or contact)
    - status: Filter by status (processing, completed, failed)

    Returns:
        Paginated list of upload batches with metadata
    """
    if limit > 100:
        limit = 100

    batches = await upload_service.list_batches(
        db=db,
        skip=skip,
        limit=limit,
        upload_type=upload_type,
        status=status
    )

    total = await upload_service.count_batches(
        db=db,
        upload_type=upload_type,
        status=status
    )

    return {
        "items": [
            UploadBatchResponse.model_validate(batch)
            for batch in batches
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get(
    "/{batch_id}",
    response_model=UploadBatchResponse,
    summary="Get upload batch details"
)
async def get_upload_batch(
    batch_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get details for a specific upload batch.

    Path parameters:
    - batch_id: UUID of the upload batch

    Returns:
        Upload batch details including statistics
    """
    batch = await upload_service.get_batch(db=db, batch_id=batch_id)

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload batch {batch_id} not found"
        )

    return UploadBatchResponse.model_validate(batch)


@router.get(
    "/{batch_id}/errors",
    summary="Get upload batch error report"
)
async def get_upload_errors(
    batch_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get error details for a specific upload batch.

    Note: This is a placeholder endpoint. In production, error details should be
    stored in object storage or a separate database table and retrieved here.

    Path parameters:
    - batch_id: UUID of the upload batch

    Returns:
        Error report with row-level error details
    """
    batch = await upload_service.get_batch(db=db, batch_id=batch_id)

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload batch {batch_id} not found"
        )

    # In production, retrieve actual error details from storage
    # For now, return basic info about the batch
    return {
        "batch_id": batch.id,
        "file_name": batch.file_name,
        "status": batch.status,
        "total_rows": batch.total_rows,
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "errors": [
            # Would be populated from storage in production
            # {
            #     "row_number": 5,
            #     "field": "email",
            #     "error": "Invalid email format"
            # }
        ],
        "note": "Error details are generated during upload but not persisted in this implementation. "
                "Consider implementing error storage for production use."
    }
