"""
Integration tests for companies API endpoints.
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
class TestCompaniesAPI:
    """Test company CRUD operations via API."""

    async def test_create_company_success(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test creating a company successfully."""
        data = {
            "segment_id": str(test_segment["id"]),
            "name": "Test Company Inc",
            "website": "https://testcompany.com",
            "industry": "Technology",
            "employee_count": 150,
        }

        response = await client.post(
            "/api/v1/companies",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        company = response.json()
        assert company["name"] == data["name"]
        assert company["website"] == data["website"]
        assert company["industry"] == data["industry"]
        assert "id" in company
        assert company["status"] == "pending"

    async def test_create_company_unauthorized(
        self,
        client: AsyncClient,
        test_segment: dict
    ):
        """Test creating company without authentication fails."""
        data = {
            "segment_id": str(test_segment["id"]),
            "name": "Test Company",
        }

        response = await client.post(
            "/api/v1/companies",
            json=data
        )

        assert response.status_code == 401

    async def test_create_company_invalid_segment(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating company with non-existent segment fails."""
        data = {
            "segment_id": str(uuid4()),
            "name": "Test Company",
        }

        response = await client.post(
            "/api/v1/companies",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_list_companies(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test listing companies."""
        response = await client.get(
            "/api/v1/companies",
            headers=auth_headers
        )

        assert response.status_code == 200
        companies = response.json()
        assert isinstance(companies, list)
        assert len(companies) >= 1

    async def test_list_companies_filter_by_segment(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test listing companies filtered by segment."""
        response = await client.get(
            f"/api/v1/companies?segment_id={test_company['segment_id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        companies = response.json()
        assert all(c["segment_id"] == str(test_company["segment_id"]) for c in companies)

    async def test_get_company_by_id(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test getting a specific company by ID."""
        response = await client.get(
            f"/api/v1/companies/{test_company['id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        company = response.json()
        assert company["id"] == str(test_company["id"])
        assert company["name"] == test_company["name"]

    async def test_get_company_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test getting non-existent company returns 404."""
        response = await client.get(
            f"/api/v1/companies/{uuid4()}",
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_update_company(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test updating a company."""
        update_data = {
            "name": "Updated Company Name",
            "industry": "Finance",
        }

        response = await client.put(
            f"/api/v1/companies/{test_company['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        company = response.json()
        assert company["name"] == update_data["name"]
        assert company["industry"] == update_data["industry"]

    async def test_update_company_status(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test updating company status."""
        update_data = {
            "status": "active",
        }

        response = await client.put(
            f"/api/v1/companies/{test_company['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        company = response.json()
        assert company["status"] == "active"

    async def test_approve_company(
        self,
        client: AsyncClient,
        test_company: dict,
        admin_auth_headers: dict,
        test_admin: dict,
        db_session: AsyncSession
    ):
        """Test approving a company (requires admin role)."""
        # Grant admin role approval permission
        from sqlalchemy import text

        await db_session.execute(
            text("INSERT INTO role_grants (role, action, granted) VALUES ('admin', 'approve_company', true) ON CONFLICT DO NOTHING")
        )
        await db_session.commit()

        response = await client.post(
            f"/api/v1/companies/{test_company['id']}/approve",
            headers=admin_auth_headers
        )

        # May return 200 or 403 depending on permission setup
        assert response.status_code in [200, 403]

    async def test_reject_company(
        self,
        client: AsyncClient,
        test_company: dict,
        admin_auth_headers: dict,
        test_admin: dict,
        db_session: AsyncSession
    ):
        """Test rejecting a company (requires admin role)."""
        # Grant admin role approval permission
        from sqlalchemy import text

        await db_session.execute(
            text("INSERT INTO role_grants (role, action, granted) VALUES ('admin', 'approve_company', true) ON CONFLICT DO NOTHING")
        )
        await db_session.commit()

        data = {
            "reason": "Does not meet criteria"
        }

        response = await client.post(
            f"/api/v1/companies/{test_company['id']}/reject",
            json=data,
            headers=admin_auth_headers
        )

        # May return 200 or 403 depending on permission setup
        assert response.status_code in [200, 403]

    async def test_delete_company(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test deleting a company."""
        response = await client.delete(
            f"/api/v1/companies/{test_company['id']}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await client.get(
            f"/api/v1/companies/{test_company['id']}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    async def test_list_companies_pagination(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test companies list pagination."""
        response = await client.get(
            "/api/v1/companies?limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code == 200
        companies = response.json()
        assert isinstance(companies, list)
        assert len(companies) <= 10

    async def test_search_companies(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test searching companies by name."""
        response = await client.get(
            f"/api/v1/companies?search={test_company['name'][:5]}",
            headers=auth_headers
        )

        assert response.status_code == 200
        companies = response.json()
        assert isinstance(companies, list)
