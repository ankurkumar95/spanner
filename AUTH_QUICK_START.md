# Authentication & RBAC Quick Start Guide

## For Backend Developers

### Using Authentication in Your Endpoints

#### 1. Public Endpoint (No Auth)
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/public")
async def public_endpoint():
    return {"message": "No authentication required"}
```

#### 2. Authenticated Endpoint (Any Logged-In User)
```python
from fastapi import APIRouter, Depends
from app.core.deps import get_current_active_user

router = APIRouter()

@router.get("/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_active_user)):
    return {
        "message": f"Hello {current_user['name']}",
        "user_id": current_user["id"],
        "roles": current_user["roles"]
    }
```

#### 3. Role-Based Endpoint (Specific Roles)
```python
from fastapi import APIRouter, Depends
from app.core.deps import require_roles

router = APIRouter()

# Only admins can access
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles("admin"))
):
    return {"message": f"User {user_id} deleted by {current_user['name']}"}

# Admins OR segment owners can access
@router.get("/segments")
async def list_segments(
    current_user: dict = Depends(require_roles("admin", "segment_owner"))
):
    return {"segments": []}
```

#### 4. Permission-Based Endpoint (Specific Actions)
```python
from fastapi import APIRouter, Depends
from app.core.deps import require_permission

router = APIRouter()

@router.post("/companies/{company_id}/approve")
async def approve_company(
    company_id: str,
    current_user: dict = Depends(require_permission("approve_company"))
):
    # Only users whose roles have "approve_company" permission can access
    return {"message": f"Company {company_id} approved"}
```

### Current User Object Structure
```python
current_user = {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",  # or "deactivated"
    "roles": ["admin", "researcher"]  # list of role strings
}
```

### Available Roles
- `admin` - Full system access
- `segment_owner` - Segment and data management
- `researcher` - Data entry and editing
- `approver` - Approval rights for companies/contacts
- `sdr` - Sales development representative
- `marketing` - Marketing operations

### Available Permissions (Actions)
Check the role_grants table or query `/api/v1/users/{user_id}/permissions` to see what actions each role has.

Common actions:
- `manage_users`
- `manage_segments`
- `manage_companies`
- `approve_company`
- `approve_contact`
- `upload_data`
- `export_data`
- `view_audit_logs`

## For Frontend Developers

### 1. Login Flow
```javascript
// Login
const response = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'admin@spanner.local',  // Note: username field = email
    password: 'admin123'
  })
});

const data = await response.json();
// data = { access_token: "...", refresh_token: "...", token_type: "bearer" }

// Store tokens securely
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
```

### 2. Making Authenticated Requests
```javascript
const accessToken = localStorage.getItem('access_token');

const response = await fetch('http://localhost:8000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const user = await response.json();
// user = { id: "...", email: "...", name: "...", status: "active", roles: [...] }
```

### 3. Handling Token Expiration
```javascript
async function fetchWithAuth(url, options = {}) {
  let accessToken = localStorage.getItem('access_token');

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If token expired, refresh it
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    const refreshResponse = await fetch('http://localhost:8000/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('access_token', data.access_token);

      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.access_token}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}

// Usage
const response = await fetchWithAuth('http://localhost:8000/api/v1/users');
const data = await response.json();
```

### 4. Logout
```javascript
// Simply remove tokens (no server-side revocation yet)
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
window.location.href = '/login';
```

### 5. Role-Based UI Rendering
```javascript
// Get current user
const response = await fetchWithAuth('http://localhost:8000/api/v1/auth/me');
const user = await response.json();

// Check if user has specific role
const isAdmin = user.roles.includes('admin');
const canManageUsers = user.roles.includes('admin') || user.roles.includes('segment_owner');

// Conditionally render UI
if (isAdmin) {
  showAdminDashboard();
}

// React example
function UserManagementButton() {
  const { user } = useAuth();

  if (!user.roles.includes('admin')) {
    return null;  // Hide button for non-admins
  }

  return <button>Manage Users</button>;
}
```

### 6. Permission-Based UI
```javascript
// Get user permissions
const response = await fetchWithAuth(`http://localhost:8000/api/v1/users/${user.id}/permissions`);
const data = await response.json();
// data = { user_id: "...", permissions: ["approve_company", "manage_users", ...] }

const canApprove = data.permissions.includes('approve_company');

if (canApprove) {
  showApproveButton();
}
```

## API Reference

### Authentication Endpoints

#### POST /api/v1/auth/login
Login with email and password.

**Request**:
```
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=mypassword
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- 401: Invalid credentials
- 422: Validation error

#### POST /api/v1/auth/refresh
Get new access token using refresh token.

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- 401: Invalid or expired refresh token

#### GET /api/v1/auth/me
Get current user information.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "active",
  "roles": ["researcher", "approver"]
}
```

**Errors**:
- 401: Invalid or missing token
- 403: User deactivated

### User Management Endpoints

#### GET /api/v1/users
List users (requires admin or segment_owner role).

**Query Parameters**:
- `page` (default: 1) - Page number
- `per_page` (default: 20, max: 100) - Items per page
- `status_filter` (optional) - Filter by "active" or "deactivated"

**Response** (200):
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "status": "active",
      "roles": ["researcher"],
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "total_pages": 3
}
```

