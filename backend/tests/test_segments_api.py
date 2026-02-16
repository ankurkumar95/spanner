"""
Integration tests for segments API endpoints.
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
class TestSegmentsAPI:
    """Test segment CRUD operations via API."""

    async def test_create_segment_success(
        self,
        client: AsyncClient,
        test_user: dict,
        auth_headers: dict
    ):
        """Test creating a segment successfully."""
        data = {
            "name": "New Segment",
            "description": "A new test segment",
            "status": "active",
        }

        response = await client.post(
            "/api/v1/segments",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == data["name"]
        assert result["description"] == data["description"]
        assert result["status"] == data["status"]
        assert "id" in result
        assert "created_at" in result

    async def test_create_segment_unauthorized(
        self,
        client: AsyncClient
    ):
        """Test creating segment without authentication fails."""
        data = {
            "name": "New Segment",
            "description": "A new test segment",
        }

        response = await client.post(
            "/api/v1/segments",
            json=data
        )

        assert response.status_code == 401

    async def test_create_segment_invalid_data(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating segment with invalid data fails."""
        data = {
            "name": "",  # Empty name should fail
        }

        response = await client.post(
            "/api/v1/segments",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_list_segments(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test listing all segments."""
        response = await client.get(
            "/api/v1/segments",
            headers=auth_headers
        )

        assert response.status_code == 200
        segments = response.json()
        assert isinstance(segments, list)
        assert len(segments) >= 1
        assert any(s["id"] == str(test_segment["id"]) for s in segments)

    async def test_get_segment_by_id(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test getting a specific segment by ID."""
        response = await client.get(
            f"/api/v1/segments/{test_segment['id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        segment = response.json()
        assert segment["id"] == str(test_segment["id"])
        assert segment["name"] == test_segment["name"]
        assert segment["description"] == test_segment["description"]

    async def test_get_segment_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test getting non-existent segment returns 404."""
        non_existent_id = uuid4()
        response = await client.get(
            f"/api/v1/segments/{non_existent_id}",
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_update_segment(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test updating a segment."""
        update_data = {
            "name": "Updated Segment Name",
            "description": "Updated description",
        }

        response = await client.put(
            f"/api/v1/segments/{test_segment['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        segment = response.json()
        assert segment["name"] == update_data["name"]
        assert segment["description"] == update_data["description"]

    async def test_update_segment_partial(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test partial update of a segment."""
        update_data = {
            "description": "Only updating description",
        }

        response = await client.put(
            f"/api/v1/segments/{test_segment['id']}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        segment = response.json()
        assert segment["description"] == update_data["description"]
        assert segment["name"] == test_segment["name"]  # Unchanged

    async def test_archive_segment(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test archiving a segment."""
        response = await client.post(
            f"/api/v1/segments/{test_segment['id']}/archive",
            headers=auth_headers
        )

        assert response.status_code == 200
        segment = response.json()
        assert segment["status"] == "archived"

    async def test_delete_segment(
        self,
        client: AsyncClient,
        test_segment: dict,
        auth_headers: dict
    ):
        """Test deleting a segment."""
        response = await client.delete(
            f"/api/v1/segments/{test_segment['id']}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/segments/{test_segment['id']}",
            headers=auth_headers
        )
        assert get_response.status_code == 404


@pytest.mark.asyncio
class TestOfferingsAPI:
    """Test offering CRUD operations via API."""

    async def test_create_offering(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating an offering."""
        data = {
            "name": "Test Offering",
            "description": "A test offering",
            "status": "active",
        }

        response = await client.post(
            "/api/v1/offerings",
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        offering = response.json()
        assert offering["name"] == data["name"]
        assert offering["description"] == data["description"]

    async def test_list_offerings(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test listing all offerings."""
        response = await client.get(
            "/api/v1/offerings",
            headers=auth_headers
        )

        assert response.status_code == 200
        offerings = response.json()
        assert isinstance(offerings, list)

    async def test_update_offering(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """Test updating an offering."""
        # First create an offering
        from app.models.segment import Offering

        offering = Offering(
            id=uuid4(),
            name="Original Offering",
            description="Original description",
            status="active",
        )
        db_session.add(offering)
        await db_session.commit()

        # Update it
        update_data = {
            "name": "Updated Offering",
        }

        response = await client.put(
            f"/api/v1/offerings/{offering.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        result = response.json()
        assert result["name"] == update_data["name"]

    async def test_delete_offering(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """Test deleting an offering."""
        # First create an offering
        from app.models.segment import Offering

        offering = Offering(
            id=uuid4(),
            name="To Delete",
            status="active",
        )
        db_session.add(offering)
        await db_session.commit()

        # Delete it
        response = await client.delete(
            f"/api/v1/offerings/{offering.id}",
            headers=auth_headers
        )

        assert response.status_code == 204
