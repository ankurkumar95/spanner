from sqlalchemy import String, DateTime, func, ForeignKey, Column, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

import uuid
from ..database import Base
from ..utils.types import GUID

segment_offerings = Table(
    "segment_offerings",
    Base.metadata,
    Column("segment_id", GUID, ForeignKey("segments.id"), primary_key=True),
    Column("offering_id", GUID, ForeignKey("offerings.id"), primary_key=True),
)

class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active") # active/archived
    created_by: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    offerings = relationship("Offering", secondary=segment_offerings, back_populates="segments")

class Offering(Base):
    __tablename__ = "offerings"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active") # active/inactive
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    segments = relationship("Segment", secondary=segment_offerings, back_populates="offerings")
