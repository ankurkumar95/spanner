"""
Tests for security utilities (password hashing, JWT tokens).
"""

from datetime import timedelta

import pytest
from jose import JWTError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password_creates_hash(self):
        """Test that hash_password creates a bcrypt hash."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (salt)."""
        password = "testpassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Test JWT token creation and decoding."""

    def test_create_access_token(self):
        """Test access token creation."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(data={"sub": user_id})

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_refresh_token(data={"sub": user_id})

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self):
        """Test decoding a valid token."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(data={"sub": user_id})

        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_decode_refresh_token(self):
        """Test decoding a refresh token."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_refresh_token(data={"sub": user_id})

        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
        assert "exp" in payload

    def test_decode_expired_token(self):
        """Test that expired token raises JWTError."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        # Create token that expires immediately
        token = create_access_token(
            data={"sub": user_id},
            expires_delta=timedelta(seconds=-1)
        )

        with pytest.raises(JWTError):
            decode_token(token)

    def test_decode_invalid_token(self):
        """Test that invalid token raises JWTError."""
        invalid_token = "invalid.token.here"

        with pytest.raises(JWTError):
            decode_token(invalid_token)

    def test_decode_malformed_token(self):
        """Test that malformed token raises JWTError."""
        malformed_token = "not-a-jwt-token"

        with pytest.raises(JWTError):
            decode_token(malformed_token)

    def test_access_token_custom_expiration(self):
        """Test access token with custom expiration."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(
            data={"sub": user_id},
            expires_delta=timedelta(hours=1)
        )

        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == user_id

    def test_token_includes_custom_claims(self):
        """Test that custom claims are included in token."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        custom_data = {
            "sub": user_id,
            "email": "test@example.com",
            "role": "admin"
        }
        token = create_access_token(data=custom_data)

        payload = decode_token(token)

        assert payload["sub"] == user_id
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "admin"
