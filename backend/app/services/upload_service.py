"""Upload service for CSV file processing and duplicate detection."""
import csv
import io
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company, CompanyStatusEnum
from app.models.contact import Contact, ContactStatusEnum
from app.models.upload_batch import (
    BatchStatusEnum,
    UploadBatch,
    UploadTypeEnum,
)
from app.schemas.company import CompanyCreate
from app.schemas.contact import ContactCreate
from pydantic import ValidationError


class UploadError:
    """Container for upload row error details."""

    def __init__(self, row_number: int, field: str, error: str):
        self.row_number = row_number
        self.field = field
        self.error = error

    def to_dict(self) -> dict:
        return {
            "row_number": self.row_number,
            "field": self.field,
            "error": self.error
        }


async def create_batch(
    db: AsyncSession,
    upload_type: UploadTypeEnum,
    file_name: str,
    file_size_bytes: int,
    uploaded_by: UUID
) -> UploadBatch:
    """
    Create a new upload batch record.

    Args:
        db: Database session
        upload_type: Type of upload (company or contact)
        file_name: Original filename
        file_size_bytes: File size in bytes
        uploaded_by: UUID of user uploading the file

    Returns:
        Created UploadBatch instance
    """
    batch = UploadBatch(
        upload_type=upload_type,
        file_name=file_name,
        file_size_bytes=file_size_bytes,
        status=BatchStatusEnum.PROCESSING,
        uploaded_by=uploaded_by
    )

    db.add(batch)
    await db.flush()
    await db.refresh(batch)

    return batch


async def get_batch(
    db: AsyncSession,
    batch_id: UUID
) -> UploadBatch | None:
    """
    Get an upload batch by ID.

    Args:
        db: Database session
        batch_id: Batch UUID

    Returns:
        UploadBatch instance or None if not found
    """
    query = (
        select(UploadBatch)
        .where(UploadBatch.id == batch_id)
        .options(selectinload(UploadBatch.uploaded_by_user))
    )

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_batches(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    upload_type: UploadTypeEnum | None = None,
    status: BatchStatusEnum | None = None
) -> list[UploadBatch]:
    """
    List upload batches with pagination and filters.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        upload_type: Optional filter by upload type
        status: Optional filter by batch status

    Returns:
        List of UploadBatch instances
    """
    query = select(UploadBatch).options(selectinload(UploadBatch.uploaded_by_user))

    if upload_type is not None:
        query = query.where(UploadBatch.upload_type == upload_type)

    if status is not None:
        query = query.where(UploadBatch.status == status)

    query = query.order_by(UploadBatch.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def count_batches(
    db: AsyncSession,
    upload_type: UploadTypeEnum | None = None,
    status: BatchStatusEnum | None = None
) -> int:
    """
    Count upload batches matching filters.

    Args:
        db: Database session
        upload_type: Optional filter by upload type
        status: Optional filter by batch status

    Returns:
        Count of matching batches
    """
    query = select(func.count(UploadBatch.id))

    if upload_type is not None:
        query = query.where(UploadBatch.upload_type == upload_type)

    if status is not None:
        query = query.where(UploadBatch.status == status)

    result = await db.execute(query)
    return result.scalar_one()


async def process_company_csv(
    db: AsyncSession,
    file: UploadFile,
    segment_id: UUID,
    created_by: UUID
) -> tuple[UploadBatch, list[UploadError]]:
    """
    Process a company CSV upload.

    Args:
        db: Database session
        file: Uploaded CSV file
        segment_id: Segment to assign companies to
        created_by: UUID of user uploading the file

    Returns:
        Tuple of (UploadBatch, list of UploadError)
    """
    # Read file content
    content = await file.read()
    file_size_bytes = len(content)

    # Create batch record
    batch = await create_batch(
        db=db,
        upload_type=UploadTypeEnum.COMPANY,
        file_name=file.filename or "unknown.csv",
        file_size_bytes=file_size_bytes,
        uploaded_by=created_by
    )

    # Parse CSV
    text_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(text_content))

    errors: list[UploadError] = []
    total_rows = 0
    valid_rows = 0
    invalid_rows = 0

    # Schema field mapping (CSV header -> schema field)
    schema_fields = {
        'company_name', 'company_website', 'company_phone', 'company_description',
        'company_linkedin_url', 'company_industry', 'company_sub_industry',
        'street', 'city', 'state_province', 'country_region', 'zip_postal_code',
        'founded_year', 'revenue_range', 'employee_size_range'
    }

    for row_number, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
        total_rows += 1

        # Filter row to only include schema fields
        filtered_row = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in row.items()
            if key in schema_fields
        }

        # Convert empty strings to None
        for key in filtered_row:
            if filtered_row[key] == '':
                filtered_row[key] = None

        # Add required segment_id
        filtered_row['segment_id'] = str(segment_id)

        # Validate against schema
        try:
            company_data = CompanyCreate(**filtered_row)

            # Create company record
            company = Company(
                company_name=company_data.company_name,
                company_website=company_data.company_website,
                company_phone=company_data.company_phone,
                company_description=company_data.company_description,
                company_linkedin_url=company_data.company_linkedin_url,
                company_industry=company_data.company_industry,
                company_sub_industry=company_data.company_sub_industry,
                street=company_data.street,
                city=company_data.city,
                state_province=company_data.state_province,
                country_region=company_data.country_region,
                zip_postal_code=company_data.zip_postal_code,
                founded_year=company_data.founded_year,
                revenue_range=company_data.revenue_range,
                employee_size_range=company_data.employee_size_range,
                segment_id=segment_id,
                status=CompanyStatusEnum.PENDING,
                batch_id=batch.id,
                created_by=created_by
            )

            db.add(company)
            valid_rows += 1

        except ValidationError as e:
            invalid_rows += 1
            # Collect all validation errors for this row
            for error in e.errors():
                field = error['loc'][0] if error['loc'] else 'unknown'
                message = error['msg']
                errors.append(UploadError(row_number, str(field), message))

        except Exception as e:
            invalid_rows += 1
            errors.append(UploadError(row_number, 'general', str(e)))

    # Update batch statistics
    batch.total_rows = total_rows
    batch.valid_rows = valid_rows
    batch.invalid_rows = invalid_rows
    batch.status = BatchStatusEnum.COMPLETED if invalid_rows == 0 else BatchStatusEnum.FAILED

    await db.flush()
    await db.refresh(batch)

    # Run duplicate detection if there were valid uploads
    if valid_rows > 0:
        await detect_company_duplicates(db, segment_id)

    return batch, errors


