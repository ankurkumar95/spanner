from sqlalchemy import String, Boolean, DateTime, func, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

import uuid
from ..database import Base
from ..utils.types import GUID

class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(200), nullable=False)
    last_name: Mapped[str] = mapped_column(String(200), nullable=False)
    mobile_phone: Mapped[str] = mapped_column(String(50), nullable=True)
    job_title: Mapped[str] = mapped_column(String(500), nullable=True)
    company_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("companies.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    direct_phone: Mapped[str] = mapped_column(String(50), nullable=True)
    email_2: Mapped[str] = mapped_column(String(255), nullable=True)
    email_active_status: Mapped[str] = mapped_column(String(100), nullable=True)
    lead_source: Mapped[str] = mapped_column(String(200), nullable=True)
    management_level: Mapped[str] = mapped_column(String(200), nullable=True)
    address_street: Mapped[str] = mapped_column(String(500), nullable=True)
    address_city: Mapped[str] = mapped_column(String(200), nullable=True)
    address_state: Mapped[str] = mapped_column(String(200), nullable=True)
    address_country: Mapped[str] = mapped_column(String(200), nullable=True)
    address_zip: Mapped[str] = mapped_column(String(50), nullable=True)
    primary_timezone: Mapped[str] = mapped_column(String(100), nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    linkedin_summary: Mapped[str] = mapped_column(Text, nullable=True)
    data_requester_details: Mapped[str] = mapped_column(String(500), nullable=True)
    segment_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("segments.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="uploaded") # uploaded/approved/assigned_to_sdr/meeting_scheduled
    assigned_sdr_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    batch_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("upload_batches.id"), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship("Company")
    segment = relationship("Segment")
    sdr = relationship("User", foreign_keys=[assigned_sdr_id])
    creator = relationship("User", foreign_keys=[created_by])
