# Spanner CRM -- Comprehensive Architecture Document

> **Version:** 2.0.0
> **Last Updated:** 2026-02-16
> **Status:** Approved for Implementation
> **Audience:** Implementation agents, developers, reviewers
> **Source of Truth:** This document supersedes all prior architecture docs in `/docs/`.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Architecture](#2-backend-architecture)
3. [Database Architecture](#3-database-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [API Contract](#5-api-contract)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. System Architecture

### 1.1 High-Level Component Diagram

```
+------------------------------------------------------------------+
|                        Docker Compose Network                      |
|                          (spanner-net)                              |
|                                                                    |
|  +------------------+    +------------------+   +--------------+   |
|  |   React (Vite)   |    |  FastAPI Backend  |   |  PostgreSQL  |   |
|  |   Port: 5173     |--->|   Port: 8000      |-->|  Port: 5432  |   |
|  |                  |    |                    |   |              |   |
|  |  - Tailwind CSS  |    |  - SQLAlchemy     |   |  - Volume:   |   |
|  |  - React Router  |    |  - Alembic        |   |    pgdata    |   |
|  |  - TanStack Query|    |  - JWT Auth       |   |              |   |
|  |  - Zustand       |    |  - RBAC Engine    |   +--------------+   |
|  |                  |    |  - CSV Pipeline   |                      |
|  +------------------+    |  - APScheduler    |                      |
|                          +------------------+                       |
|                                   |                                 |
|                          +------------------+                       |
|                          |  uploads/         |                       |
|                          |  (Docker Volume)  |                       |
|                          +------------------+                       |
+------------------------------------------------------------------+
```

### 1.2 Docker Compose Service Topology

```yaml
# docker-compose.yml structure
services:
  db:         # PostgreSQL 16-alpine, port 5432
  backend:    # Python 3.12-slim, port 8000, depends_on: db (with healthcheck)
  frontend:   # Node 20-alpine, port 5173, depends_on: backend

volumes:
  pgdata:     # Persistent PostgreSQL data
  uploads:    # CSV uploads, error reports

networks:
  spanner-net:
    driver: bridge
```

**Service Details:**

| Service | Image Base | Port (host:container) | Healthcheck | Restart Policy |
|---------|-----------|----------------------|-------------|----------------|
| `db` | `postgres:16-alpine` | `5432:5432` | `pg_isready -U spanner` | `unless-stopped` |
| `backend` | `python:3.12-slim` | `8000:8000` | `GET /api/v1/health` | `unless-stopped` |
| `frontend` | `node:20-alpine` | `5173:5173` | `curl -f http://localhost:5173` | `unless-stopped` |

**Backend container startup sequence:**
1. Wait for `db` healthcheck to pass
2. Run `alembic upgrade head` (apply pending migrations)
3. Run seed script (create default admin user + default role grants if not exists)
4. Start uvicorn

### 1.3 Network Architecture

- All three services on a single Docker bridge network (`spanner-net`).
- Frontend Vite dev server proxies `/api` requests to `http://backend:8000` to avoid CORS during development.
- Backend connects to `db:5432` using internal Docker DNS.
- No external load balancer or nginx -- single-tenant internal tool, direct port access is sufficient.
- In production, the Vite build output would be served by the backend or a static server, but for development all three run independently.

### 1.4 Environment Variables Strategy

All environment variables are defined in a `.env` file at the project root (git-ignored) and referenced by `docker-compose.yml` via `env_file`. A `.env.example` file is committed with placeholder values.

**`.env` file structure:**

```bash
# === Database ===
POSTGRES_USER=spanner
POSTGRES_PASSWORD=spanner_dev_password
POSTGRES_DB=spanner
DATABASE_URL=postgresql+asyncpg://spanner:spanner_dev_password@db:5432/spanner

# === Backend ===
SECRET_KEY=change-me-to-a-64-char-hex-string
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_BYTES=10485760
DUPLICATE_DETECTION_CRON=0 0 * * 0
DEFAULT_ADMIN_EMAIL=admin@spanner.app
DEFAULT_ADMIN_PASSWORD=Admin123!
LOG_LEVEL=INFO

# === Frontend ===
VITE_API_BASE_URL=http://localhost:8000
```

---

## 2. Backend Architecture

### 2.1 Directory Structure

```
backend/
├── Dockerfile
├── requirements.txt
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── versions/               # Migration files (auto-generated)
│   └── script.py.mako
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory, lifespan, router mounts
│   ├── config.py               # Pydantic BaseSettings (reads env vars)
│   ├── database.py             # Async engine, sessionmaker, get_db dependency
│   ├── seed.py                 # Create default admin + role grants on first run
│   ├── models/
│   │   ├── __init__.py         # Re-exports all models (required for Alembic autogenerate)
│   │   ├── base.py             # DeclarativeBase, TimestampMixin, UUIDPKMixin
│   │   ├── enums.py            # Python enums mirroring PG enums
│   │   ├── user.py             # User, UserRole
│   │   ├── segment.py          # Segment, SegmentOffering
│   │   ├── offering.py         # Offering
│   │   ├── company.py          # Company
│   │   ├── contact.py          # Contact
│   │   ├── assignment.py       # Assignment
│   │   ├── batch.py            # UploadBatch
│   │   ├── audit.py            # AuditLog
│   │   ├── role_grant.py       # RoleGrant
│   │   ├── collateral.py       # MarketingCollateral
│   │   └── notification.py     # Notification (for notification center feature)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py             # LoginRequest, TokenResponse, RefreshRequest, etc.
│   │   ├── user.py             # UserCreate, UserUpdate, UserResponse
│   │   ├── segment.py          # SegmentCreate, SegmentUpdate, SegmentResponse
│   │   ├── offering.py         # OfferingCreate, OfferingResponse
│   │   ├── company.py          # CompanyCreate, CompanyUpdate, CompanyResponse
│   │   ├── contact.py          # ContactCreate, ContactUpdate, ContactResponse
│   │   ├── assignment.py       # AssignmentCreate, AssignmentResponse
│   │   ├── batch.py            # BatchResponse, BatchErrorRow
│   │   ├── audit.py            # AuditLogResponse
│   │   ├── collateral.py       # CollateralCreate, CollateralResponse
│   │   ├── notification.py     # NotificationResponse
│   │   ├── dashboard.py        # DashboardKPIs
│   │   └── common.py           # PaginatedResponse[T], ErrorResponse, CursorParams
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py             # login, refresh, forgot-password, reset-password
│   │   ├── users.py            # CRUD users (admin only)
│   │   ├── segments.py         # CRUD segments + offerings management
│   │   ├── offerings.py        # list + create offerings (for autocomplete)
│   │   ├── companies.py        # CRUD + approve/reject + CSV upload + export
│   │   ├── contacts.py         # CRUD + bulk approve + assign SDR + CSV upload + export
│   │   ├── assignments.py      # create assignment, my assignments
│   │   ├── approval_queue.py   # pending companies, uploaded contacts
│   │   ├── batches.py          # list batches, batch detail, error download, reupload
│   │   ├── workbench.py        # researcher workbench endpoints
│   │   ├── collateral.py       # CRUD marketing collateral links
│   │   ├── audit.py            # activity timeline for entity
│   │   ├── dashboard.py        # KPI aggregations
│   │   ├── notifications.py    # list/mark-read notifications
│   │   ├── search.py           # global command search
│   │   └── health.py           # GET /api/v1/health
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Login, token generation, password reset
│   │   ├── user_service.py     # User CRUD, role management
│   │   ├── segment_service.py  # Segment CRUD, offerings management
│   │   ├── offering_service.py # Offering CRUD
│   │   ├── company_service.py  # Company CRUD, status transitions
│   │   ├── contact_service.py  # Contact CRUD, status pipeline
│   │   ├── assignment_service.py
│   │   ├── approval_service.py # Approve/reject companies, bulk approve contacts
│   │   ├── batch_service.py    # Batch creation, status tracking
│   │   ├── csv_service.py      # CSV parse -> validate -> import -> error report
│   │   ├── collateral_service.py
│   │   ├── audit_service.py    # Create audit entries, query timelines
│   │   ├── dashboard_service.py # KPI queries
│   │   ├── notification_service.py
│   │   ├── search_service.py   # Cross-entity search
│   │   └── duplicate_service.py # Dedup detection logic
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py             # BaseRepository[T] with generic CRUD
│   │   ├── user_repo.py
│   │   ├── segment_repo.py
│   │   ├── offering_repo.py
│   │   ├── company_repo.py
│   │   ├── contact_repo.py
│   │   ├── assignment_repo.py
│   │   ├── batch_repo.py
│   │   ├── audit_repo.py
│   │   ├── collateral_repo.py
│   │   ├── notification_repo.py
│   │   └── role_grant_repo.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── cors.py             # CORS configuration helper
│   │   ├── error_handler.py    # Global exception handlers
│   │   └── request_context.py  # X-Request-ID, request timing
│   ├── dependencies/
│   │   ├── __init__.py
│   │   ├── auth.py             # get_current_user, get_current_active_user
│   │   ├── rbac.py             # require_role(), require_grant()
│   │   └── pagination.py       # CursorParams dependency
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── csv_parser.py       # CSV reading, header matching
│   │   ├── csv_validator.py    # Per-row validation logic
│   │   ├── normalizers.py      # Trim whitespace, URL normalization, name casing
│   │   ├── security.py         # bcrypt hash/verify, JWT encode/decode
│   │   └── email.py            # Password reset email stub (logs to console)
│   └── jobs/
│       ├── __init__.py
│       ├── scheduler.py        # APScheduler setup, registered in app lifespan
│       └── duplicate_detection.py  # Weekly dedup job
└── tests/
    ├── conftest.py             # Fixtures: test DB, async client, auth helpers
    ├── factories.py            # Factory Boy factories for all models
    ├── test_auth.py
    ├── test_users.py
    ├── test_segments.py
    ├── test_companies.py
    ├── test_contacts.py
    ├── test_csv_upload.py
    ├── test_approvals.py
    ├── test_assignments.py
    └── test_rbac.py
```

### 2.2 Middleware Stack

Middleware executes in order from outermost (first hit) to innermost:

```
Request
  |
  v
1. RequestContextMiddleware     -- Assigns X-Request-ID, records start time
  |
  v
2. CORSMiddleware              -- Handles preflight, adds CORS headers
  |
  v
3. GlobalExceptionHandler      -- Catches all unhandled exceptions, returns
  |                                consistent error JSON
  v
4. [FastAPI Router Dispatch]
     |
     v
   5. Auth Dependency           -- Extracts JWT from Authorization header, loads user
     |
     v
   6. RBAC Dependency           -- Checks role_grants for required permission
     |
     v
   7. Route Handler             -- Calls service layer
     |
     v
   8. Audit Logging             -- Service methods call audit_service after mutations
```

**Implementation details:**

- **RequestContextMiddleware**: Custom Starlette `BaseHTTPMiddleware`. Generates UUID4 `X-Request-ID` if not present. Adds `X-Request-Duration-Ms` to response. Logs `method path status duration` at INFO level.
- **CORSMiddleware**: Starlette `CORSMiddleware`. Origins from `CORS_ORIGINS` setting (comma-separated). Allow credentials, all methods, all headers.
- **GlobalExceptionHandler**: Registered via `@app.exception_handler(Exception)`. Catches `AppException` hierarchy (returns structured JSON), `RequestValidationError` (returns 422 with field errors), and catch-all `Exception` (returns 500, logs stack trace).

### 2.3 Dependency Injection Strategy

FastAPI's `Depends()` system is the backbone. Key dependency chains:

```python
# Database session -- yields an async session, auto-closes after request
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

# Current user -- extracts JWT, loads user, verifies active status
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    user = await user_repo.get_by_id(db, payload["sub"])
    if not user or user.status != UserStatus.ACTIVE:
        raise AuthenticationException("Invalid or expired token")
    return user

# Role checking -- parameterized dependency factory
def require_role(*roles: UserRole):
    async def checker(user: User = Depends(get_current_user)):
        user_roles = {r.role for r in user.roles}
        if not user_roles.intersection(set(roles)):
            raise AuthorizationException("Insufficient role")
        return user
    return checker

# Grant-based permission checking -- checks role_grants table
def require_grant(action: str):
    async def checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        user_roles = {r.role for r in user.roles}
        grants = await role_grant_repo.get_grants_for_roles(db, user_roles, action)
        if not any(g.granted for g in grants):
            raise AuthorizationException(f"No grant for action: {action}")
        return user
    return checker

# Cursor pagination params
async def get_cursor_params(
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100)
) -> CursorParams:
    return CursorParams(cursor=cursor, limit=limit)
```

**Services are stateless functions/methods, not injected classes.** The `db` session is passed explicitly to every service method call. This keeps things simple, testable (pass a mock session), and avoids DI complexity:

```python
# Router usage pattern
@router.get("/companies")
async def list_companies(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    params: CursorParams = Depends(get_cursor_params),
    segment_id: UUID | None = Query(None),
    status: CompanyStatus | None = Query(None),
    search: str | None = Query(None),
    show_duplicates: bool = Query(False),
):
    return await company_service.list_companies(
        db, user, params, segment_id=segment_id,
        status=status, search=search, show_duplicates=show_duplicates
    )
```

### 2.4 Service Layer Pattern

Strict layering: **Router -> Service -> Repository -> Model**

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Router** | HTTP concerns: parse request, call service, serialize response, set status codes | No business logic. No direct DB access. |
| **Service** | Business logic, validation, orchestration, authorization decisions, audit log calls | May call multiple repositories. No HTTP/FastAPI imports. |
| **Repository** | Data access: SQLAlchemy queries, cursor pagination, filtering | No business logic. Generic base class provides CRUD. |
| **Model** | Table definitions, column types, relationships, constraints | No logic. Pure data structure. |

**BaseRepository pattern:**

```python
class BaseRepository(Generic[T]):
    def __init__(self, model: type[T]):
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: UUID) -> T | None:
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def list_with_cursor(
        self, db: AsyncSession, params: CursorParams,
        filters: list = None, order_desc: bool = True
    ) -> tuple[list[T], str | None]:
        # Build query with cursor-based pagination
        ...

    async def create(self, db: AsyncSession, **kwargs) -> T:
        obj = self.model(**kwargs)
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def update(self, db: AsyncSession, obj: T, **kwargs) -> T:
        for key, value in kwargs.items():
            setattr(obj, key, value)
        await db.flush()
        await db.refresh(obj)
        return obj
```

### 2.5 Async Patterns

**Database engine configuration:**
```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.LOG_LEVEL == "DEBUG",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,        # Detect stale connections
    pool_recycle=3600,         # Recycle connections hourly
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,    # Prevent lazy-load after commit
)
```

**Background Tasks for CSV processing:**
```python
@router.post("/companies/upload")
async def upload_companies_csv(
    file: UploadFile,
    segment_id: UUID = Form(...),
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_grant("upload_company")),
):
    # Step 1-3 are synchronous (file validation, header check, batch creation)
    batch = await csv_service.validate_and_create_batch(db, file, user, "company", segment_id)
    await db.commit()

    # Step 4-6 run in background with their OWN db session
    background_tasks.add_task(
        csv_service.process_csv_async,
        batch_id=batch.id,
        file_path=batch.file_path,
        upload_type="company",
        user_id=user.id,
        segment_id=segment_id,
    )

    return BatchResponse.model_validate(batch)
```

**Scheduled jobs use their own sessions:**
```python
async def run_duplicate_detection():
    async with async_session_factory() as db:
        await duplicate_service.detect_duplicates(db)
        await db.commit()
```

### 2.6 JWT Token Flow

```
1. LOGIN:
   POST /api/v1/auth/login { email, password }
   -> Verify bcrypt hash
   -> Generate access_token  (JWT, 30 min TTL, payload: sub, email, roles, type=access)
   -> Generate refresh_token (JWT, 7 day TTL, payload: sub, type=refresh, version)
   -> Return { access_token, refresh_token, token_type: "bearer", expires_in: 1800 }

2. AUTHENTICATED REQUESTS:
   Header: Authorization: Bearer <access_token>
   -> Decode JWT, verify signature + expiry
   -> Load user from DB by sub (user_id)
   -> Reject if user.status != active
   -> Proceed to route handler

3. TOKEN REFRESH:
   POST /api/v1/auth/refresh { refresh_token }
   -> Decode refresh_token, verify type=refresh
   -> Check token_version matches user.token_version (password change invalidates)
   -> Issue new access_token
   -> Return same refresh_token (no rotation for single-tenant simplicity)

4. PASSWORD RESET:
   POST /api/v1/auth/forgot-password { email }
   -> Generate reset token (random 32-byte hex, stored as bcrypt hash in users.reset_token_hash)
   -> Set users.reset_token_expires = now + 1 hour
   -> Log reset URL to console (no email in MVP)

   POST /api/v1/auth/reset-password { token, new_password }
   -> Verify token against stored hash, check expiry
   -> Update password_hash
   -> Increment token_version (invalidates all refresh tokens)
   -> Clear reset_token_hash

5. LOGOUT:
   Client-side: clear tokens from memory/localStorage.
   No server-side blacklist (acceptable for single-tenant).
```

**Token payload structure:**
```json
// Access token
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@spanner.app",
  "roles": ["admin", "approver"],
  "type": "access",
  "iat": 1708000000,
  "exp": 1708001800
}

// Refresh token
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "type": "refresh",
  "version": 1,
  "iat": 1708000000,
  "exp": 1708604800
}
```

### 2.7 RBAC Implementation

Two-layer authorization:

**Layer 1 -- Role Membership** (`user_roles` table):
Coarse-grained. A user holds one or more roles. Used for route-level access control (e.g., "only admins can manage users").

**Layer 2 -- Grant-Based Permissions** (`role_grants` table):
Fine-grained, admin-configurable. Maps (role, action) -> granted boolean. Used for business action permissions (e.g., "who can approve companies").

**Default role grants (seeded on first startup):**

| Role | Action | Granted |
|------|--------|---------|
| `admin` | `manage_users` | true |
| `admin` | `manage_grants` | true |
| `admin` | `approve_company` | true |
| `admin` | `approve_contact` | true |
| `admin` | `create_company` | true |
| `admin` | `create_contact` | true |
| `admin` | `edit_company` | true |
| `admin` | `edit_contact` | true |
| `admin` | `upload_company` | true |
| `admin` | `upload_contact` | true |
| `admin` | `assign_segment` | true |
| `admin` | `assign_company` | true |
| `admin` | `assign_contact` | true |
| `admin` | `manage_collateral` | true |
| `admin` | `export_data` | true |
| `segment_owner` | `assign_segment` | true |
| `segment_owner` | `assign_sdr` | true |
| `segment_owner` | `create_company` | true |
| `segment_owner` | `edit_company` | true |
| `approver` | `approve_company` | true |
| `approver` | `approve_contact` | true |
| `approver` | `assign_company` | true |
| `approver` | `assign_contact` | true |
| `approver` | `create_company` | true |
| `approver` | `create_contact` | true |
| `approver` | `edit_company` | true |
| `approver` | `edit_contact` | true |
| `approver` | `upload_company` | true |
| `approver` | `upload_contact` | true |
| `researcher` | `create_company` | true |
| `researcher` | `create_contact` | true |
| `researcher` | `edit_company` | true |
| `researcher` | `edit_contact` | true |
| `researcher` | `upload_company` | true |
| `researcher` | `upload_contact` | true |
| `sdr` | `schedule_meeting` | true |
| `marketing` | `manage_collateral` | true |

### 2.8 CSV Processing Pipeline

```
Phase 1 -- SYNCHRONOUS (within HTTP request):
+---------------------------------------------------+
| 1. FILE VALIDATION                                 |
|    - Extension must be .csv                        |
|    - Size <= 10 MB (MAX_UPLOAD_SIZE_BYTES)         |
|    - Encoding: UTF-8 (detect and reject otherwise) |
|    - Not empty (> 0 bytes)                         |
|    If FAIL -> return 400 with specific error       |
+---------------------------------------------------+
                     |
                     v
+---------------------------------------------------+
| 2. HEADER VALIDATION                               |
|    - Read first row as headers                     |
|    - Lowercase + strip whitespace for matching     |
|    - Check all REQUIRED columns are present        |
|      Company: company_name, segment_name           |
|      Contact: first_name, last_name, email,        |
|               company_name                         |
|    - Extra columns: silently ignored               |
|    If FAIL -> return 400 listing missing columns   |
+---------------------------------------------------+
                     |
                     v
+---------------------------------------------------+
| 3. CREATE BATCH + SAVE FILE                        |
|    - Save uploaded file to UPLOAD_DIR/             |
|      {batch_id}/{original_filename}                |
|    - Create upload_batches record:                 |
|      status='processing'                           |
|    - Return batch_id to client immediately         |
+---------------------------------------------------+

Phase 2 -- ASYNCHRONOUS (BackgroundTask with own DB session):
+---------------------------------------------------+
| 4. ROW-BY-ROW VALIDATION                          |
|    For each data row:                              |
|    - Required fields non-empty                     |
|    - Format: email regex, URL scheme check         |
|    - Range: founded_year 1800-current_year         |
|    - Length: per column max lengths                 |
|    - Lookups:                                      |
|      Company CSV: segment_name -> segment exists   |
|                   and status='active'              |
|      Contact CSV: company_name -> company exists   |
|                   and status='approved'            |
|    - Classify row as VALID or INVALID              |
|    - Collect all errors per row (not just first)   |
+---------------------------------------------------+
                     |
                     v
+---------------------------------------------------+
| 5. IMPORT VALID ROWS                               |
|    - Apply normalizations (trim, URL normalize,    |
|      name casing)                                  |
|    - Bulk INSERT valid rows                        |
|    - Companies get status='pending'                |
|    - Contacts get status='uploaded'                |
|    - All rows get batch_id set                     |
|    - created_by = uploading user                   |
+---------------------------------------------------+
                     |
                     v
+---------------------------------------------------+
| 6. ERROR REPORT GENERATION                         |
|    - Write CSV file with columns:                  |
|      row_number, column_name, submitted_value,     |
|      error_message                                 |
|    - Save to UPLOAD_DIR/{batch_id}/errors.csv      |
|    - Update upload_batches:                        |
|      total_rows, valid_rows, invalid_rows,         |
|      status='completed' (or 'failed' if 0 valid), |
|      error_report_url = relative path              |
+---------------------------------------------------+
```

**CSV column mappings:**

Company required: `company_name`, `segment_name`
Company optional: `company_website`, `company_phone`, `company_description`, `company_linkedin_url`, `company_industry`, `company_sub_industry`, `street`, `city`, `state_province`, `country_region`, `zip_postal_code`, `founded_year`, `revenue_range`, `employee_size_range`

Contact required: `first_name`, `last_name`, `email`, `company_name`
Contact optional (matching the Contact Research Template 39 columns): `mobile_phone`, `job_title`, `direct_phone_number`, `email_address_2`, `email_active_status`, `lead_source_global`, `management_level`, `street`, `city`, `state_province`, `country_region`, `zip_postal_code`, `primary_time_zone`, `contact_linkedin_url`, `linkedin_summary`, `data_requester_details`

### 2.9 Duplicate Detection Job

```python
async def run_duplicate_detection():
    """
    Schedule: Configurable cron (default: weekly Sunday midnight).

    Company dedup key: (lower(company_name), lower(company_website)) within same segment_id
    Contact dedup key: (lower(email), company_id)

    Algorithm (clean-slate):
    1. Set ALL companies.is_duplicate = false
    2. Set ALL contacts.is_duplicate = false
    3. For companies: find groups by (lower(company_name), lower(company_website), segment_id)
       where count > 1. Mark all except earliest (by created_at) as is_duplicate = true.
    4. For contacts: find groups by (lower(email), company_id)
       where count > 1. Mark all except earliest as is_duplicate = true.
    5. Create audit_log entry with summary counts.
    """
```

**Why clean-slate:** Simple, correct, and cheap at expected volumes (< 10K records). If a record is edited to no longer be a duplicate, the next run correctly clears the flag.

### 2.10 Error Handling Strategy

**Consistent error response format:**

```json
{
  "detail": "Company not found",
  "error_code": "NOT_FOUND",
  "errors": []
}
```

For validation errors with per-field details:
```json
{
  "detail": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "message": "Invalid email format", "value": "not-an-email" },
    { "field": "company_name", "message": "This field is required", "value": null }
  ]
}
```

**Exception class hierarchy:**

```python
class AppException(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    detail: str = "An unexpected error occurred"

class NotFoundException(AppException):       # 404
class ValidationException(AppException):     # 422, includes errors list
class AuthenticationException(AppException): # 401
class AuthorizationException(AppException):  # 403
class ConflictException(AppException):       # 409 (duplicate key violations)
class BusinessRuleException(AppException):   # 422 (e.g., contact for non-approved company)
```

### 2.11 Pagination Strategy (Cursor-Based)

All list endpoints use cursor-based pagination for infinite scroll support.

**Cursor encoding:** Base64-encoded JSON of `{ts: ISO-timestamp, id: UUID}` for deterministic ordering.

```python
def encode_cursor(created_at: datetime, id: UUID) -> str:
    data = {"ts": created_at.isoformat(), "id": str(id)}
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()

def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    data = json.loads(base64.urlsafe_b64decode(cursor))
    return datetime.fromisoformat(data["ts"]), UUID(data["id"])
```

**SQL pattern:**
```sql
SELECT * FROM companies
WHERE (created_at, id) < (:cursor_ts, :cursor_id)  -- if cursor provided
  AND <additional filters>
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1  -- fetch one extra to determine has_more
```

**Response envelope:**
```json
{
  "data": [ ... ],
  "pagination": {
    "next_cursor": "base64-string-or-null",
    "has_more": true,
    "limit": 50
  }
}
```

---

## 3. Database Architecture

### 3.1 PostgreSQL Schema

All SQL below follows these conventions:
- UUIDs for primary keys on main entities (users, segments, offerings, companies, contacts, assignments, upload_batches, audit_logs, collateral, notifications)
- BIGINT GENERATED ALWAYS AS IDENTITY for junction/lookup tables (user_roles, segment_offerings, role_grants)
- TIMESTAMPTZ for all timestamps (timezone-aware)
- TEXT instead of VARCHAR (PostgreSQL treats them identically; TEXT is simpler)
- Indexes on all FK columns and common query patterns
- CHECK constraints for business rules

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'admin', 'segment_owner', 'researcher', 'approver', 'sdr', 'marketing'
);

CREATE TYPE company_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE contact_status AS ENUM ('uploaded', 'approved', 'assigned_to_sdr', 'meeting_scheduled');
CREATE TYPE segment_status AS ENUM ('active', 'archived');
CREATE TYPE offering_status AS ENUM ('active', 'inactive');
CREATE TYPE user_status AS ENUM ('active', 'deactivated');
CREATE TYPE upload_type AS ENUM ('company', 'contact');
CREATE TYPE batch_status AS ENUM ('processing', 'completed', 'failed');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    name            TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    status          user_status NOT NULL DEFAULT 'active',
    token_version   INTEGER NOT NULL DEFAULT 1,
    reset_token_hash    TEXT,
    reset_token_expires TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_email ON users (email);

-- ============================================================
-- USER_ROLES (junction -- BIGINT PK)
-- ============================================================

CREATE TABLE user_roles (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    user_role NOT NULL,

    CONSTRAINT uq_user_roles UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

-- ============================================================
-- SEGMENTS
-- ============================================================

CREATE TABLE segments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    status      segment_status NOT NULL DEFAULT 'active',
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_segments_name UNIQUE (name)
);

CREATE INDEX idx_segments_status ON segments (status);
CREATE INDEX idx_segments_created_by ON segments (created_by);

-- ============================================================
-- OFFERINGS
-- ============================================================

CREATE TABLE offerings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    status      offering_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_offerings_name UNIQUE (name)
);

