# Authentication and RBAC Implementation Summary

## Overview
Complete implementation of authentication and role-based access control (RBAC) system for Spanner CRM backend using FastAPI, async SQLAlchemy, and PostgreSQL.

## Technology Stack
- **Framework**: FastAPI with async endpoints
- **Database**: PostgreSQL with async SQLAlchemy (sqlalchemy.text for raw queries)
- **Password Hashing**: bcrypt via passlib
- **JWT Tokens**: python-jose with HS256 algorithm
- **Token Transport**: OAuth2PasswordBearer (Authorization: Bearer header)

## Files Created

### 1. Core Security Module
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/core/security.py`

**Functions**:
- `hash_password(password: str) -> str` - Bcrypt password hashing
- `verify_password(plain: str, hashed: str) -> bool` - Password verification
- `create_access_token(data: dict, expires_delta: timedelta | None) -> str` - JWT access token (30 min default)
- `create_refresh_token(data: dict) -> str` - JWT refresh token (7 days default)
- `decode_token(token: str) -> dict` - JWT decoding and verification

**Key Features**:
- Uses bcrypt with auto-generated salt
- JWT tokens include "sub" claim for user_id (as string)
- Tokens include "type" field to distinguish access vs refresh tokens
- Expiration configurable via settings (ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS)

### 2. Dependency Injection Module
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/core/deps.py`

**Dependencies**:
- `get_current_user(token, db)` - Extracts user from JWT, fetches from DB with roles
- `get_current_active_user(user)` - Verifies user status is 'active'
- `require_roles(*roles)` - Factory returning dependency that checks user has required role(s)
- `require_permission(action)` - Factory checking if user's roles have specific permission in role_grants

**Key Features**:
- OAuth2PasswordBearer for automatic token extraction from Authorization header
- Validates token type (access vs refresh)
- Returns 401 for invalid/expired tokens
- Returns 403 for deactivated users or insufficient permissions
- Uses raw SQL queries to avoid ORM model dependencies

### 3. Authentication Service
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/services/auth_service.py`

**Functions**:
- `authenticate_user(db, email, password)` - Email/password authentication
- `create_user(db, email, name, password, roles, status)` - User creation with roles and preferences
- `update_user(db, user_id, name, email, password, status)` - Update user fields
- `deactivate_user(db, user_id)` - Set status to 'deactivated'
- `activate_user(db, user_id)` - Set status to 'active'
- `get_user_by_id(db, user_id)` - Fetch user with roles
- `get_user_by_email(db, email)` - Fetch user by email with roles
- `list_users(db, skip, limit, status_filter)` - Paginated user list
- `count_users(db, status_filter)` - Count users with optional filter
- `update_user_roles(db, user_id, roles)` - Replace user roles
- `get_user_permissions(db, user_id)` - Get all granted actions for user

**Key Features**:
- All database operations use async SQLAlchemy with raw SQL (text())
- Password hashing/verification integrated
- Automatic user preferences creation on user creation
- Transaction management via db.commit()
- Returns user dictionaries (not ORM models)

### 4. Pydantic Schemas

#### Auth Schemas
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/schemas/auth.py`

- `Token` - Login response with access + refresh tokens
- `TokenRefresh` - Refresh token request
- `AccessToken` - Refresh response with new access token
- `UserResponse` - Current user info
- `ForgotPasswordRequest` - Email for password reset
- `ResetPasswordRequest` - Token + new password
- `MessageResponse` - Generic message response

#### User Schemas
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/schemas/user.py`

- `UserCreate` - User creation with email, name, password, roles, status
- `UserUpdate` - Partial user update (all fields optional)
- `UserRolesUpdate` - Role replacement
- `UserResponse` - User detail response
- `UserListResponse` - Paginated user list with metadata
- `UserPermissionsResponse` - User permissions list

**Key Features**:
- EmailStr validation for email fields
- Field length validation (min_length, max_length)
- Literal types for roles and status (type safety)
- Detailed field descriptions for OpenAPI docs

### 5. Authentication Router
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/routers/auth.py`

**Endpoints**:
- `POST /auth/login` - Email/password login, returns access + refresh tokens
- `POST /auth/refresh` - Exchange refresh token for new access token
- `GET /auth/me` - Get current user info (requires auth)
- `POST /auth/forgot-password` - Placeholder for password reset initiation
- `POST /auth/reset-password` - Placeholder for password reset completion

**Key Features**:
- Uses OAuth2PasswordRequestForm for /login (username field = email)
- Validates token type in /refresh (must be refresh token)
- Prevents email enumeration in forgot-password (always returns success)
- Comprehensive logging for security events
- Proper HTTP status codes (200, 401)