async def process_contact_csv(
    db: AsyncSession,
    file: UploadFile,
    company_id: UUID | None,
    segment_id: UUID | None,
    created_by: UUID
) -> tuple[UploadBatch, list[UploadError]]:
    """
    Process a contact CSV upload.

    Args:
        db: Database session
        file: Uploaded CSV file
        company_id: Optional company ID to assign all contacts to
        segment_id: Optional segment ID (used if company_id not provided)
        created_by: UUID of user uploading the file

    Returns:
        Tuple of (UploadBatch, list of UploadError)

    Note:
        Either company_id or segment_id must be provided.
        If company_id is provided, all contacts are assigned to that company.
        If segment_id is provided, contacts must have a company_name field
        to match against existing companies in that segment.
    """
    # Read file content
    content = await file.read()
    file_size_bytes = len(content)

    # Create batch record
    batch = await create_batch(
        db=db,
        upload_type=UploadTypeEnum.CONTACT,
        file_name=file.filename or "unknown.csv",
        file_size_bytes=file_size_bytes,
        uploaded_by=created_by
    )

    # Parse CSV
    text_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(text_content))

    errors: list[UploadError] = []
    total_rows = 0
    valid_rows = 0
    invalid_rows = 0

    # Schema field mapping
    schema_fields = {
        'first_name', 'last_name', 'email', 'mobile_phone', 'job_title',
        'direct_phone_number', 'email_address_2', 'email_active_status',
        'lead_source_global', 'management_level', 'street', 'city',
        'state_province', 'country_region', 'zip_postal_code', 'primary_time_zone',
        'contact_linkedin_url', 'linkedin_summary', 'data_requester_details'
    }

    # If company_id provided, look up its segment_id
    if company_id and not segment_id:
        company_obj = await db.execute(select(Company).where(Company.id == company_id))
        company_row = company_obj.scalar_one_or_none()
        if company_row:
            segment_id = company_row.segment_id

    # Build company name lookup if segment_id provided
    company_lookup = {}
    if segment_id and not company_id:
        query = select(Company).where(Company.segment_id == segment_id)
        result = await db.execute(query)
        companies = result.scalars().all()
        company_lookup = {
            company.company_name.lower().strip(): company
            for company in companies
        }

    for row_number, row in enumerate(csv_reader, start=2):
        total_rows += 1

        # Filter row to only include schema fields
        filtered_row = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in row.items()
            if key in schema_fields
        }

        # Convert empty strings to None
        for key in filtered_row:
            if filtered_row[key] == '':
                filtered_row[key] = None

        # Determine company_id and segment_id for this contact
        contact_company_id = company_id
        contact_segment_id = segment_id

        if not contact_company_id:
            # Try to match by company_name from CSV
            company_name_raw = row.get('company_name', '').strip()
            if company_name_raw:
                company_name_key = company_name_raw.lower()
                matched_company = company_lookup.get(company_name_key)
                if matched_company:
                    contact_company_id = matched_company.id
                    contact_segment_id = matched_company.segment_id
                else:
                    invalid_rows += 1
                    errors.append(
                        UploadError(
                            row_number,
                            'company_name',
                            f"Company '{company_name_raw}' not found in segment"
                        )
                    )
                    continue
            else:
                invalid_rows += 1
                errors.append(
                    UploadError(
                        row_number,
                        'company_name',
                        "company_name is required when company_id is not provided"
                    )
                )
                continue

        # Add required company_id
        filtered_row['company_id'] = str(contact_company_id)

        # Validate against schema
        try:
            contact_data = ContactCreate(**filtered_row)

            # Create contact record
            contact = Contact(
                first_name=contact_data.first_name,
                last_name=contact_data.last_name,
                email=contact_data.email,
                mobile_phone=contact_data.mobile_phone,
                job_title=contact_data.job_title,
                direct_phone_number=contact_data.direct_phone_number,
                email_address_2=contact_data.email_address_2,
                email_active_status=contact_data.email_active_status,
                lead_source_global=contact_data.lead_source_global,
                management_level=contact_data.management_level,
                street=contact_data.street,
                city=contact_data.city,
                state_province=contact_data.state_province,
                country_region=contact_data.country_region,
                zip_postal_code=contact_data.zip_postal_code,
                primary_time_zone=contact_data.primary_time_zone,
                contact_linkedin_url=contact_data.contact_linkedin_url,
                linkedin_summary=contact_data.linkedin_summary,
                data_requester_details=contact_data.data_requester_details,
                company_id=contact_company_id,
                segment_id=contact_segment_id,
                status=ContactStatusEnum.UPLOADED,
                batch_id=batch.id,
                created_by=created_by
            )

            db.add(contact)
            valid_rows += 1

        except ValidationError as e:
            invalid_rows += 1
            for error in e.errors():
                field = error['loc'][0] if error['loc'] else 'unknown'
                message = error['msg']
                errors.append(UploadError(row_number, str(field), message))

        except Exception as e:
            invalid_rows += 1
            errors.append(UploadError(row_number, 'general', str(e)))

    # Update batch statistics
    batch.total_rows = total_rows
    batch.valid_rows = valid_rows
    batch.invalid_rows = invalid_rows
    batch.status = BatchStatusEnum.COMPLETED if invalid_rows == 0 else BatchStatusEnum.FAILED

    await db.flush()
    await db.refresh(batch)

    # Run duplicate detection if there were valid uploads
    if valid_rows > 0 and contact_company_id:
        await detect_contact_duplicates(db, contact_company_id)

    return batch, errors


