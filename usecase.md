# Spanner CRM — Implementation Use Case (Claude Code Guide)

## Project Overview

Spanner is a centralized sales and marketing planning application built on the **Account-Based Marketing (ABM)** model. The core workflow is: **Segment creation → Company research → Company approval → Contact research → Contact approval → SDR outreach → Marketing collateral delivery.**

**Expected data volumes:** 10–20 segments, 100–1,000 companies, 1–20 contacts per company. Single-tenant (one organization).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI (API-first design) |
| Database | PostgreSQL (Docker container) |
| Frontend | React (separate app from API) |
| Auth | bcrypt password hashing, token-based (JWT) API auth |
| Infrastructure | Docker containers for all components |
| File Uploads | Multipart/form-data, max 10 MB, `.csv` only |

---

## Implementation Phases

### Phase 1 — Foundation

1. **Docker setup** — Compose file with PostgreSQL, FastAPI backend, React frontend containers.
2. **Database schema** — All tables, relationships, enums, indexes per the data model below.
3. **Authentication module** — Signup (admin-only), login, forgot/reset password, JWT token flow.
4. **User management module** — CRUD users, role assignment (multi-role), soft deactivation.
5. **RBAC engine** — Role-based access control with grant-based permissions (Drupal-inspired). Roles: Admin, Segment Owner, Researcher, Approver, SDR, Marketing.

### Phase 2 — Core Entities

6. **Segments module** — CRUD, offerings management (global master, many-to-many, auto-complete), archiving.
7. **Company module** — Entity, form creation, list view, detail views (popup + Jira-style side panel), status workflow (Pending → Approved / Rejected).
8. **Contact module** — Entity, form creation, list view, detail views, status pipeline (Uploaded → Approved → Assigned to SDR → Meeting Scheduled).

### Phase 3 — Bulk Operations & Workflows

9. **Company CSV upload** — Validation pipeline, partial import, error report, batch tracking.
10. **Contact CSV upload** — Same pipeline, linked to approved companies only.
11. **Error Correction module** — View failed rows, re-upload corrected CSV.
12. **Duplicate detection** — Scheduled job (configurable, default weekly), `is_duplicate` flag, no auto-delete.

### Phase 4 — Assignment & Approvals

13. **Assignment module** — Segment → Researcher/SDR, Company → Researcher, Contact → SDR. Flexible, grant-based.
14. **Approval Queue** — Pending companies (individual approve/reject), uploaded contacts (bulk approve, no rejection).
15. **Researcher Workbench** — My segments, approved companies for contact research, my uploads view.

### Phase 5 — Marketing & Polish

16. **Marketing Collateral module** — Link storage (SharePoint/share drive URLs), scoped to segment/offerings/lead.
17. **Audit logging** — Actor, action, entity, timestamp on all mutations. Activity timeline on detail views.
18. **CSV export** — All list views, scoped to user's data access.

### Future (Not in Scope Now)

- SDR Workbench (detailed specs TBD)
- Post-meeting outcomes (separate CRM)
- Microsoft Teams notifications
- Dashboard / KPIs
- Microsoft/Office 365 SSO

---

## Database Schema

### Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'segment_owner', 'researcher', 'approver', 'sdr', 'marketing');

-- Entity statuses
CREATE TYPE company_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE contact_status AS ENUM ('uploaded', 'approved', 'assigned_to_sdr', 'meeting_scheduled');
CREATE TYPE segment_status AS ENUM ('active', 'archived');
CREATE TYPE offering_status AS ENUM ('active', 'inactive');
CREATE TYPE user_status AS ENUM ('active', 'deactivated');
```

### Tables

```
users
├── id (PK, UUID)
├── email (unique, not null)
├── name (not null)
├── password_hash (not null)
├── status (user_status, default 'active')
├── created_at, updated_at

user_roles
├── id (PK)
├── user_id (FK → users)
├── role (user_role)
├── UNIQUE(user_id, role)

segments
├── id (PK, UUID)
├── name (unique, not null)
├── description (text, nullable)
├── status (segment_status, default 'active')
├── created_by (FK → users)
├── created_at, updated_at

offerings
├── id (PK, UUID)
├── name (unique, not null)
├── description (text, nullable)
├── status (offering_status, default 'active')
├── created_at, updated_at

segment_offerings (many-to-many)
├── segment_id (FK → segments)
├── offering_id (FK → offerings)
├── PRIMARY KEY (segment_id, offering_id)