#### POST /api/v1/users
Create new user (requires admin role).

**Request**:
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "securepass123",
  "roles": ["researcher", "sdr"],
  "status": "active"
}
```

**Response** (201):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "status": "active",
  "roles": ["researcher", "sdr"],
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

**Errors**:
- 400: Email already exists
- 403: Insufficient permissions
- 422: Validation error

#### PUT /api/v1/users/{user_id}/roles
Update user roles (requires admin role).

**Request**:
```json
{
  "roles": ["admin", "segment_owner"]
}
```

**Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "active",
  "roles": ["admin", "segment_owner"],
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T14:25:00"
}
```

## Testing the Implementation

### 1. Start the Server
```bash
cd /Users/ankur/Documents/projects/coding_with_claude/spanner/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test with Default Admin User
The database seed includes a default admin user:
- Email: `admin@spanner.local`
- Password: `admin123`

### 3. Access API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Example cURL Commands
```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@spanner.local&password=admin123"

# Get current user (replace TOKEN with access_token from login)
curl "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer TOKEN"

# List users
curl "http://localhost:8000/api/v1/users?page=1&per_page=20" \
  -H "Authorization: Bearer TOKEN"
```

## Common Error Codes

- **401 Unauthorized**: Invalid, missing, or expired token
- **403 Forbidden**: Valid token but insufficient permissions or deactivated user
- **404 Not Found**: User/resource not found
- **422 Unprocessable Entity**: Validation error in request body
- **500 Internal Server Error**: Server error (check logs)

## Security Best Practices

1. **Never log tokens or passwords** - Logs should never contain sensitive data
2. **Use HTTPS in production** - Never send tokens over HTTP
3. **Store refresh tokens securely** - Use httpOnly cookies or secure storage
4. **Implement logout** - Clear tokens from client storage
5. **Handle token expiration gracefully** - Implement automatic refresh
6. **Validate on both frontend and backend** - Don't trust client-side validation alone
7. **Use short access token expiration** - Current: 30 minutes (configurable)
8. **Implement rate limiting** - Prevent brute force attacks (not yet implemented)

## Troubleshooting

### "Could not validate credentials" Error
- Check token hasn't expired (access tokens expire in 30 minutes)
- Verify token is included in Authorization header as "Bearer TOKEN"
- Try refreshing the token

### "Insufficient permissions" Error
- User doesn't have required role or permission
- Check user's roles with GET /auth/me
- Check user's permissions with GET /users/{user_id}/permissions

### "User account is deactivated" Error
- User status set to "deactivated"
- Admin needs to reactivate with POST /users/{user_id}/activate

### Database Connection Issues
- Verify DATABASE_URL in .env file
- Check PostgreSQL is running
- Verify database migrations have been run

## Next Steps

For production deployment, see "Required Before Production" section in AUTH_IMPLEMENTATION.md.
