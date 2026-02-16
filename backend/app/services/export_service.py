"""CSV export service for generating data exports."""
import csv
import io
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse

from app.models.company import Company, CompanyStatusEnum
from app.models.contact import Contact
from app.models.segment import Segment


async def export_companies(
    db: AsyncSession,
    segment_id: UUID | None = None,
    status: str | None = None
) -> StreamingResponse:
    """
    Export companies to CSV format.

    Args:
        db: Database session
        segment_id: Optional segment filter
        status: Optional status filter

    Returns:
        StreamingResponse with CSV content
    """
    query = select(Company)

    if segment_id is not None:
        query = query.where(Company.segment_id == segment_id)

    if status is not None:
        try:
            status_enum = CompanyStatusEnum(status)
            query = query.where(Company.status == status_enum)
        except ValueError:
            pass

    query = query.order_by(Company.created_at.desc())

    result = await db.execute(query)
    companies = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Company Name",
        "Website",
        "Phone",
        "Industry",
        "Sub-Industry",
        "Street",
        "City",
        "State/Province",
        "Country/Region",
        "ZIP/Postal Code",
        "Founded Year",
        "Revenue Range",
        "Employee Size Range",
        "Status",
        "Segment ID",
        "Created By",
        "Created At",
        "Updated At"
    ])

    for company in companies:
        writer.writerow([
            str(company.id),
            company.company_name,
            company.company_website or "",
            company.company_phone or "",
            company.company_industry or "",
            company.company_sub_industry or "",
            company.street or "",
            company.city or "",
            company.state_province or "",
            company.country_region or "",
            company.zip_postal_code or "",
            company.founded_year or "",
            company.revenue_range or "",
            company.employee_size_range or "",
            company.status.value,
            str(company.segment_id) if company.segment_id else "",
            str(company.created_by),
            company.created_at.isoformat(),
            company.updated_at.isoformat()
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=companies_export.csv"
        }
    )


async def export_contacts(
    db: AsyncSession,
    company_id: UUID | None = None,
    segment_id: UUID | None = None,
    status: str | None = None
) -> StreamingResponse:
    """
    Export contacts to CSV format.

    Args:
        db: Database session
        company_id: Optional company filter
        segment_id: Optional segment filter
        status: Optional status filter

    Returns:
        StreamingResponse with CSV content
    """
    query = select(Contact)

    if company_id is not None:
        query = query.where(Contact.company_id == company_id)

    if segment_id is not None:
        query = query.where(Contact.segment_id == segment_id)

    if status is not None:
        query = query.where(Contact.status == status)

    query = query.order_by(Contact.created_at.desc())

    result = await db.execute(query)
    contacts = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Job Title",
        "Department",
        "LinkedIn URL",
        "Status",
        "Company ID",
        "Segment ID",
        "Created By",
        "Created At",
        "Updated At"
    ])

    for contact in contacts:
        writer.writerow([
            str(contact.id),
            contact.first_name,
            contact.last_name,
            contact.email,
            contact.phone or "",
            contact.job_title or "",
            contact.department or "",
            contact.linkedin_url or "",
            contact.status,
            str(contact.company_id) if contact.company_id else "",
            str(contact.segment_id) if contact.segment_id else "",
            str(contact.created_by),
            contact.created_at.isoformat(),
            contact.updated_at.isoformat()
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=contacts_export.csv"
        }
    )


async def export_segments(
    db: AsyncSession
) -> StreamingResponse:
    """
    Export segments to CSV format.

    Args:
        db: Database session

    Returns:
        StreamingResponse with CSV content
    """
    query = select(Segment).order_by(Segment.created_at.desc())

    result = await db.execute(query)
    segments = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Name",
        "Description",
        "Owner ID",
        "Created By",
        "Created At",
        "Updated At"
    ])

    for segment in segments:
        writer.writerow([
            str(segment.id),
            segment.name,
            segment.description or "",
            str(segment.owner_id),
            str(segment.created_by),
            segment.created_at.isoformat(),
            segment.updated_at.isoformat()
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=segments_export.csv"
        }
    )