companies
├── id (PK, UUID)
├── company_name (not null, max 500)
├── company_website (nullable, valid URL)
├── company_phone (nullable, max 50)
├── company_description (text, nullable, max 5000)
├── company_linkedin_url (nullable, valid URL)
├── company_industry (nullable, max 200)
├── company_sub_industry (nullable, max 200)
├── street (nullable, max 500)
├── city (nullable, max 200)
├── state_province (nullable, max 200)
├── country_region (nullable, max 200)
├── zip_postal_code (nullable, max 50)
├── founded_year (nullable, integer 1800–current year)
├── revenue_range (nullable, max 200)
├── employee_size_range (nullable, max 200)
├── segment_id (FK → segments, not null)
├── status (company_status, default 'pending')
├── rejection_reason (text, nullable — required when status = 'rejected')
├── is_duplicate (boolean, default false)
├── batch_id (nullable — set on CSV import)
├── created_by (FK → users)
├── created_at, updated_at
├── UNIQUE(company_name, company_website, segment_id)  -- dedup key

contacts
├── id (PK, UUID)
├── first_name (not null, max 200)
├── last_name (not null, max 200)
├── email (not null, valid email)
├── mobile_phone (nullable)
├── job_title (nullable, max 500)
├── direct_phone_number (nullable, max 50)
├── email_address_2 (nullable, valid email)
├── email_active_status (nullable, max 100)
├── lead_source_global (nullable, max 200)
├── management_level (nullable, max 200)
├── street (nullable, max 500)
├── city (nullable, max 200)
├── state_province (nullable, max 200)
├── country_region (nullable, max 200)
├── zip_postal_code (nullable, max 50)
├── primary_time_zone (nullable, max 100)
├── contact_linkedin_url (nullable, valid URL)
├── linkedin_summary (text, nullable, max 5000)
├── data_requester_details (nullable, max 500)
├── company_id (FK → companies, not null — company must be approved)
├── segment_id (FK → segments, derived from company)
├── status (contact_status, default 'uploaded')
├── assigned_sdr_id (FK → users, nullable)
├── is_duplicate (boolean, default false)
├── batch_id (nullable)
├── created_by (FK → users)
├── created_at, updated_at

assignments
├── id (PK, UUID)
├── entity_type ('segment', 'company', 'contact')
├── entity_id (UUID — polymorphic FK)
├── assigned_to (FK → users)
├── assigned_by (FK → users)
├── created_at

upload_batches
├── id (PK, UUID)
├── upload_type ('company', 'contact')
├── file_name (not null)
├── file_size_bytes (integer)
├── total_rows (integer)
├── valid_rows (integer)
├── invalid_rows (integer)
├── status ('processing', 'completed', 'failed')
├── error_report_url (nullable — path to downloadable error CSV)
├── uploaded_by (FK → users)
├── created_at

audit_logs
├── id (PK, UUID)
├── actor_id (FK → users)
├── action (string — 'create', 'update', 'approve', 'reject', 'assign', 'upload', etc.)
├── entity_type (string)
├── entity_id (UUID)
├── details (JSONB — old/new values, metadata)
├── created_at

role_grants (configurable approval/action permissions)
├── id (PK)
├── role (user_role)
├── action (string — 'approve_company', 'approve_contact', 'assign_company', etc.)
├── granted (boolean, default true)
```

---

## API Design

### Convention

- Base URL: `/api/v1`
- JSON request/response bodies
- JWT Bearer token auth on all protected routes
- Consistent error format: `{ "detail": "...", "errors": [...] }`
- Pagination: cursor-based for infinite scroll (`?cursor=<id>&limit=50`)

### Endpoints

```
AUTH
POST   /api/v1/auth/login              → { access_token, refresh_token }
POST   /api/v1/auth/refresh             → { access_token }
POST   /api/v1/auth/forgot-password     → sends reset email
POST   /api/v1/auth/reset-password      → resets password with token

USERS (Admin only)
GET    /api/v1/users                    → list, search, filter by role/status
POST   /api/v1/users                    → create user (admin assigns roles)
GET    /api/v1/users/:id                → user detail
PATCH  /api/v1/users/:id                → update user / change roles
PATCH  /api/v1/users/:id/deactivate     → soft deactivate

SEGMENTS
GET    /api/v1/segments                 → list (default: active only, toggle archived)
POST   /api/v1/segments                 → create segment with offerings
GET    /api/v1/segments/:id             → segment detail
PATCH  /api/v1/segments/:id             → update segment / offerings
PATCH  /api/v1/segments/:id/archive     → archive segment