### 6. User Management Router
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/routers/users.py`

**Endpoints**:
- `GET /users` - List users with pagination (admin/segment_owner)
- `GET /users/{user_id}` - Get user detail (admin/segment_owner)
- `POST /users` - Create user (admin only)
- `PATCH /users/{user_id}` - Update user (admin only)
- `POST /users/{user_id}/deactivate` - Deactivate user (admin only)
- `POST /users/{user_id}/activate` - Activate user (admin only)
- `PUT /users/{user_id}/roles` - Update user roles (admin only)
- `GET /users/{user_id}/permissions` - Get user permissions (admin only)

**Key Features**:
- Pagination with query params (page, per_page)
- Optional status filtering (active/deactivated)
- Email uniqueness validation on create/update
- Prevents self-deactivation
- Prevents removing admin role from self
- Returns 201 for create, 200 for updates, 404 for not found
- Comprehensive logging for all operations

### 7. Router Registration
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/routers/__init__.py` (updated)

**Changes**:
- Import auth and users routers
- Register auth router with prefix="/auth", tags=["Authentication"]
- Register users router with prefix="/users", tags=["Users"]

### 8. Services Module
**File**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/services/__init__.py` (created)

**Exports**: auth_service

## Database Schema

### Tables Used
- **users**: id (UUID), email, name, password_hash, status (active/deactivated)
- **user_roles**: id (BIGINT), user_id FK, role (enum)
- **role_grants**: id (BIGINT), role (enum), action (text), granted (bool)
- **user_preferences**: id (UUID), user_id FK, sidebar_theme, notification_preferences

### Roles (user_role enum)
- `admin` - Full system access
- `segment_owner` - Segment management
- `researcher` - Data entry
- `approver` - Approval rights
- `sdr` - Sales development
- `marketing` - Marketing operations

### Default Permissions (from seed data)
Admin permissions include: manage_users, manage_segments, manage_offerings, approve_company, approve_contact, etc.

See `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/alembic/versions/001_initial_schema.sql` lines 549-613 for complete permission mappings.

## API Endpoints

### Base URL
All endpoints are prefixed with `/api/v1` (from settings.API_V1_PREFIX)

### Authentication Endpoints
```
POST   /api/v1/auth/login              - Login with email/password
POST   /api/v1/auth/refresh            - Refresh access token
GET    /api/v1/auth/me                 - Get current user info
POST   /api/v1/auth/forgot-password    - Request password reset (placeholder)
POST   /api/v1/auth/reset-password     - Reset password (placeholder)
```

### User Management Endpoints
```
GET    /api/v1/users                   - List users (paginated)
GET    /api/v1/users/{user_id}         - Get user detail
POST   /api/v1/users                   - Create user
PATCH  /api/v1/users/{user_id}         - Update user
POST   /api/v1/users/{user_id}/deactivate  - Deactivate user
POST   /api/v1/users/{user_id}/activate    - Activate user
PUT    /api/v1/users/{user_id}/roles   - Update user roles
GET    /api/v1/users/{user_id}/permissions - Get user permissions
```

## Authentication Flow

### 1. Login Flow
```
1. Client sends POST /api/v1/auth/login with email + password (form data)
2. Server validates credentials via auth_service.authenticate_user()
3. If valid, creates access token (30 min) and refresh token (7 days)
4. Returns both tokens to client
5. Client stores tokens (access in memory, refresh in httpOnly cookie or secure storage)
```

### 2. Authenticated Request Flow
```
1. Client sends request with "Authorization: Bearer {access_token}" header
2. OAuth2PasswordBearer extracts token
3. get_current_user dependency decodes JWT, extracts user_id from "sub" claim
4. Fetches user from database with roles
5. Returns user dict to endpoint handler
6. Optional: require_roles() or require_permission() checks authorization
7. Endpoint executes with validated user context
```

### 3. Token Refresh Flow
```
1. Client's access token expires (30 min)
2. Client sends POST /api/v1/auth/refresh with refresh_token
3. Server validates refresh token (type must be "refresh")
4. Verifies user still exists and is active
5. Issues new access token (refresh token remains valid)
6. Client updates stored access token
```

## RBAC Model

### Role Assignment
- Users can have multiple roles (user_roles junction table)
- Roles assigned on user creation or updated via PUT /users/{id}/roles
- Each role has permissions defined in role_grants table

### Permission Checking
- `require_roles("admin", "segment_owner")` - User must have at least one of these roles
- `require_permission("approve_company")` - User's roles must have this action granted in role_grants

### Permission Flow
```
1. Endpoint decorated with Depends(require_permission("action_name"))
2. Dependency fetches user's roles from current_user
3. Queries role_grants WHERE role IN user_roles AND action = "action_name" AND granted = true
4. If count > 0, permission granted; otherwise 403 Forbidden
```

## Security Features

### Password Security
- Bcrypt hashing with auto-generated salt
- Minimum password length: 8 characters (enforced by Pydantic schema)
- Passwords never returned in API responses
- Password update requires admin role

### Token Security
- JWT with HS256 algorithm (symmetric key)
- Secret key from environment variable (SECRET_KEY)
- Short-lived access tokens (30 min)
- Longer-lived refresh tokens (7 days)
- Token type validation (access vs refresh)
- No token revocation (stateless design - use short expiration)

### API Security
- OAuth2 with Bearer tokens
- 401 Unauthorized for invalid/expired tokens
- 403 Forbidden for insufficient permissions or deactivated users
- Email uniqueness enforced at database level
- Email format validation via Pydantic
- No email enumeration in forgot-password endpoint

### Logging
- All authentication events logged (login, refresh, failures)
- All user management operations logged with actor info
- Failed login attempts logged with attempted email
- Log levels: INFO for success, WARNING for security events, ERROR for failures

## Configuration

### Environment Variables Required
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
SECRET_KEY=your-secret-key-here (generate with: openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256
```

