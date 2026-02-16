# Spanner CRM Backend Tests

Comprehensive test suite for the Spanner CRM backend application.

## Quick Start

### Run Structure Tests (Works with any Python version)
```bash
python3 -m pytest tests/test_simple.py -v
```

### Run Full Test Suite (Requires Python 3.10-3.13)
```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

## Test Files

### 1. `conftest.py`
**Test configuration and fixtures**
- Database session management (SQLite in-memory)
- HTTP client setup with FastAPI TestClient
- Authentication token fixtures
- Test data factories (users, segments, companies, contacts)

### 2. `test_security.py`
**Security utility tests (20 tests)**
- Password hashing and verification
- JWT token creation (access and refresh)
- Token decoding and validation
- Token expiration handling
- Custom claims support

### 3. `test_auth.py`
**Authentication endpoint tests (15 tests)**
- Login with valid/invalid credentials
- Token refresh flow
- Current user retrieval
- Inactive user handling
- Protected endpoint authorization

### 4. `test_schemas.py`
**Pydantic schema validation (25+ tests)**
- Segment/Offering schemas
- Company schemas
- Contact schemas
- User schemas
- Validation rules (length, format, required fields)
- Partial updates

### 5. `test_segments_api.py`
**Segment CRUD API tests (20 tests)**
- Create/Read/Update/Delete segments
- Archive functionality
- Offering management
- Authorization checks
- List/filter operations

### 6. `test_companies_api.py`
**Company CRUD API tests (15 tests)**
- Create/Read/Update/Delete companies
- Approval workflow (approve/reject)
- Status transitions
- Search and pagination
- Filter by segment

### 7. `test_contacts_api.py`
**Contact CRUD API tests (15 tests)**
- Create/Read/Update/Delete contacts
- Pipeline stage management
- Status updates
- Search and pagination
- Bulk operations

### 8. `test_imports.py`
**Module import and structure tests (15 tests)**
- All modules import without errors
- Configuration loading
- Model definitions
- Router registration
- CORS middleware

### 9. `test_simple.py`
**Structural validation tests (19 tests)** ✅ Currently passing
- Project structure
- Code quality checks
- Configuration files
- Migration setup

## Test Database

Tests use **SQLite in-memory database** for:
- Fast execution (no disk I/O)
- Complete isolation between tests
- No cleanup required
- No external dependencies

The `conftest.py` file automatically:
1. Creates fresh database schema before each test
2. Provides clean database session
3. Rolls back changes after test
4. Drops schema after test

## Fixtures

### Database & Client
- `db_session` - Fresh async database session
- `client` - Async HTTP client with dependency overrides

### Authentication
- `test_user` - Standard user in database
- `test_admin` - Admin user with roles
- `user_token` - JWT access token for test user
- `admin_token` - JWT access token for admin
- `auth_headers` - Authorization headers with user token
- `admin_auth_headers` - Authorization headers with admin token

### Test Data
- `test_segment` - Pre-created segment
- `test_company` - Pre-created company in segment
- `test_contact` - Pre-created contact for company

## Running Specific Test Categories

```bash
# Security tests only
pytest tests/test_security.py -v

# API tests only
pytest tests/test_*_api.py -v

# Schema validation only
pytest tests/test_schemas.py -v

# Import tests only
pytest tests/test_imports.py -v

# With coverage report
pytest tests/ --cov=app --cov-report=term-missing

# Stop on first failure
pytest tests/ -x

# Run in parallel (requires pytest-xdist)
pytest tests/ -n auto
```

## Test Patterns

### Testing Endpoints
```python
async def test_create_resource(client: AsyncClient, auth_headers: dict):
    """Test creating a resource."""
    data = {"name": "Test"}

    response = await client.post(
        "/api/v1/resources",
        json=data,
        headers=auth_headers
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Test"
```

### Testing Authorization
```python
async def test_unauthorized_access(client: AsyncClient):
    """Test endpoint requires authentication."""
    response = await client.get("/api/v1/resources")
    assert response.status_code == 401
```

### Testing Database Operations
```python
async def test_database_operation(db_session: AsyncSession):
    """Test database operation."""
    from app.models.user import User

    user = User(email="test@example.com", name="Test")
    db_session.add(user)
    await db_session.commit()

    assert user.id is not None
```

## Environment Variables for Testing

Tests automatically set:
```python
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
SECRET_KEY = "test-secret-key-for-testing-only-not-for-production"
ENVIRONMENT = "test"
```

## Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Core (security, config) | 90%+ | Tests ready |
| Models | 80%+ | Tests ready |
| Schemas | 95%+ | Tests ready |
| Services | 85%+ | Tests ready |
| Routers | 80%+ | Tests ready |

## Continuous Integration

### Recommended CI Setup (GitHub Actions)

```yaml
- name: Run Backend Tests
  run: |
    cd backend
    python -m pytest tests/ -v --cov=app --cov-report=xml

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./backend/coverage.xml
```

## Troubleshooting

### Import Errors
- Ensure you're in the `backend/` directory when running tests
- Check that all dependencies are installed: `pip install -r requirements.txt`

### Database Errors
- Tests use SQLite, not PostgreSQL
- No need to run migrations for tests
- Each test gets a fresh database

### Async Errors
- Ensure pytest-asyncio is installed
- Use `@pytest.mark.asyncio` decorator on async test functions

### Fixture Not Found
- Check that `conftest.py` is in the `tests/` directory
- Ensure fixture names match exactly

## Adding New Tests

1. Create new test file: `tests/test_feature.py`
2. Import fixtures from conftest: `from conftest import client, db_session`
3. Use `@pytest.mark.asyncio` for async tests
4. Follow naming convention: `test_<what_it_tests>`
5. Add docstring explaining what test validates
6. Run to verify: `pytest tests/test_feature.py -v`

## Best Practices

✅ **One assertion per test** (or closely related assertions)
✅ **Descriptive test names** that explain what's being tested
✅ **Test both success and failure cases**
✅ **Use fixtures** for common setup
✅ **Clean test data** - don't depend on other tests
✅ **Mock external services** - don't call real APIs in tests
✅ **Test edge cases** - empty strings, None values, invalid IDs

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-Asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/orm/session_basics.html#using-a-sessionmaker)
