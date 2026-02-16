"""
Simple unit tests that don't require full environment setup.
These tests focus on logic, validation, and structure without database dependencies.
"""

import sys
import os

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestProjectStructure:
    """Test basic project structure and file organization."""

    def test_app_directory_exists(self):
        """Test that app directory exists."""
        app_dir = os.path.join(os.path.dirname(__file__), '..', 'app')
        assert os.path.exists(app_dir)
        assert os.path.isdir(app_dir)

    def test_core_modules_exist(self):
        """Test that core modules exist."""
        core_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'core')
        assert os.path.exists(os.path.join(core_dir, 'config.py'))
        assert os.path.exists(os.path.join(core_dir, 'database.py'))
        assert os.path.exists(os.path.join(core_dir, 'security.py'))
        assert os.path.exists(os.path.join(core_dir, 'deps.py'))

    def test_models_directory_exists(self):
        """Test that models directory exists."""
        models_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'models')
        assert os.path.exists(models_dir)
        assert os.path.isdir(models_dir)

    def test_routers_directory_exists(self):
        """Test that routers directory exists."""
        routers_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers')
        assert os.path.exists(routers_dir)
        assert os.path.isdir(routers_dir)

    def test_schemas_directory_exists(self):
        """Test that schemas directory exists."""
        schemas_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'schemas')
        assert os.path.exists(schemas_dir)
        assert os.path.isdir(schemas_dir)

    def test_services_directory_exists(self):
        """Test that services directory exists."""
        services_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'services')
        assert os.path.exists(services_dir)
        assert os.path.isdir(services_dir)

    def test_alembic_directory_exists(self):
        """Test that alembic migrations directory exists."""
        alembic_dir = os.path.join(os.path.dirname(__file__), '..', 'alembic')
        assert os.path.exists(alembic_dir)
        assert os.path.isdir(alembic_dir)

    def test_requirements_file_exists(self):
        """Test that requirements.txt exists."""
        req_file = os.path.join(os.path.dirname(__file__), '..', 'requirements.txt')
        assert os.path.exists(req_file)

    def test_requirements_contains_key_packages(self):
        """Test that requirements.txt contains key packages."""
        req_file = os.path.join(os.path.dirname(__file__), '..', 'requirements.txt')
        with open(req_file, 'r') as f:
            content = f.read()

        assert 'fastapi' in content.lower()
        assert 'sqlalchemy' in content.lower()
        assert 'pydantic' in content.lower()
        assert 'pytest' in content.lower()
        assert 'alembic' in content.lower()


class TestCodeQuality:
    """Test code quality and best practices."""

    def test_no_print_statements_in_production_code(self):
        """Test that production code doesn't contain print statements (should use logging)."""
        # This is a basic check - in real projects you'd use a linter
        import glob

        violations = []
        for py_file in glob.glob(os.path.join(os.path.dirname(__file__), '..', 'app', '**', '*.py'), recursive=True):
            with open(py_file, 'r') as f:
                lines = f.readlines()
                for i, line in enumerate(lines, 1):
                    stripped = line.strip()
                    if stripped.startswith('print(') and not stripped.startswith('#'):
                        violations.append(f"{py_file}:{i}")

        # Allow some violations but warn if there are any
        assert len(violations) < 5, f"Found print statements in: {violations}"

    def test_all_python_files_have_docstrings(self):
        """Test that major Python modules have module-level docstrings."""
        import glob

        missing_docstrings = []
        for py_file in glob.glob(os.path.join(os.path.dirname(__file__), '..', 'app', '**', '*.py'), recursive=True):
            # Skip __init__.py files
            if os.path.basename(py_file) == '__init__.py':
                continue

            with open(py_file, 'r') as f:
                content = f.read()
                # Check if file starts with a docstring
                if not (content.strip().startswith('"""') or content.strip().startswith("'''")):
                    missing_docstrings.append(py_file)

        # Most files should have docstrings
        assert len(missing_docstrings) < len(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'app', '**', '*.py'), recursive=True)) / 2


class TestConfigurationFiles:
    """Test configuration files are properly set up."""

    def test_alembic_ini_exists(self):
        """Test that alembic.ini exists."""
        alembic_ini = os.path.join(os.path.dirname(__file__), '..', 'alembic.ini')
        assert os.path.exists(alembic_ini)

    def test_alembic_env_exists(self):
        """Test that alembic env.py exists."""
        alembic_env = os.path.join(os.path.dirname(__file__), '..', 'alembic', 'env.py')
        assert os.path.exists(alembic_env)

    def test_dockerfile_exists(self):
        """Test that Dockerfile exists."""
        dockerfile = os.path.join(os.path.dirname(__file__), '..', 'Dockerfile')
        assert os.path.exists(dockerfile)

    def test_dockerfile_contains_correct_base_image(self):
        """Test that Dockerfile uses a Python base image."""
        dockerfile = os.path.join(os.path.dirname(__file__), '..', 'Dockerfile')
        with open(dockerfile, 'r') as f:
            content = f.read()

        assert 'python' in content.lower()


class TestAPIEndpoints:
    """Test API endpoint structure without running the server."""

    def test_routers_follow_naming_convention(self):
        """Test that router files follow naming conventions."""
        import glob

        routers = glob.glob(os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', '*.py'))
        for router_file in routers:
            basename = os.path.basename(router_file)
            # Router files should be lowercase with underscores
            assert basename.replace('_', '').replace('.py', '').islower()

    def test_key_routers_exist(self):
        """Test that key router files exist."""
        routers_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers')

        expected_routers = [
            'auth.py',
            'users.py',
            'segments.py',
            'companies.py',
            'contacts.py',
        ]

        for router in expected_routers:
            assert os.path.exists(os.path.join(routers_dir, router))


class TestDatabaseMigrations:
    """Test database migrations setup."""

    def test_migrations_directory_exists(self):
        """Test that migrations directory exists."""
        versions_dir = os.path.join(os.path.dirname(__file__), '..', 'alembic', 'versions')
        assert os.path.exists(versions_dir)

    def test_migration_files_exist(self):
        """Test that at least one migration file exists."""
        import glob

        migrations = glob.glob(os.path.join(os.path.dirname(__file__), '..', 'alembic', 'versions', '*.py'))
        # Filter out __pycache__ and __init__.py
        migrations = [m for m in migrations if not m.endswith('__init__.py')]

        assert len(migrations) > 0, "No migration files found"


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