OFFERINGS
GET    /api/v1/offerings                → list (for auto-complete)
POST   /api/v1/offerings                → create new offering (inline from segment edit)

COMPANIES
GET    /api/v1/companies                → list with filters (segment, status, researcher, date, duplicate toggle)
POST   /api/v1/companies                → create single company (form)
GET    /api/v1/companies/:id            → company detail + contacts + activity timeline
PATCH  /api/v1/companies/:id            → edit company fields
POST   /api/v1/companies/:id/approve    → approve (individual only)
POST   /api/v1/companies/:id/reject     → reject (requires rejection_reason)
POST   /api/v1/companies/upload         → CSV upload (multipart, returns batch_id)
GET    /api/v1/companies/export         → CSV export

CONTACTS
GET    /api/v1/contacts                 → list with filters (company, segment, status, SDR, date, duplicate toggle)
POST   /api/v1/contacts                 → create single contact (form, company must be approved)
GET    /api/v1/contacts/:id             → contact detail + activity timeline
PATCH  /api/v1/contacts/:id             → edit contact fields
POST   /api/v1/contacts/approve         → bulk approve (array of IDs)
POST   /api/v1/contacts/:id/assign-sdr  → assign SDR
POST   /api/v1/contacts/:id/schedule    → mark meeting scheduled
POST   /api/v1/contacts/upload          → CSV upload (multipart, returns batch_id)
GET    /api/v1/contacts/export          → CSV export

ASSIGNMENTS
POST   /api/v1/assignments              → create assignment { entity_type, entity_id, assigned_to }
GET    /api/v1/assignments/my            → current user's assignments

APPROVAL QUEUE
GET    /api/v1/approval-queue/companies → pending companies (filters: segment, researcher, date)
GET    /api/v1/approval-queue/contacts  → uploaded contacts (filters: segment, researcher, date)

UPLOAD BATCHES
GET    /api/v1/batches                  → list user's upload batches
GET    /api/v1/batches/:id              → batch detail + error report
GET    /api/v1/batches/:id/errors       → download error CSV
POST   /api/v1/batches/:id/reupload     → re-upload corrected CSV

RESEARCHER WORKBENCH
GET    /api/v1/workbench/segments       → my assigned segments
GET    /api/v1/workbench/companies      → approved companies in my segments
GET    /api/v1/workbench/uploads        → my uploads (filterable by status)

MARKETING COLLATERAL
GET    /api/v1/collateral               → list collateral links
POST   /api/v1/collateral               → add collateral link { url, scope_type, scope_id }
PATCH  /api/v1/collateral/:id           → edit link
DELETE /api/v1/collateral/:id           → remove link

AUDIT
GET    /api/v1/audit/:entity_type/:id   → activity timeline for entity
```

---

## Business Rules (Critical)

### Company Rules
1. **One company → one segment.** Same real-world company in two segments = two separate records.
2. **Dedup key:** `company_name + company_website` within the same segment only. Cross-segment duplicates are intentional and must NOT be flagged.
3. **Approval is individual only** — no bulk company approval.
4. **Rejection requires a reason** and is final — no re-submission allowed. Rejected records stay visible for reference.
5. **Status flow:** Pending → Approved OR Pending → Rejected. No other transitions.

### Contact Rules
1. **Contacts can only be created for approved companies.**
2. **Segment is derived from the company's segment** — never set directly.
3. **Dedup key:** `email + company_name` (recommended).
4. **Bulk approval allowed. No rejection for contacts.**
5. **Status flow:** Uploaded → Approved → Assigned to SDR → Meeting Scheduled.

### CSV Upload Rules
1. Validate all rows before any insert.
2. Partial import: valid rows imported, invalid rows go to Error Correction module.
3. Case-insensitive header matching. Extra columns ignored silently.
4. UTF-8 encoding only. Max 10 MB.
5. Empty or header-only files rejected.
6. Within-file duplicates are both imported; the scheduled dedup job handles them later.
7. Each upload gets a unique batch ID for tracking.
8. Error report: downloadable CSV with row number, column name, submitted value, error message.

### Assignment Rules
1. Segment → Researcher/Approver: assigned by Segment Owner or Approver.
2. Segment → SDR: assigned by Segment Owner.
3. Company → Researcher: assigned by Approver (company must be approved).
4. Contact → SDR: assigned by Approver (grant-based).
5. One entity can be assigned to multiple users.

### Access Control Rules
1. All users see the same list views. Role determines available actions, not visibility.
2. Approver is a senior researcher — has all researcher capabilities plus approval rights.
3. Who can approve is configurable via role grants.
4. One user can hold multiple roles.
5. Admin creates all user accounts — no public signup.

---

## UX Patterns

### List Views (All Entities)
- In-view search bar
- Relevant filters per entity (segment, status, date range, researcher, SDR, duplicate toggle)
- **Default:** hide duplicates (`is_duplicate`) and deactivated records; toggle to show
- Infinite scroll pagination
- CSV export button
- All users see same list; role determines action buttons

### Detail Views
- **Summary popup:** click any row → quick view overlay with key fields + status + action buttons
- **Side panel (Jira-style):** slide-out panel with full fields, status history, activity timeline, related entities, all actions (approve, reject, assign, edit)
- **Basic edit:** inline editable fields on the side panel

### Data Normalization (Apply on All Writes)
- Trim whitespace on all string fields
- Normalize company names (consistent casing)
- Standardize URLs (lowercase, strip trailing slashes)

---

## CSV Validation Pipeline

```
File Received
  ↓