CREATE INDEX idx_offerings_status ON offerings (status);

-- ============================================================
-- SEGMENT_OFFERINGS (junction -- composite PK, no identity)
-- ============================================================

CREATE TABLE segment_offerings (
    segment_id  UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

    PRIMARY KEY (segment_id, offering_id)
);

CREATE INDEX idx_segment_offerings_offering_id ON segment_offerings (offering_id);

-- ============================================================
-- UPLOAD_BATCHES
-- ============================================================

CREATE TABLE upload_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_type     upload_type NOT NULL,
    file_name       TEXT NOT NULL,
    file_size_bytes INTEGER,
    total_rows      INTEGER DEFAULT 0,
    valid_rows      INTEGER DEFAULT 0,
    invalid_rows    INTEGER DEFAULT 0,
    status          batch_status NOT NULL DEFAULT 'processing',
    error_report_url TEXT,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_upload_batches_uploaded_by ON upload_batches (uploaded_by);
CREATE INDEX idx_upload_batches_status ON upload_batches (status);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        TEXT NOT NULL,
    company_website     TEXT,
    company_phone       TEXT,
    company_description TEXT,
    company_linkedin_url TEXT,
    company_industry    TEXT,
    company_sub_industry TEXT,
    street              TEXT,
    city                TEXT,
    state_province      TEXT,
    country_region      TEXT,
    zip_postal_code     TEXT,
    founded_year        INTEGER,
    revenue_range       TEXT,
    employee_size_range TEXT,
    segment_id          UUID NOT NULL REFERENCES segments(id),
    status              company_status NOT NULL DEFAULT 'pending',
    rejection_reason    TEXT,
    is_duplicate        BOOLEAN NOT NULL DEFAULT false,
    batch_id            UUID REFERENCES upload_batches(id),
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Dedup constraint: same name+website within same segment
    CONSTRAINT uq_companies_dedup UNIQUE (company_name, company_website, segment_id),
    -- Rejection reason required when rejected
    CONSTRAINT ck_companies_rejection CHECK (
        (status != 'rejected') OR (rejection_reason IS NOT NULL AND rejection_reason != '')
    ),
    -- Founded year range
    CONSTRAINT ck_companies_founded_year CHECK (
        founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM now()))
    )
);

