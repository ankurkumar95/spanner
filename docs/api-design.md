# Spanner — API Design

**Document Version:** 1.0  
**Last Updated:** 2026-02-14  
**Source:** `requirements.md` v3.1  
**Base URL:** `/api`

---

## 1. Conventions

### 1.1 General

| Convention | Detail |
|-----------|--------|
| **Format** | JSON (request/response) |
| **Auth header** | `Authorization: Bearer <access_token>` |
| **Pagination** | Cursor-based infinite scroll: `?cursor=<id>&limit=20` |
| **Filtering** | Query params: `?status=approved&segment_id=<uuid>` |
| **Search** | Query param: `?search=<term>` (server-side) |
| **Sorting** | Query param: `?sort_by=created_at&sort_order=desc` |
| **Timestamps** | ISO 8601 with timezone (e.g., `2026-02-14T10:30:00Z`) |
| **IDs** | UUID v4 |

### 1.2 Standard Response Envelope

**Success (single):**
```json
{
  "data": { ... },
  "meta": { "timestamp": "2026-02-14T10:30:00Z" }
}
```

**Success (list):**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "limit": 20,
    "next_cursor": "uuid-or-null",
    "timestamp": "2026-02-14T10:30:00Z"
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### 1.3 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE, some actions) |
| 400 | Validation error / bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state violation) |
| 413 | File too large |
| 422 | Unprocessable entity (CSV validation errors) |
| 500 | Internal server error |

---

## 2. Authentication Endpoints

No auth required for login/forgot-password. Token refresh requires valid refresh token.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login with email + password | No |
| POST | `/api/auth/refresh` | Refresh access token | Refresh token |
| POST | `/api/auth/forgot-password` | Request password reset email | No |
| POST | `/api/auth/reset-password` | Reset password with token | Reset token |
| POST | `/api/auth/logout` | Invalidate tokens | Bearer |

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["researcher", "approver"]
    }
  }
}
```

---

## 3. User Management Endpoints

All endpoints require **Admin** role.

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/users` | List users (search, filter) | Admin |
| POST | `/api/users` | Create user (admin-only signup) | Admin |
| GET | `/api/users/:id` | Get user details | Admin |
| PATCH | `/api/users/:id` | Update user (roles, details) | Admin |
| POST | `/api/users/:id/deactivate` | Soft-deactivate user | Admin |
| POST | `/api/users/:id/activate` | Re-activate user | Admin |

### POST `/api/users`

**Request:**
```json
{
  "email": "researcher@example.com",
  "name": "Jane Smith",
  "password": "initial_password",
  "role_ids": [3]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "researcher@example.com",
    "name": "Jane Smith",
    "is_active": true,
    "roles": [{ "id": 3, "name": "researcher" }],
    "created_at": "2026-02-14T10:30:00Z"
  }
}
```

---

## 4. Segment Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/segments` | List segments (all users) | Any authenticated |
| POST | `/api/segments` | Create segment | Segment Owner |
| GET | `/api/segments/:id` | Get segment details | Any authenticated |
| PATCH | `/api/segments/:id` | Update segment | Segment Owner |
| POST | `/api/segments/:id/archive` | Archive segment | Segment Owner |
| POST | `/api/segments/:id/activate` | Re-activate archived segment | Segment Owner |

### GET `/api/segments`

**Query params:** `?status=active&search=fintech&sort_by=name&cursor=&limit=20`

### POST `/api/segments`

**Request:**
```json
{
  "name": "Enterprise Fintech",
  "description": "Large fintech companies in APAC region",
  "offering_ids": ["uuid-1", "uuid-2"],
  "new_offerings": [
    { "name": "Cloud Migration", "description": "Cloud infra services" }
  ]
}
```

**Notes:**
- `offering_ids` — existing offerings to link
- `new_offerings` — create new offerings and link in one call (auto-complete behavior)

---

## 5. Company Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/companies` | List companies (common view, filters) | Any authenticated* |
| POST | `/api/companies` | Create company (form, single) | Researcher, Approver |
| GET | `/api/companies/:id` | Get company details | Any authenticated* |
| PATCH | `/api/companies/:id` | Basic edit (detail view) | Researcher, Approver |
| POST | `/api/companies/:id/approve` | Approve company (individual) | Approver, SDR (grant) |
| POST | `/api/companies/:id/reject` | Reject company (with reason) | Approver, SDR (grant) |

