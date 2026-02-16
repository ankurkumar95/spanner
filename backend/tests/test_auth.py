"""
Tests for authentication endpoints (login, refresh, me).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_refresh_token


@pytest.mark.asyncio
class TestAuthEndpoints:
    """Test authentication API endpoints."""

    async def test_login_success(
        self,
        client: AsyncClient,
        test_user: dict
    ):
        """Test successful login with valid credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user["email"],
                "password": test_user["password"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_email(
        self,
        client: AsyncClient,
        test_user: dict
    ):
        """Test login with non-existent email."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": test_user["password"],
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    async def test_login_invalid_password(
        self,
        client: AsyncClient,
        test_user: dict
    ):
        """Test login with incorrect password."""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user["email"],
                "password": "wrongpassword",
            },
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    async def test_login_inactive_user(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user: dict
    ):
        """Test login with deactivated user account."""
        # Deactivate user
        user = test_user["db_user"]
        user.status = "deactivated"
        await db_session.commit()

        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user["email"],
                "password": test_user["password"],
            },
        )

        assert response.status_code == 403
        assert "deactivated" in response.json()["detail"].lower()

    async def test_get_current_user_authenticated(
        self,
        client: AsyncClient,
        test_user: dict,
        auth_headers: dict
    ):
        """Test getting current user info with valid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user["email"]
        assert data["name"] == test_user["name"]
        assert data["status"] == test_user["status"]
        assert "id" in data
        assert "roles" in data

    async def test_get_current_user_no_token(
        self,
        client: AsyncClient
    ):
        """Test getting current user without authentication."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    async def test_get_current_user_invalid_token(
        self,
        client: AsyncClient
    ):
        """Test getting current user with invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )

        assert response.status_code == 401

    async def test_refresh_token_success(
        self,
        client: AsyncClient,
        test_user: dict
    ):
        """Test refreshing access token with valid refresh token."""
        # Create a refresh token
        refresh_token = create_refresh_token(data={"sub": str(test_user["id"])})

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_refresh_token_invalid(
        self,
        client: AsyncClient
    ):
        """Test refresh with invalid token."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"}
        )

        assert response.status_code == 401

    async def test_refresh_token_wrong_type(
        self,
        client: AsyncClient,
        user_token: str
    ):
        """Test refresh with access token instead of refresh token."""
        # Try to use access token as refresh token
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": user_token}
        )

        assert response.status_code == 401
        assert "refresh token" in response.json()["detail"].lower()

    async def test_login_missing_credentials(
        self,
        client: AsyncClient
    ):
        """Test login without providing credentials."""
        response = await client.post(
            "/api/v1/auth/login",
            data={}
        )

        assert response.status_code == 422  # Validation error

    async def test_protected_endpoint_requires_auth(
        self,
        client: AsyncClient
    ):
        """Test that protected endpoints require authentication."""
        # Try to access a protected endpoint without auth
        response = await client.get("/api/v1/segments")

        assert response.status_code == 401