CREATE INDEX idx_companies_segment_id ON companies (segment_id);
CREATE INDEX idx_companies_status ON companies (status);
CREATE INDEX idx_companies_batch_id ON companies (batch_id);
CREATE INDEX idx_companies_created_by ON companies (created_by);
CREATE INDEX idx_companies_is_duplicate ON companies (is_duplicate) WHERE is_duplicate = true;
CREATE INDEX idx_companies_created_at_id ON companies (created_at DESC, id DESC);
-- For search
CREATE INDEX idx_companies_name_trgm ON companies USING gin (company_name gin_trgm_ops);
-- For dedup detection
CREATE INDEX idx_companies_dedup_lookup ON companies (lower(company_name), lower(company_website), segment_id);

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE TABLE contacts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    email                   TEXT NOT NULL,
    mobile_phone            TEXT,
    job_title               TEXT,
    direct_phone_number     TEXT,
    email_address_2         TEXT,
    email_active_status     TEXT,
    lead_source_global      TEXT,
    management_level        TEXT,
    street                  TEXT,
    city                    TEXT,
    state_province          TEXT,
    country_region          TEXT,
    zip_postal_code         TEXT,
    primary_time_zone       TEXT,
    contact_linkedin_url    TEXT,
    linkedin_summary        TEXT,
    data_requester_details  TEXT,
    company_id              UUID NOT NULL REFERENCES companies(id),
    segment_id              UUID NOT NULL REFERENCES segments(id),
    status                  contact_status NOT NULL DEFAULT 'uploaded',
    assigned_sdr_id         UUID REFERENCES users(id),
    is_duplicate            BOOLEAN NOT NULL DEFAULT false,
    batch_id                UUID REFERENCES upload_batches(id),
    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_contacts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_contacts_company_id ON contacts (company_id);