### Settings Location
`/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/core/config.py`

## Testing Recommendations

### Unit Tests
- Test password hashing and verification
- Test JWT token creation and decoding
- Test token expiration validation
- Test permission checking logic
- Test user service CRUD operations

### Integration Tests
- Test /login with valid credentials
- Test /login with invalid credentials
- Test /me with valid token
- Test /me with expired token
- Test /refresh with refresh token
- Test /refresh with access token (should fail)
- Test user creation with duplicate email
- Test role updates
- Test self-deactivation prevention
- Test permission-based endpoint access

### Manual Testing
```bash
# 1. Login as admin (default user from seed data)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@spanner.local&password=admin123"

# Response: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}

# 2. Get current user info
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer {access_token}"

# 3. List users
curl http://localhost:8000/api/v1/users?page=1&per_page=20 \
  -H "Authorization: Bearer {access_token}"

# 4. Create new user
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123",
    "roles": ["researcher"]
  }'
```

## Follow-Up Steps

### Required Before Production
1. Set secure SECRET_KEY in production environment (not hardcoded)
2. Use HTTPS only in production
3. Implement token refresh rotation (invalidate old refresh token on refresh)
4. Add token revocation/blacklist for logout functionality
5. Implement actual password reset email sending (forgot-password endpoint)
6. Add rate limiting on /login endpoint (prevent brute force)
7. Add account lockout after N failed login attempts
8. Implement audit logging to database (currently only app logs)
9. Add CSRF protection for cookie-based auth (if using cookies)
10. Configure CORS properly for production origins

### Optional Enhancements
1. Add two-factor authentication (2FA/MFA)
2. Add OAuth2 social login (Google, GitHub, etc.)
3. Add API key authentication for service-to-service calls
4. Implement refresh token rotation
5. Add password strength requirements (complexity rules)
6. Add password history (prevent reuse of last N passwords)
7. Add session management (view active sessions, revoke sessions)
8. Add IP-based access restrictions
9. Add user invitation flow with email verification
10. Add user profile picture/avatar support

## Known Limitations

1. **No Token Revocation**: Stateless JWT means tokens valid until expiration (use short expiration times)
2. **Password Reset Not Implemented**: Endpoints are placeholders (need email service integration)
3. **No Rate Limiting**: No protection against brute force attacks on /login
4. **No Audit Trail**: User operations logged to app logs but not persisted to audit_logs table
5. **Single Secret Key**: All tokens signed with same key (consider key rotation strategy)
6. **No Email Verification**: Users created without email verification step
7. **Raw SQL Queries**: Using text() instead of ORM models (intentional to avoid model dependencies, but less type-safe)

## File Structure
```
backend/
├── app/
│   ├── core/
│   │   ├── config.py           (existing - settings)
│   │   ├── database.py         (existing - DB setup)
│   │   ├── security.py         (NEW - password/JWT utils)
│   │   └── deps.py             (NEW - auth dependencies)
│   ├── services/
│   │   ├── __init__.py         (UPDATED - export auth_service)
│   │   └── auth_service.py     (NEW - auth business logic)
│   ├── schemas/
│   │   ├── __init__.py         (NEW - schema package)
│   │   ├── auth.py             (NEW - auth schemas)
│   │   └── user.py             (NEW - user schemas)
│   ├── routers/
│   │   ├── __init__.py         (UPDATED - register auth/users routers)
│   │   ├── auth.py             (NEW - auth endpoints)
│   │   └── users.py            (NEW - user management endpoints)
│   └── main.py                 (existing - FastAPI app)
├── alembic/
│   └── versions/
│       └── 001_initial_schema.sql  (existing - DB schema with users, roles, grants)
└── requirements.txt            (existing - all deps already present)
```

## Success Criteria

All files have been created and verified:
- Python syntax validation passed for all files
- No import errors (all dependencies in requirements.txt)
- Router registration completed
- Database schema already exists with correct tables
- Default admin user seeded in database (email: admin@spanner.local, password: admin123)

The implementation is production-ready with the exception of items listed in "Required Before Production" section.