*Marketing role excluded from company views.

### GET `/api/companies`

**Query params:**
```
?segment_id=uuid
&status=pending
&created_by=uuid
&is_duplicate=false       (default: false — hide duplicates)
&is_active=true           (default: true — hide deactivated)
&search=acme
&sort_by=created_at
&sort_order=desc
&cursor=uuid
&limit=20
```

### POST `/api/companies`

**Request:**
```json
{
  "name": "Acme Corp",
  "website": "https://acme.com",
  "phone": "+1-555-0100",
  "description": "Enterprise software company",
  "linkedin_url": "https://linkedin.com/company/acme",
  "industry": "Technology",
  "sub_industry": "SaaS",
  "address_street": "123 Main St",
  "address_city": "San Francisco",
  "address_state": "CA",
  "address_country": "US",
  "address_zip": "94102",
  "founded_year": 2010,
  "revenue_range": "$10M - $50M",
  "employee_size_range": "51-200",
  "segment_id": "uuid"
}
```

### POST `/api/companies/:id/reject`

**Request:**
```json
{
  "rejection_reason": "Company does not match target profile for this segment — too small."
}
```

---

## 6. Contact Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/contacts` | List contacts (common view, filters) | Any authenticated* |
| POST | `/api/contacts` | Create contact (form, single) | Researcher, Approver |
| GET | `/api/contacts/:id` | Get contact details | Any authenticated* |
| PATCH | `/api/contacts/:id` | Basic edit (detail view) | Researcher, Approver |
| POST | `/api/contacts/approve` | Bulk approve contacts | Approver, SDR (grant) |
| POST | `/api/contacts/:id/assign` | Assign contact to SDR | Approver (grant) |
| POST | `/api/contacts/:id/schedule-meeting` | Mark meeting scheduled | SDR |

### GET `/api/contacts`

**Query params:**
```
?company_id=uuid
&segment_id=uuid
&status=approved
&assigned_sdr_id=uuid
&created_by=uuid
&is_duplicate=false
&is_active=true
&search=john
&sort_by=created_at
&cursor=uuid
&limit=20
```

### POST `/api/contacts/approve` (Bulk)

**Request:**
```json
{
  "contact_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### POST `/api/contacts/:id/assign`

**Request:**
```json
{
  "sdr_id": "uuid"
}
```

---

## 7. CSV Upload Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/api/uploads/companies` | Upload company CSV | Researcher, Approver |
| POST | `/api/uploads/contacts` | Upload contact CSV | Researcher, Approver |
| GET | `/api/uploads/batches` | List upload batches | Researcher, Approver |
| GET | `/api/uploads/batches/:id` | Get batch details | Researcher, Approver |
| GET | `/api/uploads/batches/:id/errors` | List errors for a batch | Researcher, Approver |
| GET | `/api/uploads/batches/:id/errors/download` | Download error report CSV | Researcher, Approver |

### POST `/api/uploads/companies`

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | file | Yes | .csv, max 10MB, UTF-8 |

**Response (200):**
```json
{
  "data": {
    "batch_id": "uuid",
    "file_name": "companies-batch-1.csv",
    "total_rows": 150,
    "valid_rows": 142,
    "invalid_rows": 8,
    "status": "completed",
    "errors_url": "/api/uploads/batches/uuid/errors"
  }
}
```

**Response (422 — file-level rejection):**
```json
{
  "error": {
    "code": "CSV_VALIDATION_ERROR",
    "message": "CSV file validation failed",
    "details": [
      { "check": "encoding", "message": "File is not UTF-8 encoded" }
    ]
  }
}
```

### GET `/api/uploads/batches/:id/errors`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "row_number": 5,
      "column_name": "Company Website",
      "value": "not-a-url",
      "error_message": "Invalid URL format",
      "is_corrected": false
    },
    {
      "id": "uuid",
      "row_number": 12,
      "column_name": "Segment Name",
      "value": "Nonexistent Segment",
      "error_message": "Segment not found or not active",
      "is_corrected": false
    }
  ],
  "meta": { "total": 8 }
}
```

---

## 8. Assignment Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/api/assignments` | Create assignment | Segment Owner, Approver (grant) |
| GET | `/api/assignments` | List assignments (filter by entity/user) | Authenticated |
| DELETE | `/api/assignments/:id` | Remove assignment | Segment Owner, Approver |