CREATE INDEX idx_contacts_segment_id ON contacts (segment_id);
CREATE INDEX idx_contacts_status ON contacts (status);
CREATE INDEX idx_contacts_assigned_sdr_id ON contacts (assigned_sdr_id);
CREATE INDEX idx_contacts_batch_id ON contacts (batch_id);
CREATE INDEX idx_contacts_created_by ON contacts (created_by);
CREATE INDEX idx_contacts_is_duplicate ON contacts (is_duplicate) WHERE is_duplicate = true;
CREATE INDEX idx_contacts_created_at_id ON contacts (created_at DESC, id DESC);
-- For dedup detection
CREATE INDEX idx_contacts_dedup_lookup ON contacts (lower(email), company_id);
-- For search
CREATE INDEX idx_contacts_name_trgm ON contacts USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================

CREATE TABLE assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    assigned_to UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_assignments_entity_type CHECK (entity_type IN ('segment', 'company', 'contact'))
);

CREATE INDEX idx_assignments_entity ON assignments (entity_type, entity_id);
CREATE INDEX idx_assignments_assigned_to ON assignments (assigned_to);
CREATE INDEX idx_assignments_assigned_by ON assignments (assigned_by);

-- ============================================================
-- AUDIT_LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES users(id),
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    details     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ============================================================
-- ROLE_GRANTS (configurable permissions -- BIGINT PK)
-- ============================================================

CREATE TABLE role_grants (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role    user_role NOT NULL,
    action  TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_role_grants UNIQUE (role, action)
);

CREATE INDEX idx_role_grants_role ON role_grants (role);

-- ============================================================
-- MARKETING_COLLATERAL
-- ============================================================

CREATE TABLE marketing_collateral (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    description TEXT,
    scope_type  TEXT NOT NULL,
    scope_id    UUID NOT NULL,
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_collateral_scope_type CHECK (scope_type IN ('segment', 'offering', 'company'))
);

CREATE INDEX idx_collateral_scope ON marketing_collateral (scope_type, scope_id);
CREATE INDEX idx_collateral_created_by ON marketing_collateral (created_by);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'system',
    entity_type TEXT,
    entity_id   UUID,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_notification_category CHECK (category IN ('approval', 'assignment', 'upload', 'system', 'duplicate'))
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- ============================================================
-- EXTENSION for trigram search (must be created by superuser)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3.2 Index Strategy

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_companies_segment_id` | companies | Filter by segment (most common filter) |
| `idx_companies_status` | companies | Filter by status (approval queue) |
| `idx_companies_created_at_id` | companies | Cursor-based pagination ordering |
| `idx_companies_name_trgm` | companies | Trigram index for fuzzy search on company name |
| `idx_companies_dedup_lookup` | companies | Fast duplicate detection queries |
| `idx_companies_is_duplicate` | companies | Partial index -- only rows where is_duplicate=true |
| `idx_contacts_company_id` | contacts | Join contacts to company |
| `idx_contacts_segment_id` | contacts | Filter by segment |
| `idx_contacts_status` | contacts | Filter by pipeline status |
| `idx_contacts_created_at_id` | contacts | Cursor pagination |
| `idx_contacts_dedup_lookup` | contacts | Fast duplicate detection |
| `idx_audit_logs_entity` | audit_logs | Activity timeline queries |
| `idx_audit_logs_created_at` | audit_logs | Chronological ordering |
| `idx_notifications_user_unread` | notifications | Unread count badge (partial index) |

**Why trigram indexes for search:** At the expected volumes (< 10K records), `pg_trgm` with `gin` indexes provides excellent fuzzy search performance without external search infrastructure. The `LIKE '%term%'` queries become index-backed.

### 3.3 Alembic Migration Strategy

```
alembic/
├── env.py          # Configured to use async engine, imports all models
├── versions/
│   └── 001_initial_schema.py   # Full schema creation
└── script.py.mako
```

**Migration workflow:**
1. Models are the source of truth. Schema changes start as model changes.
2. `alembic revision --autogenerate -m "description"` to generate migration.
3. Review generated migration, adjust if needed (Alembic autogenerate does not handle everything -- enums, partial indexes, extensions need manual additions).
4. `alembic upgrade head` runs on container startup.
5. Migrations are committed to git and never modified after being applied.

**First migration (`001_initial_schema.py`):**
- Creates all enums
- Creates `pg_trgm` extension
- Creates all tables with indexes and constraints
- Runs seed data (default admin user + role grants)

### 3.4 Seed Data

On first startup (when users table is empty), the seed script creates:

**Default admin user:**
```python
{
    "email": settings.DEFAULT_ADMIN_EMAIL,  # admin@spanner.app
    "name": "System Administrator",
    "password_hash": bcrypt_hash(settings.DEFAULT_ADMIN_PASSWORD),
    "status": "active",
    "roles": ["admin"]
}
```

**Default role grants:** All rows from the table in section 2.7.

---

## 4. Frontend Architecture

### 4.1 Project Structure

```
frontend/
├── Dockerfile
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── postcss.config.js
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                     # React root, providers, router mount
    ├── App.tsx                      # Router outlet wrapper
    ├── index.css                    # Tailwind directives, CSS variables, scrollbar styles
    ├── vite-env.d.ts
    │
    ├── api/
    │   ├── client.ts                # Axios instance with interceptors (JWT attach, refresh, error handling)
    │   ├── endpoints.ts             # API endpoint URL constants
    │   └── types.ts                 # Shared API response types (PaginatedResponse<T>, ErrorResponse)
    │
    ├── auth/
    │   ├── AuthProvider.tsx         # Context: user, tokens, login/logout, isAuthenticated
    │   ├── ProtectedRoute.tsx       # Redirects to /login if not authenticated
    │   ├── useAuth.ts               # Hook to consume AuthContext
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── ForgotPasswordPage.tsx
    │       └── ResetPasswordPage.tsx
    │
    ├── stores/
    │   ├── sidebarStore.ts          # Zustand: sidebar theme (light/dark), collapsed state
    │   ├── commandSearchStore.ts    # Zustand: open/close command palette, query
    │   └── notificationStore.ts     # Zustand: notification panel open, unread count
    │
    ├── hooks/
    │   ├── useInfiniteScroll.ts     # IntersectionObserver hook for cursor pagination
    │   ├── useDebounce.ts           # Debounce hook for search inputs
    │   ├── useCursorPagination.ts   # TanStack useInfiniteQuery wrapper with cursor
    │   └── useFilters.ts            # URL search params sync for filter state
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx         # Sidebar + header + main content area
    │   │   ├── Sidebar.tsx          # Navigation with light/dark theme toggle
    │   │   ├── SidebarLink.tsx      # Individual nav item with active state + badge
    │   │   ├── Header.tsx           # Page title, notifications bell, user menu
    │   │   └── UserMenu.tsx         # Avatar, role badge, dropdown (profile, logout)
    │   │
    │   ├── data/
    │   │   ├── DataTable.tsx        # Reusable table with sortable headers, checkbox column
    │   │   ├── DataTableRow.tsx     # Row with hover actions, click to open detail
    │   │   ├── FilterBar.tsx        # Search input + segment/status/researcher filters + duplicate toggle
    │   │   ├── InfiniteScrollTrigger.tsx  # Invisible div observed by IntersectionObserver
    │   │   └── EmptyState.tsx       # Shown when no data matches filters
    │   │
    │   ├── detail/
    │   │   ├── SidePanel.tsx        # Jira-style slide-out panel (right 42% width)
    │   │   ├── SidePanelHeader.tsx  # Entity ID badge, status, action buttons, close
    │   │   ├── SidePanelSection.tsx # Collapsible section with label-value grid
    │   │   ├── SummaryPopup.tsx     # Quick overlay on row hover/click (before full panel)
    │   │   └── ActivityTimeline.tsx # Vertical timeline of audit_log entries
    │   │
    │   ├── forms/
    │   │   ├── FormField.tsx        # Label + input + error message wrapper
    │   │   ├── SelectField.tsx      # Dropdown with label
    │   │   ├── TextAreaField.tsx    # Multi-line input
    │   │   ├── TagInput.tsx         # For offerings autocomplete/multi-select
    │   │   └── FileUpload.tsx       # Drag-and-drop CSV upload zone
    │   │
    │   ├── feedback/
    │   │   ├── StatusBadge.tsx      # Colored pill: pending/approved/rejected/uploaded/etc.
    │   │   ├── Avatar.tsx           # Initials circle with color based on name
    │   │   ├── Toast.tsx            # Notification toast (success/error/info)
    │   │   ├── ConfirmDialog.tsx    # "Are you sure?" modal
    │   │   ├── LoadingSpinner.tsx   # Spinner for loading states
    │   │   └── MetricCard.tsx       # Dashboard KPI card with icon, value, trend
    │   │
    │   └── overlays/
    │       ├── CommandSearch.tsx     # Cmd+K search overlay
    │       ├── NotificationPanel.tsx # Slide-out notification list
    │       └── Modal.tsx            # Generic modal wrapper
    │
    ├── modules/
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx    # KPI cards + pipeline chart + recent activity
    │   │   ├── PipelineChart.tsx    # Bar chart (CSS-only, no chart library)
    │   │   └── RecentActivity.tsx   # Activity feed from audit_logs
    │   │
    │   ├── users/
    │   │   ├── UserManagementPage.tsx  # User list with DataTable
    │   │   ├── CreateUserModal.tsx     # Modal form (admin only)
    │   │   └── UserDetailPanel.tsx     # Side panel with roles, status toggle
    │   │
    │   ├── segments/
    │   │   ├── SegmentsPage.tsx     # Card grid of segments
    │   │   ├── SegmentCard.tsx      # Segment card with offerings tags, stats
    │   │   ├── CreateSegmentForm.tsx # Full-page form with offerings autocomplete
    │   │   └── SegmentDetailPanel.tsx
    │   │
    │   ├── companies/
    │   │   ├── CompanyListPage.tsx   # DataTable + FilterBar + infinite scroll
    │   │   ├── CompanyDetailPanel.tsx # Side panel: details, contacts, timeline
    │   │   ├── CompanySummaryPopup.tsx # Quick view popup
    │   │   ├── AddCompanyForm.tsx    # Full-page form
    │   │   ├── CompanyUploadPage.tsx # CSV upload + mapping + validation view
    │   │   └── CompanyApproveReject.tsx # Action components in panel
    │   │
    │   ├── contacts/
    │   │   ├── ContactListPage.tsx
    │   │   ├── ContactDetailPanel.tsx
    │   │   ├── ContactSummaryPopup.tsx
    │   │   ├── AddContactForm.tsx
    │   │   ├── ContactUploadPage.tsx
    │   │   └── BulkApproveBar.tsx   # Floating bar when contacts are selected
    │   │
    │   ├── approvals/
    │   │   ├── ApprovalQueuePage.tsx # Tabs: Pending Companies | Uploaded Contacts
    │   │   ├── CompanyApprovalTab.tsx
    │   │   ├── ContactApprovalTab.tsx
    │   │   └── RejectReasonModal.tsx # Modal prompting for rejection reason
    │   │
    │   ├── workbench/
    │   │   ├── WorkbenchPage.tsx     # My Segments cards + My Uploads table
    │   │   ├── MySegmentsGrid.tsx
    │   │   └── MyUploadsTable.tsx
    │   │
    │   ├── collateral/
    │   │   ├── CollateralPage.tsx
    │   │   └── AddCollateralModal.tsx
    │   │
    │   ├── uploads/
    │   │   ├── BatchListPage.tsx     # Upload history
    │   │   ├── BatchDetailPage.tsx   # Batch summary + error report
    │   │   └── ErrorCorrectionView.tsx # View error rows, download CSV, reupload
    │   │
    │   └── settings/
    │       ├── ProfilePage.tsx       # User profile + preferences + password change
    │       └── NotificationPrefs.tsx # Toggle notification types
    │
    └── utils/
        ├── cn.ts                    # Tailwind classname merge utility (clsx + twMerge)
        ├── formatters.ts            # Date formatters, initials from name, truncate
        ├── validators.ts            # Client-side validation helpers (email, URL, etc.)
        └── constants.ts             # Status options, role labels, sidebar nav config
