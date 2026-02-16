"""
Test configuration and fixtures for Spanner CRM backend tests.

This module provides test fixtures for database, authentication, and HTTP client setup.
Uses SQLite in-memory database for fast, isolated testing.
"""

import asyncio
import os
from typing import AsyncGenerator, Generator
from datetime import timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# Set test environment variables before importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-not-for-production"
os.environ["ENVIRONMENT"] = "test"

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password


# Test database engine - SQLite in-memory for speed and isolation
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=NullPool,  # Disable pooling for SQLite
    echo=False,
)

# Test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """
    Create an event loop for the test session.
    Required for pytest-asyncio to work properly.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    Creates all tables before the test and drops them after.
    """
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async HTTP client for testing API endpoints.
    Overrides the get_db dependency to use the test database.
    """
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data() -> dict:
    """
    Provide test user data for creating test users.
    """
    return {
        "id": uuid4(),
        "email": "test@example.com",
        "name": "Test User",
        "password": "testpassword123",
        "status": "active",
    }


@pytest.fixture
def test_admin_data() -> dict:
    """
    Provide test admin user data.
    """
    return {
        "id": uuid4(),
        "email": "admin@example.com",
        "name": "Admin User",
        "password": "adminpassword123",
        "status": "active",
    }


@pytest.fixture
async def test_user(db_session: AsyncSession, test_user_data: dict) -> dict:
    """
    Create a test user in the database.
    Returns user data with hashed password.
    """
    from app.models.user import User

    user = User(
        id=test_user_data["id"],
        email=test_user_data["email"],
        name=test_user_data["name"],
        hashed_password=hash_password(test_user_data["password"]),
        status=test_user_data["status"],
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return {
        **test_user_data,
        "db_user": user,
    }


@pytest.fixture
async def test_admin(db_session: AsyncSession, test_admin_data: dict) -> dict:
    """
    Create a test admin user in the database with admin role.
    """
    from app.models.user import User, UserRole

    user = User(
        id=test_admin_data["id"],
        email=test_admin_data["email"],
        name=test_admin_data["name"],
        hashed_password=hash_password(test_admin_data["password"]),
        status=test_admin_data["status"],
    )

    db_session.add(user)
    await db_session.flush()

    # Add admin role
    user_role = UserRole(
        user_id=user.id,
        role="admin",
    )
    db_session.add(user_role)

    await db_session.commit()
    await db_session.refresh(user)

    return {
        **test_admin_data,
        "db_user": user,
    }


@pytest.fixture
def user_token(test_user_data: dict) -> str:
    """
    Generate a valid JWT access token for test user.
    """
    return create_access_token(
        data={"sub": str(test_user_data["id"])},
        expires_delta=timedelta(minutes=30)
    )


@pytest.fixture
def admin_token(test_admin_data: dict) -> str:
    """
    Generate a valid JWT access token for test admin.
    """
    return create_access_token(
        data={"sub": str(test_admin_data["id"])},
        expires_delta=timedelta(minutes=30)
    )


@pytest.fixture
def auth_headers(user_token: str) -> dict:
    """
    Provide authorization headers with user token.
    """
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_auth_headers(admin_token: str) -> dict:
    """
    Provide authorization headers with admin token.
    """
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
async def test_segment(db_session: AsyncSession, test_user: dict) -> dict:
    """
    Create a test segment owned by test user.
    """
    from app.models.segment import Segment

    segment = Segment(
        id=uuid4(),
        name="Test Segment",
        description="A test segment for testing",
        owner_id=test_user["id"],
        status="active",
    )

    db_session.add(segment)
    await db_session.commit()
    await db_session.refresh(segment)

    return {
        "id": segment.id,
        "name": segment.name,
        "description": segment.description,
        "owner_id": segment.owner_id,
        "status": segment.status,
        "db_segment": segment,
    }


@pytest.fixture
async def test_company(db_session: AsyncSession, test_segment: dict) -> dict:
    """
    Create a test company in a segment.
    """
    from app.models.company import Company

    company = Company(
        id=uuid4(),
        segment_id=test_segment["id"],
        name="Test Company Inc",
        website="https://testcompany.com",
        industry="Technology",
        employee_count=100,
        status="pending",
        approval_status="pending",
    )

    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    return {
        "id": company.id,
        "segment_id": company.segment_id,
        "name": company.name,
        "website": company.website,
        "industry": company.industry,
        "employee_count": company.employee_count,
        "status": company.status,
        "approval_status": company.approval_status,
        "db_company": company,
    }


@pytest.fixture
async def test_contact(db_session: AsyncSession, test_company: dict) -> dict:
    """
    Create a test contact for a company.
    """
    from app.models.contact import Contact

    contact = Contact(
        id=uuid4(),
        company_id=test_company["id"],
        first_name="John",
        last_name="Doe",
        email="john.doe@testcompany.com",
        title="Software Engineer",
        status="new",
        pipeline_stage="lead",
    )

    db_session.add(contact)
    await db_session.commit()
    await db_session.refresh(contact)

    return {
        "id": contact.id,
        "company_id": contact.company_id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "title": contact.title,
        "status": contact.status,
        "pipeline_stage": contact.pipeline_stage,
        "db_contact": contact,
    }
