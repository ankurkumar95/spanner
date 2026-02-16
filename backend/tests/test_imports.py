"""
Tests to verify all modules import correctly without errors.
This catches issues with missing dependencies, syntax errors, and circular imports.
"""

import pytest


class TestModuleImports:
    """Test that all application modules can be imported."""

    def test_import_main(self):
        """Test main application module imports."""
        from app import main
        assert main is not None

    def test_import_core_modules(self):
        """Test core modules import."""
        from app.core import config, database, security, deps
        assert config is not None
        assert database is not None
        assert security is not None
        assert deps is not None

    def test_import_models(self):
        """Test all model modules import."""
        from app.models import (
            user,
            segment,
            company,
            contact,
            assignment,
            audit_log,
            notification,
            upload_batch,
            marketing_collateral,
        )
        assert user is not None
        assert segment is not None
        assert company is not None
        assert contact is not None

    def test_import_schemas(self):
        """Test all schema modules import."""
        from app.schemas import (
            user,
            segment,
            company,
            contact,
            auth,
        )
        assert user is not None
        assert segment is not None
        assert company is not None
        assert contact is not None
        assert auth is not None

    def test_import_routers(self):
        """Test all router modules import."""
        from app.routers import (
            auth,
            users,
            segments,
            companies,
            contacts,
            assignments,
            uploads,
            exports,
            notifications,
            marketing,
            audit,
        )
        assert auth is not None
        assert users is not None
        assert segments is not None
        assert companies is not None
        assert contacts is not None

    def test_import_services(self):
        """Test service modules import."""
        from app import services
        assert services is not None


class TestConfigurationLoading:
    """Test configuration and settings."""

    def test_settings_loads(self):
        """Test that settings object loads correctly."""
        from app.core.config import settings

        assert settings is not None
        assert hasattr(settings, "DATABASE_URL")
        assert hasattr(settings, "SECRET_KEY")
        assert hasattr(settings, "ALGORITHM")

    def test_settings_test_values(self):
        """Test that test environment variables are set correctly."""
        from app.core.config import settings

        assert settings.ENVIRONMENT == "test"
        assert "sqlite" in settings.DATABASE_URL.lower()
        assert settings.SECRET_KEY == "test-secret-key-for-testing-only-not-for-production"


class TestDatabaseModels:
    """Test database model definitions."""

    def test_user_model_exists(self):
        """Test User model is defined."""
        from app.models.user import User
        assert User is not None
        assert hasattr(User, "__tablename__")

    def test_segment_model_exists(self):
        """Test Segment model is defined."""
        from app.models.segment import Segment
        assert Segment is not None
        assert hasattr(Segment, "__tablename__")

    def test_company_model_exists(self):
        """Test Company model is defined."""
        from app.models.company import Company
        assert Company is not None
        assert hasattr(Company, "__tablename__")

    def test_contact_model_exists(self):
        """Test Contact model is defined."""
        from app.models.contact import Contact
        assert Contact is not None
        assert hasattr(Contact, "__tablename__")


class TestAPIRouterRegistration:
    """Test that API routers are registered correctly."""

    def test_app_instance_exists(self):
        """Test FastAPI app instance exists."""
        from app.main import app
        assert app is not None

    def test_routers_included(self):
        """Test that routers are included in the app."""
        from app.main import app

        # Get all registered routes
        routes = [route.path for route in app.routes]

        # Check for key API routes
        assert any("/api/v1/auth" in route for route in routes)
        assert any("/api/v1/segments" in route for route in routes)
        assert any("/api/v1/companies" in route for route in routes)
        assert any("/api/v1/contacts" in route for route in routes)

    def test_cors_middleware_configured(self):
        """Test CORS middleware is configured."""
        from app.main import app

        # Check that middleware is configured
        middleware_types = [type(m).__name__ for m in app.user_middleware]
        assert any("CORS" in name for name in middleware_types)