```

### 4.2 Routing Scheme (React Router v7)

```tsx
// src/App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />

  {/* Protected routes -- wrapped in AppShell */}
  <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<DashboardPage />} />

    {/* User Management (admin only -- enforced by RBAC on API) */}
    <Route path="/users" element={<UserManagementPage />} />

    {/* Segments */}
    <Route path="/segments" element={<SegmentsPage />} />
    <Route path="/segments/new" element={<CreateSegmentForm />} />
    <Route path="/segments/:id/edit" element={<CreateSegmentForm />} />

    {/* Companies */}
    <Route path="/companies" element={<CompanyListPage />} />
    <Route path="/companies/new" element={<AddCompanyForm />} />
    <Route path="/companies/upload" element={<CompanyUploadPage />} />

    {/* Contacts */}
    <Route path="/contacts" element={<ContactListPage />} />
    <Route path="/contacts/new" element={<AddContactForm />} />
    <Route path="/contacts/upload" element={<ContactUploadPage />} />

    {/* Approval Queue */}
    <Route path="/approvals" element={<ApprovalQueuePage />} />

    {/* Researcher Workbench */}
    <Route path="/workbench" element={<WorkbenchPage />} />

    {/* Uploads/Batches */}
    <Route path="/uploads" element={<BatchListPage />} />
    <Route path="/uploads/:id" element={<BatchDetailPage />} />

    {/* Marketing Collateral */}
    <Route path="/collateral" element={<CollateralPage />} />

    {/* Settings */}
    <Route path="/settings/profile" element={<ProfilePage />} />
  </Route>

  {/* Catch-all */}
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

**Note:** Detail panels (SidePanel) are NOT separate routes. They are overlay components triggered by clicking a row on any list page. The URL does NOT change when a side panel opens. This matches the Jira-style UX from the mockups.