async def detect_company_duplicates(
    db: AsyncSession,
    segment_id: UUID
) -> int:
    """
    Detect and mark duplicate companies within a segment.

    Uses case-insensitive exact match on company_name and company_website.
    Marks all duplicates except the first one (by created_at) as is_duplicate=True.

    Args:
        db: Database session
        segment_id: Segment UUID to scan for duplicates

    Returns:
        Number of companies marked as duplicates
    """
    # Query all companies in the segment
    query = (
        select(Company)
        .where(Company.segment_id == segment_id)
        .order_by(Company.created_at.asc())
    )

    result = await db.execute(query)
    companies = list(result.scalars().all())

    # Track seen companies by normalized key
    seen: dict[str, Company] = {}
    duplicates_marked = 0

    for company in companies:
        # Create normalized key (case-insensitive, handle None values)
        name_key = company.company_name.lower().strip() if company.company_name else ''
        website_key = company.company_website.lower().strip() if company.company_website else ''
        key = f"{name_key}||{website_key}"

        if key in seen:
            # This is a duplicate - mark it
            if not company.is_duplicate:
                company.is_duplicate = True
                duplicates_marked += 1
        else:
            # First occurrence - ensure it's not marked as duplicate
            seen[key] = company
            if company.is_duplicate:
                company.is_duplicate = False

    await db.flush()

    return duplicates_marked


async def detect_contact_duplicates(
    db: AsyncSession,
    company_id: UUID
) -> int:
    """
    Detect and mark duplicate contacts within a company.

    Uses case-insensitive exact match on email.
    Marks all duplicates except the first one (by created_at) as is_duplicate=True.

    Args:
        db: Database session
        company_id: Company UUID to scan for duplicates

    Returns:
        Number of contacts marked as duplicates
    """
    # Query all contacts for the company
    query = (
        select(Contact)
        .where(Contact.company_id == company_id)
        .order_by(Contact.created_at.asc())
    )

    result = await db.execute(query)
    contacts = list(result.scalars().all())

    # Track seen contacts by normalized email
    seen: dict[str, Contact] = {}
    duplicates_marked = 0

    for contact in contacts:
        # Create normalized email key
        email_key = contact.email.lower().strip() if contact.email else ''

        if email_key in seen:
            # This is a duplicate - mark it
            if not contact.is_duplicate:
                contact.is_duplicate = True
                duplicates_marked += 1
        else:
            # First occurrence - ensure it's not marked as duplicate
            seen[email_key] = contact
            if contact.is_duplicate:
                contact.is_duplicate = False

    await db.flush()

    return duplicates_marked
