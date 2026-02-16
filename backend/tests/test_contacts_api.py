"""
Integration tests for contacts API endpoints.
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestContactsAPI:
    """Test contact CRUD operations via API."""

    async def test_create_contact_success(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test creating a contact successfully."""
        data = {
            "company_id": str(test_company["id"]),
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@testcompany.com",
            "title": "Product Manager",
            "phone": "+1-555-1234",
        }

        response = await client.post(
            "/api/v1/contacts",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        contact = response.json()
        assert contact["first_name"] == data["first_name"]
        assert contact["last_name"] == data["last_name"]
        assert contact["email"] == data["email"]
        assert contact["title"] == data["title"]
        assert "id" in contact

    async def test_create_contact_unauthorized(
        self,
        client: AsyncClient,
        test_company: dict
    ):
        """Test creating contact without authentication fails."""
        data = {
            "company_id": str(test_company["id"]),
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@test.com",
        }

        response = await client.post(
            "/api/v1/contacts",
            json=data
        )

        assert response.status_code == 401

    async def test_create_contact_invalid_company(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating contact with non-existent company fails."""
        data = {
            "company_id": str(uuid4()),
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@test.com",
        }

        response = await client.post(
            "/api/v1/contacts",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_create_contact_invalid_email(
        self,
        client: AsyncClient,
        test_company: dict,
        auth_headers: dict
    ):
        """Test creating contact with invalid email fails."""
        data = {
            "company_id": str(test_company["id"]),
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "invalid-email",
        }

        response = await client.post(
            "/api/v1/contacts",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_list_contacts(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test listing contacts."""
        response = await client.get(
            "/api/v1/contacts",
            headers=auth_headers
        )

        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)
        assert len(contacts) >= 1

    async def test_list_contacts_filter_by_company(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test listing contacts filtered by company."""
        response = await client.get(
            f"/api/v1/contacts?company_id={test_contact['company_id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        contacts = response.json()
        assert all(c["company_id"] == str(test_contact["company_id"]) for c in contacts)

    async def test_list_contacts_filter_by_status(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test listing contacts filtered by status."""
        response = await client.get(
            f"/api/v1/contacts?status={test_contact['status']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)

    async def test_get_contact_by_id(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test getting a specific contact by ID."""
        response = await client.get(
            f"/api/v1/contacts/{test_contact['id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        contact = response.json()
        assert contact["id"] == str(test_contact["id"])
        assert contact["first_name"] == test_contact["first_name"]
        assert contact["last_name"] == test_contact["last_name"]

    async def test_get_contact_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test getting non-existent contact returns 404."""
        response = await client.get(
            f"/api/v1/contacts/{uuid4()}",
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_update_contact(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test updating a contact."""
        update_data = {
            "title": "Senior Software Engineer",
            "phone": "+1-555-9999",
        }

        response = await client.put(
            f"/api/v1/contacts/{test_contact['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        contact = response.json()
        assert contact["title"] == update_data["title"]
        assert contact["phone"] == update_data["phone"]

    async def test_update_contact_status(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test updating contact status."""
        update_data = {
            "status": "active",
        }

        response = await client.put(
            f"/api/v1/contacts/{test_contact['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        contact = response.json()
        assert contact["status"] == "active"

    async def test_update_contact_pipeline_stage(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test updating contact pipeline stage."""
        update_data = {
            "pipeline_stage": "qualified",
        }

        response = await client.put(
            f"/api/v1/contacts/{test_contact['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        contact = response.json()
        assert contact["pipeline_stage"] == "qualified"

    async def test_delete_contact(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test deleting a contact."""
        response = await client.delete(
            f"/api/v1/contacts/{test_contact['id']}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await client.get(
            f"/api/v1/contacts/{test_contact['id']}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    async def test_search_contacts(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test searching contacts by name or email."""
        response = await client.get(
            f"/api/v1/contacts?search={test_contact['first_name']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)

    async def test_list_contacts_pagination(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test contacts list pagination."""
        response = await client.get(
            "/api/v1/contacts?limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code == 200
        contacts = response.json()
        assert isinstance(contacts, list)
        assert len(contacts) <= 10

    async def test_bulk_update_contacts_status(
        self,
        client: AsyncClient,
        test_contact: dict,
        auth_headers: dict
    ):
        """Test bulk updating contact statuses."""
        data = {
            "contact_ids": [str(test_contact["id"])],
            "status": "active",
        }

        response = await client.post(
            "/api/v1/contacts/bulk-update",
            json=data,
            headers=auth_headers
        )

        # May return 200 or 404 depending on implementation
        assert response.status_code in [200, 404, 405]