Check file type (.csv only) & size (≤ 10 MB) & encoding (UTF-8)
  ↓ FAIL → Reject entire file with error
Validate headers (required columns present, case-insensitive match)
  ↓ FAIL → Reject entire file, list missing columns
Parse rows
  ↓
Per-row validation:
  - Required fields present and non-empty
  - Data type checks (email format, URL format, integer range)
  - Max length checks
  - Lookup checks (Segment Name exists & active, Company Name exists & approved)
  ↓
Split: valid rows → import queue, invalid rows → error report
  ↓
Import valid rows (status = Pending for companies, Uploaded for contacts)
  ↓
Generate error report CSV (row #, column, value, error message)
  ↓
Return: { batch_id, total_rows, imported, failed, error_report_url }
```

---

## Scheduled Jobs

| Job | Default Schedule | Behavior |
|---|---|---|
| Duplicate detection | Weekly (configurable) | Runs dedup key check, sets `is_duplicate = true` on matches. Never deletes. |

---

## Project Structure (Suggested)

```
spanner/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                  # DB migrations
│   ├── app/
│   │   ├── main.py               # FastAPI app entry
│   │   ├── config.py             # Settings, env vars
│   │   ├── database.py           # SQLAlchemy engine, session
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── segment.py
│   │   │   ├── offering.py
│   │   │   ├── company.py
│   │   │   ├── contact.py
│   │   │   ├── assignment.py
│   │   │   ├── batch.py
│   │   │   ├── audit.py
│   │   │   └── role_grant.py
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # API route handlers (one per module)
│   │   ├── services/             # Business logic layer
│   │   ├── middleware/           # Auth, RBAC, error handling
│   │   ├── utils/                # CSV parser, validators, normalization
│   │   └── jobs/                 # Scheduled jobs (dedup)
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── api/                  # API client, axios config
│   │   ├── auth/                 # Auth context, guards, login/reset pages
│   │   ├── components/           # Shared components (list view, side panel, popup, filters)
│   │   ├── modules/
│   │   │   ├── users/
│   │   │   ├── segments/
│   │   │   ├── companies/
│   │   │   ├── contacts/
│   │   │   ├── approvals/
│   │   │   ├── assignments/
│   │   │   ├── workbench/
│   │   │   ├── collateral/
│   │   │   └── uploads/
│   │   ├── hooks/                # Shared hooks (useInfiniteScroll, useFilters, etc.)
│   │   └── utils/
│   └── public/
└── docs/
    ├── architecture.md
    ├── database-erd.mermaid
    ├── process-flows.mermaid
    └── api-design.md
```

---

## Implementation Notes for Claude Code

1. **Start with Docker Compose** — get PostgreSQL, backend, and frontend containers running first.
2. **Database first** — create all models and run migrations before building any API routes.
3. **Build API layer with tests** — each router should have corresponding service logic and test coverage.
4. **RBAC middleware** — implement the grant-based permission system early; every endpoint depends on it.
5. **CSV pipeline is complex** — build as a standalone service with clear separation: parse → validate → stage → import → report.
6. **Frontend shared components first** — list view table, side panel, summary popup, filter bar, infinite scroll hook. Then build module-specific pages on top.
7. **Audit logging** — implement as middleware/decorator so it's automatic on all write operations.
8. **No delete functionality** in Phase 1 — only soft deactivation for users.
9. **No in-app notifications** in Phase 1 — users check queues manually.
10. **All string fields:** trim whitespace, normalize URLs, consistent casing on company names at the service layer.