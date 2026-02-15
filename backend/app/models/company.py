from sqlalchemy import String, Boolean, DateTime, func, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

import uuid
from ..database import Base
from ..utils.types import GUID

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    website: Mapped[str] = mapped_column(String(500), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    industry: Mapped[str] = mapped_column(String(200), nullable=True)
    sub_industry: Mapped[str] = mapped_column(String(200), nullable=True)
    address_street: Mapped[str] = mapped_column(String(500), nullable=True)
    address_city: Mapped[str] = mapped_column(String(200), nullable=True)
    address_state: Mapped[str] = mapped_column(String(200), nullable=True)
    address_country: Mapped[str] = mapped_column(String(200), nullable=True)
    address_zip: Mapped[str] = mapped_column(String(50), nullable=True)
    founded_year: Mapped[int] = mapped_column(Integer, nullable=True)
    revenue_range: Mapped[str] = mapped_column(String(200), nullable=True)
    employee_size_range: Mapped[str] = mapped_column(String(200), nullable=True)
    segment_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("segments.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending/approved/rejected
    rejection_reason: Mapped[str] = mapped_column(Text, nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    batch_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("upload_batches.id"), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    segment = relationship("Segment")
    uploader = relationship("User")