### 4.3 API Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );
        localStorage.setItem('access_token', data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed -- force logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4.4 State Management

**TanStack Query (server state):**
Every API call uses TanStack Query. Query keys follow a consistent pattern:

```typescript
// Query key conventions
['companies', 'list', { segment_id, status, search, cursor }]
['companies', 'detail', companyId]
['contacts', 'list', { company_id, status, cursor }]
['segments', 'list']
['approval-queue', 'companies', filters]
['approval-queue', 'contacts', filters]
['dashboard', 'kpis']
['notifications', 'list']
['notifications', 'unread-count']
```

**Infinite scroll with TanStack:**
```typescript
// src/hooks/useCursorPagination.ts
export function useCursorPagination<T>(
  queryKey: unknown[],
  fetchFn: (cursor: string | null) => Promise<PaginatedResponse<T>>
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam ?? null),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_more ? lastPage.pagination.next_cursor : undefined,
    initialPageParam: null as string | null,
  });
}
```

**Zustand (client state):**

Three small stores for purely client-side concerns:

```typescript
// stores/sidebarStore.ts
interface SidebarState {
  theme: 'light' | 'dark';
  isCollapsed: boolean;
  toggleTheme: () => void;
  toggleCollapse: () => void;
}

// stores/commandSearchStore.ts
interface CommandSearchState {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
}

// stores/notificationStore.ts
interface NotificationState {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}
```

### 4.5 Shared Component Inventory

Based on the HTML mockups, these shared components are required:

| Component | Source Mockup(s) | Description |
|-----------|-----------------|-------------|
| `AppShell` | 15-app-shell | Sidebar + header + main outlet. Two variants: light sidebar (white bg, blue-50 active) and dark sidebar (slate-900 bg, indigo active). |
| `Sidebar` | 15, 13, 16, 19, 20 | Grouped nav links (Main, Workspace, Operations). Badge counts on Approval Queue. Theme toggle switch at bottom. |
| `Header` | All authenticated pages | Page title, notification bell with red dot, user avatar + role badge + dropdown. |
| `DataTable` | 16-company-list, 17-contact-directory | Checkbox column, sortable headers, row hover reveal actions, configurable columns. |
| `FilterBar` | 16, 17, 19 | Search input + dropdown selects (segment, status, researcher, date range) + "Show Duplicates" toggle. |
| `SidePanel` | 13-company-detail | Right-aligned slide-out (42% width), backdrop blur, header with status + actions, scrollable content, footer with timestamps. |
| `SummaryPopup` | Implied by usecase.md | Quick overlay on row click -- subset of fields. Clicking "View Full" opens SidePanel. |
| `ActivityTimeline` | 13-company-detail | Vertical line with colored dots, event title, actor, timestamp, description. |
| `StatusBadge` | 13, 16, 19, 20 | Pill-shaped: amber for pending, green for approved, red for rejected, blue for uploaded. Uses `ring-1 ring-inset`. |
| `Avatar` | 13, 16, 20 | Circle with initials derived from name. Consistent color based on name hash. |
| `MetricCard` | 15-app-shell | Border-left colored accent, icon, big number, trend indicator, link. |
| `FileUpload` | 18-csv-upload | Drag-and-drop zone, file type/size validation, progress indicator. |
| `CommandSearch` | 11-global-command-search | Cmd+K overlay. Search across companies, contacts, segments. Grouped results. Keyboard navigation. |
| `NotificationPanel` | 10-notification-center | Right slide-out panel. Grouped by date. Filter pills. Mark all read. |
| `Modal` | 08-create-user | Backdrop + centered card. Used for user creation, reject reason, confirm dialogs. |
| `Toast` | N/A | Bottom-right toasts for success/error feedback. Auto-dismiss. |

### 4.6 Dual Sidebar Theme Implementation

The mockups show two sidebar styles:
- **Light sidebar** (15-app-shell, 14-segments, 19-approval-queue): White background, `border-r border-slate-200`, links use `text-slate-600`, active is `bg-blue-50 text-blue-700`.
- **Dark sidebar** (13-company-detail, 16-company-list, 18-csv-upload, 20-workbench): `bg-slate-900`, links use `text-slate-300/text-gray-300`, active is `bg-slate-800 text-white` or `bg-indigo-600/10 text-indigo-400`.

**Implementation approach:**

```typescript
// Sidebar.tsx reads from Zustand store
const { theme } = useSidebarStore();

const themeClasses = {
  light: {
    aside: 'bg-white border-r border-slate-200',
    logo: 'text-slate-900',
    section: 'text-slate-400',
    link: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    active: 'bg-blue-50 text-blue-700',
    footer: 'border-t border-slate-100',
    user: 'text-slate-900',
    userSub: 'text-slate-500',
  },
  dark: {
    aside: 'bg-slate-900 border-r border-slate-800',
    logo: 'text-white',
    section: 'text-slate-500',
    link: 'text-slate-300 hover:bg-slate-800 hover:text-white',
    active: 'bg-slate-800 text-white',
    footer: 'border-t border-slate-800',
    user: 'text-white',
    userSub: 'text-slate-500',
  },
};
```

The theme preference is persisted to `localStorage` by Zustand's `persist` middleware.

### 4.7 Auth Flow

```
1. User navigates to any protected route
2. ProtectedRoute checks AuthProvider: is access_token in localStorage?
   - No -> redirect to /login
   - Yes -> decode token, check expiry
     - Expired -> attempt silent refresh via /api/v1/auth/refresh
       - Success -> update token, continue
       - Failure -> clear tokens, redirect to /login
     - Valid -> render protected content

3. On login success:
   - Store access_token and refresh_token in localStorage
   - Store decoded user info (id, email, name, roles) in AuthContext
   - Redirect to /dashboard (or original URL if stored)

4. On logout:
   - Clear localStorage tokens
   - Reset AuthContext
   - Reset all TanStack Query cache
   - Redirect to /login
```

### 4.8 Form Handling Strategy

Forms use React Hook Form with Zod validation:

```typescript
// Example: AddCompanyForm.tsx
const schema = z.object({
  company_name: z.string().min(1, "Required").max(500),
  company_website: z.string().url("Invalid URL").optional().or(z.literal("")),
  segment_id: z.string().uuid("Select a segment"),
  company_industry: z.string().max(200).optional(),
  // ... remaining fields
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

// On submit: call mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/companies', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success('Company created');
    navigate('/companies');
  },
  onError: (error) => {
    // Map server validation errors to form fields
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(e =>
        form.setError(e.field, { message: e.message })
      );
    }
  },
});
```

### 4.9 Notification Approach

Notifications are **poll-based** (not real-time WebSocket). This is appropriate for a single-tenant internal tool with low urgency.

- **Unread count polling:** TanStack Query with `refetchInterval: 30000` (30 seconds) on `GET /api/v1/notifications/unread-count`.
- **Notification list:** Fetched when the notification panel opens.
- **Server creates notifications** in the notification_service when events occur (company approved, segment assigned, CSV import complete, duplicates detected).
- **Toast notifications** are client-side only for immediate feedback on user actions (e.g., "Company approved successfully").

---

## 5. API Contract

### 5.1 Base URL and Conventions

```
Base URL: /api/v1
Content-Type: application/json (except file uploads: multipart/form-data)
Authentication: Bearer token in Authorization header
Pagination: Cursor-based (?cursor=<base64>&limit=50)
```

### 5.2 Authentication Endpoints

```
POST /api/v1/auth/login
  Request:  { "email": "string", "password": "string" }
  Response: {
    "access_token": "jwt-string",
    "refresh_token": "jwt-string",
    "token_type": "bearer",
    "expires_in": 1800
  }
  Errors: 401 AUTHENTICATION_FAILED

POST /api/v1/auth/refresh
  Request:  { "refresh_token": "jwt-string" }
  Response: { "access_token": "jwt-string", "token_type": "bearer", "expires_in": 1800 }
  Errors: 401 AUTHENTICATION_FAILED

POST /api/v1/auth/forgot-password
  Request:  { "email": "string" }
  Response: { "detail": "If the email exists, a reset link has been sent." }
  Note: Always returns 200 (no email enumeration)

POST /api/v1/auth/reset-password
  Request:  { "token": "string", "new_password": "string" }
  Response: { "detail": "Password has been reset." }
  Errors: 400 INVALID_RESET_TOKEN
```

### 5.3 User Endpoints (Admin Only)

```
GET /api/v1/users?search=&role=&status=&cursor=&limit=
  Response: PaginatedResponse<UserResponse>

POST /api/v1/users
  Request:  { "email": "string", "name": "string", "password": "string", "roles": ["admin", "researcher"] }
  Response: UserResponse (201)
  Errors: 409 CONFLICT (email exists), 403 FORBIDDEN

GET /api/v1/users/{id}
  Response: UserResponse (includes roles)

PATCH /api/v1/users/{id}
  Request:  { "name"?: "string", "roles"?: ["role1", "role2"] }
  Response: UserResponse

PATCH /api/v1/users/{id}/deactivate
  Response: UserResponse (status = deactivated)

GET /api/v1/users/me
  Response: UserResponse (current authenticated user)
```

**UserResponse schema:**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "status": "active|deactivated",
  "roles": ["admin", "researcher"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 5.4 Segment Endpoints

```
GET /api/v1/segments?status=active&search=&cursor=&limit=
  Response: PaginatedResponse<SegmentResponse>

POST /api/v1/segments
  Request:  { "name": "string", "description"?: "string", "offering_ids": ["uuid", ...] }
  Response: SegmentResponse (201)

GET /api/v1/segments/{id}
  Response: SegmentResponse (includes offerings, company count, contact count)

PATCH /api/v1/segments/{id}
  Request:  { "name"?: "string", "description"?: "string", "offering_ids"?: ["uuid"] }
  Response: SegmentResponse

PATCH /api/v1/segments/{id}/archive
  Response: SegmentResponse (status = archived)
```

### 5.5 Offering Endpoints

```
GET /api/v1/offerings?search=&status=active&limit=50
  Response: { "data": [OfferingResponse, ...] }
  Note: Used for autocomplete. No cursor pagination needed.

POST /api/v1/offerings
  Request:  { "name": "string", "description"?: "string" }
  Response: OfferingResponse (201)
```

### 5.6 Company Endpoints

```
GET /api/v1/companies?segment_id=&status=&search=&show_duplicates=false&created_by=&cursor=&limit=
  Response: PaginatedResponse<CompanyListItem>

POST /api/v1/companies
  Request:  {
    "company_name": "string",
    "company_website"?: "string",
    "segment_id": "uuid",
    "company_industry"?: "string",
    ... (all optional fields)
  }
  Response: CompanyResponse (201)

GET /api/v1/companies/{id}
  Response: CompanyDetailResponse (includes contacts list, activity timeline)

PATCH /api/v1/companies/{id}
  Request:  { ... partial fields }
  Response: CompanyResponse

POST /api/v1/companies/{id}/approve
  Response: CompanyResponse (status = approved)
  Errors: 422 BUSINESS_RULE_VIOLATION (not pending)

POST /api/v1/companies/{id}/reject
  Request:  { "rejection_reason": "string" }
  Response: CompanyResponse (status = rejected)
  Errors: 422 BUSINESS_RULE_VIOLATION (not pending), 422 VALIDATION_ERROR (missing reason)

POST /api/v1/companies/upload
  Content-Type: multipart/form-data
  Fields: file (CSV), segment_id (UUID)
  Response: { "batch_id": "uuid", "status": "processing" } (202)

GET /api/v1/companies/export?segment_id=&status=&search=
  Response: CSV file download (Content-Type: text/csv)
```

**CompanyListItem schema:**
```json
{
  "id": "uuid",
  "company_name": "string",
  "company_website": "string|null",
  "segment": { "id": "uuid", "name": "string" },
  "status": "pending|approved|rejected",
  "company_industry": "string|null",
  "is_duplicate": false,
  "created_by": { "id": "uuid", "name": "string" },
  "created_at": "2024-01-01T00:00:00Z"
}
```

**CompanyDetailResponse schema:**
```json
{
  "id": "uuid",
  "company_name": "string",
  "company_website": "string|null",
  "company_phone": "string|null",
  "company_description": "string|null",
  "company_linkedin_url": "string|null",
  "company_industry": "string|null",
  "company_sub_industry": "string|null",
  "street": "string|null",
  "city": "string|null",
  "state_province": "string|null",
  "country_region": "string|null",
  "zip_postal_code": "string|null",
  "founded_year": "number|null",
  "revenue_range": "string|null",
  "employee_size_range": "string|null",
  "segment": { "id": "uuid", "name": "string" },
  "status": "pending|approved|rejected",
  "rejection_reason": "string|null",
  "is_duplicate": false,
  "batch_id": "uuid|null",
  "created_by": { "id": "uuid", "name": "string" },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "contacts": [ContactListItem, ...],
  "activity": [AuditLogEntry, ...]
}
```

### 5.7 Contact Endpoints

```
GET /api/v1/contacts?company_id=&segment_id=&status=&search=&assigned_sdr_id=&show_duplicates=false&cursor=&limit=
  Response: PaginatedResponse<ContactListItem>

POST /api/v1/contacts
  Request:  { "first_name": "string", "last_name": "string", "email": "string", "company_id": "uuid", ... }
  Response: ContactResponse (201)
  Errors: 422 BUSINESS_RULE_VIOLATION (company not approved)

GET /api/v1/contacts/{id}
  Response: ContactDetailResponse

PATCH /api/v1/contacts/{id}
  Request:  { ... partial fields }
  Response: ContactResponse

POST /api/v1/contacts/approve
  Request:  { "contact_ids": ["uuid", "uuid", ...] }
  Response: { "approved_count": 5 }

POST /api/v1/contacts/{id}/assign-sdr
  Request:  { "sdr_id": "uuid" }
  Response: ContactResponse (status = assigned_to_sdr)

POST /api/v1/contacts/{id}/schedule-meeting
  Response: ContactResponse (status = meeting_scheduled)

POST /api/v1/contacts/upload
  Content-Type: multipart/form-data
  Fields: file (CSV)
  Response: { "batch_id": "uuid", "status": "processing" } (202)

GET /api/v1/contacts/export?company_id=&segment_id=&status=
  Response: CSV file download
```

### 5.8 Assignment Endpoints

```
POST /api/v1/assignments
  Request:  { "entity_type": "segment|company|contact", "entity_id": "uuid", "assigned_to": "uuid" }
  Response: AssignmentResponse (201)

GET /api/v1/assignments/my
  Response: { "segments": [...], "companies": [...], "contacts": [...] }
```

### 5.9 Approval Queue Endpoints

```
GET /api/v1/approval-queue/companies?segment_id=&created_by=&cursor=&limit=
  Response: PaginatedResponse<CompanyListItem> (filtered to status=pending)

GET /api/v1/approval-queue/contacts?segment_id=&created_by=&cursor=&limit=
  Response: PaginatedResponse<ContactListItem> (filtered to status=uploaded)
```

### 5.10 Batch / Upload Endpoints

```
GET /api/v1/batches?cursor=&limit=
  Response: PaginatedResponse<BatchResponse>

GET /api/v1/batches/{id}
  Response: BatchDetailResponse

GET /api/v1/batches/{id}/errors
  Response: CSV file download (error report)

POST /api/v1/batches/{id}/reupload
  Content-Type: multipart/form-data
  Fields: file (corrected CSV)
  Response: { "batch_id": "uuid", "status": "processing" } (202)
```

### 5.11 Workbench Endpoints

```
GET /api/v1/workbench/segments
  Response: [SegmentWithStats, ...] (segments assigned to current user)

GET /api/v1/workbench/companies?segment_id=
  Response: PaginatedResponse<CompanyListItem> (approved companies in user's segments)

GET /api/v1/workbench/uploads?status=&cursor=&limit=
  Response: PaginatedResponse<BatchResponse> (current user's uploads)
```

### 5.12 Other Endpoints

```
# Marketing Collateral
GET    /api/v1/collateral?scope_type=&scope_id=
POST   /api/v1/collateral  { "title": "string", "url": "string", "scope_type": "string", "scope_id": "uuid" }
PATCH  /api/v1/collateral/{id}
DELETE /api/v1/collateral/{id}

# Audit / Activity Timeline
GET /api/v1/audit/{entity_type}/{entity_id}?cursor=&limit=
  Response: PaginatedResponse<AuditLogEntry>

# Dashboard
GET /api/v1/dashboard/kpis
  Response: {
    "pending_companies": 24,
    "approved_contacts": 1284,
    "active_segments": 8,
    "archived_segments": 3,
    "pipeline_velocity": { "research": 40, "approval": 65, "handoff": 55, "meetings": 80, "closed": 30 },
    "recent_activity": [AuditLogEntry, ...]
  }

# Notifications
GET    /api/v1/notifications?category=&is_read=&cursor=&limit=
GET    /api/v1/notifications/unread-count -> { "count": 4 }
PATCH  /api/v1/notifications/{id}/read
POST   /api/v1/notifications/mark-all-read

# Global Search
GET /api/v1/search?q=acme&limit=10
  Response: {
    "companies": [{ "id": "uuid", "company_name": "Acme Corp", "segment_name": "..." }],
    "contacts": [{ "id": "uuid", "name": "Alice Johnson", "company_name": "Acme Corp" }],
    "segments": [{ "id": "uuid", "name": "..." }]
  }

# Health Check
GET /api/v1/health
  Response: { "status": "healthy", "database": "connected", "version": "1.0.0" }
```

### 5.13 Error Response Format (All Endpoints)

```
HTTP 400 Bad Request        -- Malformed request, file validation failure
HTTP 401 Unauthorized       -- Missing/invalid/expired token
HTTP 403 Forbidden          -- Authenticated but insufficient permissions
HTTP 404 Not Found          -- Entity does not exist
HTTP 409 Conflict           -- Duplicate key violation
HTTP 422 Unprocessable      -- Validation error or business rule violation
HTTP 500 Internal Server    -- Unexpected server error

Body format (always):
{
  "detail": "Human-readable description",
  "error_code": "MACHINE_READABLE_CODE",
  "errors": [
    { "field": "field_name", "message": "Error description", "value": "submitted_value" }
  ]
}
```

---

## 6. Implementation Plan

### 6.1 Work Streams Overview

The implementation is organized into 4 parallel work streams plus a critical path.

```
TIMELINE (approximate):

Week 1:  [--- Stream A: Infrastructure & DB ---]  [--- Stream B: Auth & RBAC ---]
Week 2:  [--- Stream C: Core Backend APIs ----]   [--- Stream D: FE Foundation --]
Week 3:  [--- Stream C cont'd: CSV pipeline --]   [--- Stream D: FE Modules -----]
Week 4:  [--- Stream C: Approval/Assignment --]    [--- Stream D: FE Modules -----]
Week 5:  [--- Integration, Polish, Future Features ---]
```

### 6.2 Stream A -- Infrastructure & Database (Week 1)

**Dependencies:** None. This is the foundation.
**Parallelizable with:** Nothing initially; Streams B-D depend on this completing.

| # | Task | Type | Size | Acceptance Criteria |
|---|------|------|------|---------------------|
| A1 | Docker Compose setup | Infra | M | `docker compose up` starts db, backend, frontend. Backend connects to db. Frontend serves on 5173. |
| A2 | Backend Dockerfile + requirements.txt | BE | S | Python 3.12, FastAPI, uvicorn, SQLAlchemy, Alembic, passlib, python-jose, APScheduler installed. Hot reload works. |
| A3 | Frontend Dockerfile + Vite scaffold | FE | S | React + TypeScript + Tailwind CSS + React Router v7 + TanStack Query + Zustand installed. Vite proxy to backend configured. |
| A4 | FastAPI app factory + config + database module | BE | M | `app/main.py` creates FastAPI app with lifespan. `app/config.py` reads env vars via Pydantic BaseSettings. `app/database.py` creates async engine + session factory. Health endpoint returns 200. |
| A5 | SQLAlchemy models (all entities) | BE | L | All models defined per schema in section 3.1. Relationships, enums, mixins (UUIDPKMixin, TimestampMixin). |
| A6 | Alembic initial migration | BE | M | `alembic upgrade head` creates all tables, enums, indexes, constraints, pg_trgm extension. Matches section 3.1 exactly. |
| A7 | Seed script | BE | S | Creates default admin user + all default role_grants when users table is empty. Runs on startup. |
| A8 | `.env.example` + `.gitignore` | Infra | S | Template env file committed. `.env`, `__pycache__`, `node_modules`, `uploads/` git-ignored. |

**Milestone A: "docker compose up" gives a working stack with empty database, health endpoint, and frontend showing Vite default page.**

### 6.3 Stream B -- Authentication & RBAC (Week 1-2)

**Dependencies:** Stream A (A4, A5, A6, A7 must be complete).
**Parallelizable with:** Stream D (FE foundation) once A completes.

| # | Task | Type | Size | Acceptance Criteria |
|---|------|------|------|---------------------|
| B1 | Security utilities (bcrypt, JWT) | BE | M | `hash_password()`, `verify_password()`, `create_access_token()`, `create_refresh_token()`, `decode_access_token()`, `decode_refresh_token()` all working with tests. |
| B2 | Auth router + service | BE | M | POST /login returns tokens. POST /refresh returns new access token. POST /forgot-password logs URL. POST /reset-password updates password. Tests cover happy path + error cases. |
| B3 | Auth dependencies (get_current_user) | BE | S | `get_current_user` dependency extracts JWT, loads user, rejects deactivated. Returns 401 on invalid/expired token. |
| B4 | RBAC dependencies (require_role, require_grant) | BE | M | `require_role()` checks user_roles. `require_grant()` queries role_grants. Both return 403 on failure. Tests with different role combinations. |
| B5 | User router + service | BE | M | Full CRUD: list (with search, filter by role/status), create (admin only, assigns roles), get, update, deactivate. Audit log on all mutations. |
| B6 | Error handling middleware | BE | M | Global exception handlers registered. All custom exceptions return consistent JSON format. RequestValidationError mapped to field-level errors. Request ID middleware works. |
| B7 | Base repository + user repository | BE | M | BaseRepository with generic CRUD + cursor pagination. UserRepository extends with email lookup, role eager loading. |

**Milestone B: Can log in as admin, create users with roles, refresh tokens, and see RBAC enforcement on protected endpoints.**

### 6.4 Stream C -- Core Backend APIs (Week 2-4)

**Dependencies:** Stream B must be complete.
**Parallelizable with:** Stream D (FE can work against API contracts using mock data until endpoints are ready).

| # | Task | Type | Size | Acceptance Criteria |
|---|------|------|------|---------------------|
| C1 | Offering router + service + repo | BE | S | List (for autocomplete) and create offerings. |
| C2 | Segment router + service + repo | BE | M | Full CRUD with offerings M2M management. Archive. Includes company/contact counts in response. |
| C3 | Company router + service + repo | BE | L | Full CRUD. List with cursor pagination, all filters (segment, status, search, duplicate toggle, created_by). Detail endpoint includes contacts + audit timeline. Status transitions (approve, reject with reason). Data normalization on create/update. |
| C4 | Contact router + service + repo | BE | L | Full CRUD. List with all filters. Bulk approve. Assign SDR. Schedule meeting. Status pipeline enforcement. Segment auto-derived from company. Validation: company must be approved. |
| C5 | CSV service (parsing + validation) | BE | XL | File validation, header matching (case-insensitive), row-by-row validation with all checks (format, range, length, lookups). Returns structured errors per row. |
| C6 | CSV upload endpoints (company + contact) | BE | L | Company and contact upload endpoints. Synchronous file+header validation, async row processing via BackgroundTask. Batch creation and status tracking. Error report CSV generation. |
| C7 | Batch router + service | BE | M | List user's batches. Batch detail with stats. Error report download. Re-upload corrected CSV. |
| C8 | Assignment router + service | BE | M | Create assignments (polymorphic: segment/company/contact). My assignments endpoint. Grant-based authorization. |
| C9 | Approval queue router | BE | S | Pending companies list + uploaded contacts list. Reuses company/contact repos with status filters. |
| C10 | Workbench router | BE | M | My segments (via assignments), approved companies in my segments, my uploads. |
| C11 | Audit service + router | BE | M | `create_audit_log()` called from all services on mutations. Activity timeline endpoint per entity. |
| C12 | Marketing collateral router + service | BE | S | CRUD collateral links with scope (segment/offering/company). |
| C13 | Duplicate detection job | BE | M | APScheduler setup. Dedup logic per section 2.9. Runs on cron. Creates audit log summary. |
| C14 | CSV export endpoints | BE | M | Company and contact list export as CSV. Respects same filters as list endpoints. Streams response. |
| C15 | Dashboard KPIs endpoint | BE | M | Aggregation queries for pending companies, approved contacts, active segments, pipeline velocity, recent activity. |
| C16 | Notification service + router | BE | M | Create notifications on key events. List with cursor pagination. Unread count. Mark read. Mark all read. |
| C17 | Global search endpoint | BE | M | Search across companies (name), contacts (name, email), segments (name). Uses trigram indexes. Returns grouped results. |

**Milestone C: All backend APIs functional. Can perform full workflow via API: create segment -> add companies (form + CSV) -> approve -> add contacts -> approve -> assign SDR -> schedule meeting.**

### 6.5 Stream D -- Frontend (Week 2-5)

**Dependencies:** Stream A (A3) for scaffold. Can start building UI components independently of backend, connecting to APIs as they become available.
**Parallelizable with:** Stream C (completely parallel after scaffold).

| # | Task | Type | Size | Acceptance Criteria |
|---|------|------|------|---------------------|
| D1 | Tailwind config + global styles + CSS variables | FE | S | Inter font, color palette from mockups (CSS custom properties), scrollbar styles, status badge classes. |
| D2 | API client + types + endpoint constants | FE | S | Axios instance with JWT interceptor + refresh logic. TypeScript interfaces for all API response types. |
| D3 | Auth provider + login page + protected route | FE | M | Login form per mockup 01. Token storage. AuthContext with user state. ProtectedRoute redirect. Forgot/reset password pages. |
| D4 | AppShell (sidebar + header) | FE | L | Sidebar with both light and dark themes. Grouped nav links. Theme toggle. Header with page title, notification bell, user avatar + role badge. Responsive. Matches mockups 15 + 13. |
| D5 | Zustand stores (sidebar, command search, notifications) | FE | S | Three stores per section 4.4. Sidebar theme persisted to localStorage. |
| D6 | DataTable component | FE | L | Configurable columns, checkbox column, row hover actions, click handler, sortable headers. Matches mockup 16. |
| D7 | FilterBar component | FE | M | Search input with debounce, dropdown selects, toggle switch. Syncs to URL search params. |
| D8 | SidePanel component | FE | L | Slide-out from right (42% width), backdrop blur, close button, scrollable content, footer. Matches mockup 13. |
| D9 | ActivityTimeline component | FE | M | Vertical line, colored dots per action type, actor name, timestamp, description. |
| D10 | StatusBadge + Avatar + MetricCard | FE | S | StatusBadge with color variants. Avatar with initials + color hash. MetricCard per dashboard mockup. |
| D11 | Form components (FormField, SelectField, TagInput, FileUpload) | FE | M | React Hook Form compatible. Validation error display. TagInput for offerings autocomplete. FileUpload drag-and-drop zone. |
| D12 | Modal + Toast + ConfirmDialog | FE | S | Reusable modal with backdrop. Toast notifications (auto-dismiss). Confirm dialog for destructive actions. |
| D13 | InfiniteScroll hook + CursorPagination hook | FE | M | IntersectionObserver trigger. TanStack useInfiniteQuery wrapper. Loading spinner at bottom. |
| D14 | Dashboard page | FE | L | KPI metric cards, pipeline velocity bar chart (CSS-only), recent activity feed. Matches mockup 15. |
| D15 | User management page | FE | M | User list with DataTable. Create user modal (mockup 08). User detail panel with role management. |
| D16 | Segments page | FE | M | Card grid layout (mockup 14). Create/edit segment form with offerings autocomplete (mockup 04). Segment detail panel. |
| D17 | Company list page | FE | L | DataTable + FilterBar + infinite scroll + side panel. CSV export button. Add company button. Matches mockup 16. |
| D18 | Company detail panel | FE | L | Full detail with all fields (mockup 13). Related contacts section. Activity history timeline. Approve/reject/assign action buttons. |
| D19 | Add company form | FE | M | Full form per mockup 05. Segment selection. All fields. Client-side validation. |
| D20 | Company CSV upload page | FE | L | File upload zone (mockup 18), column mapping validation view (mockup 07), import progress, error display. |
| D21 | Contact list page | FE | L | DataTable + FilterBar + infinite scroll (mockup 17). Bulk approve bar when contacts selected. |
| D22 | Contact detail panel + add form | FE | L | Full detail panel. Add contact form (mockup 06). Company must be approved validation. |
| D23 | Contact CSV upload page | FE | M | Similar to company upload. Different required columns. |
| D24 | Approval queue page | FE | L | Tabbed view: Pending Companies + Uploaded Contacts (mockup 19). Approve/reject inline actions. |
| D25 | Researcher workbench page | FE | M | My Segments card grid + My Uploads table (mockup 20). Quick links. |
| D26 | Batch list + detail + error correction | FE | M | Upload history list. Batch detail with stats. Error report download. Re-upload corrected CSV. |
| D27 | Marketing collateral page | FE | S | List of collateral links. Add/edit/delete. Scope filter. |
| D28 | Profile/settings page | FE | M | Profile form (mockup 09). Notification preferences toggles. Password change. |
| D29 | Command search overlay | FE | L | Cmd+K triggered. Search input. Grouped results (companies, contacts, segments). Keyboard navigation. Matches mockup 11. |
| D30 | Notification center panel | FE | M | Right slide-out. Grouped by date. Filter pills. Mark all read. Unread badge on bell icon. Matches mockup 10. |

**Milestone D: Full UI matching all 20 mockups, connected to backend APIs, with working infinite scroll, side panels, CSV upload, and approval workflows.**

### 6.6 Critical Path

The critical path determines the minimum time to a working end-to-end system:

```
A1 -> A4 -> A5 -> A6 -> A7 -> B1 -> B2 -> B3 -> B4 -> C3 -> C4 -> C5 -> C6
  \                                                    /
   \-> A2 -> A3 -> D1 -> D2 -> D3 -> D4 -> D6 -> D17 -> D18
```

**Critical path items:** Docker setup -> FastAPI app -> Models -> Migration -> Seed -> Auth -> Dependencies -> Company API -> Contact API -> CSV Pipeline -> Company List UI -> Company Detail Panel.

### 6.7 Parallelization Matrix

| After Completing | Can Start In Parallel |
|-----------------|----------------------|
| A1 (Docker) | A2 + A3 (backend + frontend Dockerfiles) |
| A4 (FastAPI app) | A5 + B6 (models + error handling) |
| A6 (migration) | B1 + B2 + B7 (auth + user repo) simultaneously |
| B3 (auth dep) | B4 + B5 + C1 + C2 (RBAC + users + offerings + segments) |
| B4 (RBAC) | C3 + C4 + C8 + C11 + C12 (all service endpoints) |
| A3 (FE scaffold) | D1 + D2 + D5 (styles + api client + stores) |
| D2 (api client) | D3 (auth pages) + D6 + D7 + D8 (shared components) |
| D4 (AppShell) | D14-D30 (all module pages, in any order) |

### 6.8 Suggested Implementation Order Within Streams

**Backend (recommended file creation order):**
1. `app/config.py` -> `app/database.py` -> `app/main.py`
2. `app/models/base.py` -> `app/models/enums.py` -> all model files
3. `alembic/env.py` -> first migration
4. `app/seed.py`
5. `app/utils/security.py` -> `app/schemas/auth.py` -> `app/schemas/common.py`
6. `app/middleware/error_handler.py` -> `app/middleware/request_context.py`
7. `app/repositories/base.py` -> `app/repositories/user_repo.py`
8. `app/dependencies/auth.py` -> `app/dependencies/rbac.py` -> `app/dependencies/pagination.py`
9. `app/services/auth_service.py` -> `app/routers/auth.py`
10. `app/services/user_service.py` -> `app/routers/users.py`
11. `app/utils/normalizers.py`
12. Remaining services + routers in dependency order: offerings -> segments -> companies -> contacts -> assignments -> approvals -> batches/csv -> workbench -> collateral -> audit -> dashboard -> notifications -> search
13. `app/jobs/scheduler.py` -> `app/jobs/duplicate_detection.py`
14. `app/routers/health.py`

**Frontend (recommended file creation order):**
1. `tailwind.config.ts` -> `src/index.css` -> `src/utils/cn.ts`
2. `src/api/client.ts` -> `src/api/types.ts` -> `src/api/endpoints.ts`
3. `src/auth/AuthProvider.tsx` -> `src/auth/useAuth.ts` -> `src/auth/ProtectedRoute.tsx`
4. `src/auth/pages/LoginPage.tsx`
5. `src/stores/` (all three stores)
6. `src/components/layout/AppShell.tsx` -> `Sidebar.tsx` -> `Header.tsx`
7. `src/components/feedback/StatusBadge.tsx` -> `Avatar.tsx` -> `LoadingSpinner.tsx` -> `Toast.tsx`
8. `src/components/data/DataTable.tsx` -> `FilterBar.tsx` -> `InfiniteScrollTrigger.tsx`
9. `src/hooks/useInfiniteScroll.ts` -> `useCursorPagination.ts` -> `useDebounce.ts`
10. `src/components/detail/SidePanel.tsx` -> `ActivityTimeline.tsx`
11. `src/components/forms/` (all form components)
12. `src/components/overlays/Modal.tsx`
13. Module pages in order: dashboard -> users -> segments -> companies -> contacts -> approvals -> workbench -> uploads -> collateral -> settings
14. `src/components/overlays/CommandSearch.tsx` -> `NotificationPanel.tsx`

### 6.9 Review Checkpoints

| Checkpoint | When | What to Review |
|------------|------|---------------|
| **RC1** | After Stream A | Docker stack runs. DB schema correct. Health endpoint works. |
| **RC2** | After Stream B | Login flow works. RBAC enforced. User CRUD via API. |
| **RC3** | After C3+C4 | Company and contact CRUD via API. Status transitions work. Business rules enforced. |
| **RC4** | After D4+D6+D8 | AppShell renders with both sidebar themes. DataTable displays mock data. SidePanel opens/closes. |
| **RC5** | After C6 | CSV upload end-to-end: upload file, see batch processing, download error report. |
| **RC6** | After D17+D18 | Company list page with infinite scroll connected to backend. Side panel shows real data. |
| **RC7** | After D24 | Approval queue fully functional. Can approve/reject companies, bulk approve contacts. |
| **RC8** | Final | All 20 mockup screens implemented. Full workflow testable. Dual sidebar themes work. CSV upload/export works. Dashboard shows real KPIs. |

---

## Appendix A: Design Token Reference (from Mockups)

These are the consistent design values extracted from the HTML mockups:

```css
/* Font */
font-family: 'Inter', sans-serif;

/* Colors (light sidebar variant) */
--primary: #2563EB;
--primary-hover: #1D4ED8;
--background: #F8FAFC;       /* slate-50 */
--surface: #FFFFFF;
--border: #E2E8F0;           /* slate-200 */
--text-primary: #0F172A;     /* slate-900 */
--text-secondary: #64748B;   /* slate-500 */
--success: #16A34A;
--warning: #D97706;
--danger: #DC2626;

/* Status badge colors */
.status-pending:   bg-amber-50  text-amber-700  border-amber-200
.status-approved:  bg-green-50  text-green-700  border-green-200
.status-rejected:  bg-red-50    text-red-700    border-red-200
.status-uploaded:  bg-blue-50   text-blue-700   border-blue-200

/* Icon font */
Google Material Symbols Outlined (not Material Icons -- the newer variable weight set)

/* Sidebar width */
w-64 (256px)

/* Header height */
h-16 (64px) on light shell, h-14 (56px) on dark shell -- normalize to h-16

/* Side panel width */
w-[42%] of main content area

/* Table row density */
py-2 px-4 for dense, py-4 px-6 for standard
```

## Appendix B: Business Rules Quick Reference

1. **Company -> Segment:** One company belongs to exactly one segment. Same real-world company in two segments = two records.
2. **Company dedup key:** `(company_name, company_website)` within same `segment_id`. Cross-segment duplicates are intentional.
3. **Company approval:** Individual only (no bulk). Rejection requires reason and is final.
4. **Company status flow:** `pending -> approved` OR `pending -> rejected`. No other transitions.
5. **Contact -> Company:** Contacts can only be created for approved companies.
6. **Contact segment:** Derived from company's segment. Never set directly.
7. **Contact dedup key:** `(email, company_name)` recommended.
8. **Contact approval:** Bulk allowed. No rejection.
9. **Contact status flow:** `uploaded -> approved -> assigned_to_sdr -> meeting_scheduled`.
10. **CSV upload:** Validate all rows, import valid ones, skip invalid. Within-file duplicates both imported.
11. **Visibility:** All users see same list views. Role determines available actions.
12. **Approver = Senior Researcher:** Has all researcher capabilities plus approval rights.
13. **Default list behavior:** Hide duplicates and deactivated records. Toggle to show.
14. **Data normalization:** Trim whitespace, normalize URLs, consistent casing on company names.
