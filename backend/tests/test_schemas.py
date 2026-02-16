"""
Tests for Pydantic schema validation.
"""

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.segment import (
    SegmentCreate,
    SegmentUpdate,
    OfferingCreate,
    OfferingUpdate,
)
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.schemas.contact import ContactCreate, ContactUpdate
from app.schemas.user import UserCreate, UserUpdate


class TestSegmentSchemas:
    """Test segment schema validation."""

    def test_segment_create_valid(self):
        """Test valid segment creation."""
        data = {
            "name": "Test Segment",
            "description": "A test segment",
            "status": "active",
        }
        segment = SegmentCreate(**data)

        assert segment.name == "Test Segment"
        assert segment.description == "A test segment"
        assert segment.status == "active"

    def test_segment_create_empty_name(self):
        """Test segment creation with empty name fails."""
        with pytest.raises(ValidationError):
            SegmentCreate(name="", description="Test")

    def test_segment_create_long_name(self):
        """Test segment creation with name too long fails."""
        with pytest.raises(ValidationError):
            SegmentCreate(name="x" * 256, description="Test")

    def test_segment_create_minimal(self):
        """Test segment creation with minimal fields."""
        segment = SegmentCreate(name="Test")

        assert segment.name == "Test"
        assert segment.description is None
        assert segment.offering_ids == []

    def test_segment_update_partial(self):
        """Test segment update with partial fields."""
        update = SegmentUpdate(name="Updated Name")

        assert update.name == "Updated Name"
        assert update.description is None
        assert update.status is None

    def test_segment_update_empty(self):
        """Test segment update with no fields is valid."""
        update = SegmentUpdate()

        assert update.name is None
        assert update.description is None


class TestOfferingSchemas:
    """Test offering schema validation."""

    def test_offering_create_valid(self):
        """Test valid offering creation."""
        data = {
            "name": "Test Offering",
            "description": "A test offering",
            "status": "active",
        }
        offering = OfferingCreate(**data)

        assert offering.name == "Test Offering"
        assert offering.description == "A test offering"

    def test_offering_create_empty_name(self):
        """Test offering creation with empty name fails."""
        with pytest.raises(ValidationError):
            OfferingCreate(name="")

    def test_offering_update_partial(self):
        """Test offering update with partial fields."""
        update = OfferingUpdate(name="Updated")

        assert update.name == "Updated"
        assert update.description is None


class TestCompanySchemas:
    """Test company schema validation."""

    def test_company_create_valid(self):
        """Test valid company creation."""
        segment_id = uuid4()
        data = {
            "segment_id": segment_id,
            "name": "Test Company",
            "website": "https://test.com",
            "industry": "Technology",
        }
        company = CompanyCreate(**data)

        assert company.name == "Test Company"
        assert company.website == "https://test.com"
        assert company.segment_id == segment_id

    def test_company_create_empty_name(self):
        """Test company creation with empty name fails."""
        with pytest.raises(ValidationError):
            CompanyCreate(
                segment_id=uuid4(),
                name="",
                website="https://test.com"
            )

    def test_company_create_minimal(self):
        """Test company creation with minimal required fields."""
        segment_id = uuid4()
        company = CompanyCreate(
            segment_id=segment_id,
            name="Test Company"
        )

        assert company.name == "Test Company"
        assert company.segment_id == segment_id
        assert company.website is None

    def test_company_update_partial(self):
        """Test company update with partial fields."""
        update = CompanyUpdate(name="Updated Company")

        assert update.name == "Updated Company"
        assert update.website is None


class TestContactSchemas:
    """Test contact schema validation."""

    def test_contact_create_valid(self):
        """Test valid contact creation."""
        company_id = uuid4()
        data = {
            "company_id": company_id,
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "title": "Engineer",
        }
        contact = ContactCreate(**data)

        assert contact.first_name == "John"
        assert contact.last_name == "Doe"
        assert contact.email == "john.doe@example.com"

    def test_contact_create_invalid_email(self):
        """Test contact creation with invalid email fails."""
        with pytest.raises(ValidationError):
            ContactCreate(
                company_id=uuid4(),
                first_name="John",
                last_name="Doe",
                email="invalid-email"
            )

    def test_contact_create_empty_first_name(self):
        """Test contact creation with empty first name fails."""
        with pytest.raises(ValidationError):
            ContactCreate(
                company_id=uuid4(),
                first_name="",
                last_name="Doe",
                email="john@example.com"
            )

    def test_contact_update_partial(self):
        """Test contact update with partial fields."""
        update = ContactUpdate(title="Senior Engineer")

        assert update.title == "Senior Engineer"
        assert update.first_name is None


class TestUserSchemas:
    """Test user schema validation."""

    def test_user_create_valid(self):
        """Test valid user creation."""
        data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "password123",
        }
        user = UserCreate(**data)

        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.password == "password123"

    def test_user_create_invalid_email(self):
        """Test user creation with invalid email fails."""
        with pytest.raises(ValidationError):
            UserCreate(
                email="invalid-email",
                name="Test User",
                password="password123"
            )

    def test_user_create_short_password(self):
        """Test user creation with short password fails."""
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                name="Test User",
                password="123"
            )

    def test_user_update_partial(self):
        """Test user update with partial fields."""
        update = UserUpdate(name="Updated Name")

        assert update.name == "Updated Name"
        assert update.email is None

    def test_user_update_empty_password_allowed(self):
        """Test user update allows None password (no change)."""
        update = UserUpdate(name="Test")

        assert update.password is None