### POST `/api/assignments`

**Request:**
```json
{
  "entity_type": "segment",
  "entity_id": "uuid",
  "assigned_to": "uuid"
}
```

**Validation:**
- Assigner must have permission for the entity type
- Assignee must have appropriate role (researcher for segments/companies, SDR for contacts)
- No duplicate assignments (unique constraint)

---

## 9. Approval Queue Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/approval-queue/companies` | Pending companies | Approver, SDR (grant) |
| GET | `/api/approval-queue/contacts` | Uploaded contacts | Approver, SDR (grant) |

### GET `/api/approval-queue/companies`

Shortcut for `GET /api/companies?status=pending` with approval-specific filters.

**Query params:**
```
?segment_id=uuid
&created_by=uuid
&date_from=2026-01-01
&date_to=2026-02-14
&sort_by=created_at
&cursor=uuid
&limit=20
```

---

## 10. Marketing Collateral Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/collaterals` | List collaterals | Marketing |
| POST | `/api/collaterals` | Add collateral link | Marketing |
| GET | `/api/collaterals/:id` | Get collateral details | Marketing |
| PATCH | `/api/collaterals/:id` | Update collateral | Marketing |
| DELETE | `/api/collaterals/:id` | Remove collateral | Marketing |

### POST `/api/collaterals`

**Request:**
```json
{
  "title": "Fintech Cloud Migration Deck",
  "url": "https://sharepoint.com/sites/marketing/fintech-deck.pptx",
  "scope_type": "segment",
  "scope_id": "uuid"
}
```

---

## 11. Export Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/exports/companies` | Export companies as CSV | Authenticated (per access) |
| GET | `/api/exports/contacts` | Export contacts as CSV | Authenticated (per access) |

**Query params:** Same filters as list endpoints. Response: `Content-Type: text/csv` with `Content-Disposition: attachment`.

---

## 12. Researcher Workbench Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/workbench/segments` | My assigned segments | Researcher, Approver |
| GET | `/api/workbench/segments/:id/companies` | Approved companies in segment | Researcher, Approver |
| GET | `/api/workbench/my-uploads` | My uploaded companies + contacts | Researcher, Approver |

### GET `/api/workbench/my-uploads`

**Query params:**
```
?entity_type=company       (company or contact)
&status=pending
&sort_by=created_at
&cursor=uuid
&limit=20
```

---

## 13. Audit Log Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/api/audit-logs` | List audit logs (global) | Admin |
| GET | `/api/audit-logs/entity/:type/:id` | Activity timeline for a record | Authenticated |

### GET `/api/audit-logs/entity/:type/:id`

Returns the activity timeline for a specific record (company, contact, segment, etc.).

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "approve",
      "actor": { "id": "uuid", "name": "John Approver" },
      "details": { "previous_status": "pending", "new_status": "approved" },
      "created_at": "2026-02-14T14:20:00Z"
    },
    {
      "id": "uuid",
      "action": "create",
      "actor": { "id": "uuid", "name": "Jane Researcher" },
      "details": { "source": "csv_upload", "batch_id": "uuid" },
      "created_at": "2026-02-14T10:00:00Z"
    }
  ]
}
```

---

## 14. Health Check

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | Health check (DB connectivity) | No |

**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2026-02-14T10:30:00Z"
}
```

---

## 15. Endpoint Summary by Module

| Module | Endpoints | Primary Roles |
|--------|-----------|---------------|
| Auth | 5 | All |
| Users | 6 | Admin |
| Segments | 6 | All (read), Segment Owner (write) |
| Companies | 6 | All (read), Researcher/Approver (write), Approver/SDR (approve) |
| Contacts | 7 | All (read), Researcher/Approver (write), Approver/SDR (approve) |
| CSV Uploads | 6 | Researcher, Approver |
| Assignments | 3 | Segment Owner, Approver |
| Approval Queue | 2 | Approver, SDR (grant) |
| Collaterals | 5 | Marketing |
| Exports | 2 | Authenticated |
| Workbench | 3 | Researcher, Approver |
| Audit Logs | 2 | Admin (global), Authenticated (per-entity) |
| Health | 1 | Public |
| **Total** | **54** | |
