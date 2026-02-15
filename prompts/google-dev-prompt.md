# Spanner — Full-Stack Development Prompt for Google Firebase Studio

> Paste this entire prompt into Firebase Studio (or Gemini in IDX).  
> Attach all files from `docs/` folder + `requirements.md` as context.  
> This prompt tells the tool EXACTLY what to build — every table, every endpoint, every screen, every validation rule.

---

## PROMPT START

Build a complete, working full-stack web application called **Spanner**. I am attaching the full technical documentation. Use the attached files as source of truth. This prompt summarizes every concrete thing you must build.

---

## PART 1: PROJECT SETUP

### Tech Stack (non-negotiable)
- **Backend:** Python 3.12 + FastAPI (async)
- **Database:** PostgreSQL 16
- **ORM:** SQLAlchemy 2.0 (async) + Alembic for migrations
- **Frontend:** React 18 + TypeScript
- **Auth:** JWT (access token 30min + refresh token 7 days), bcrypt password hashing (passlib)
- **Infrastructure:** Docker Compose with 4 containers: `spanner-db`, `spanner-api`, `spanner-frontend`, `spanner-nginx`

### Project Structure

```
spanner/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/          (SQLAlchemy ORM)
│       ├── schemas/         (Pydantic request/response)
│       ├── routers/         (FastAPI route handlers)
│       ├── services/        (business logic)
│       ├── middleware/       (auth, rbac, audit)
│       ├── utils/           (validators, normalizers, pagination)
│       └── jobs/            (scheduler, dedup)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── App.tsx
        ├── api/             (Axios client + per-module API calls)
        ├── contexts/        (AuthContext)
        ├── hooks/           (useAuth, useInfiniteScroll, useFilters)
        ├── pages/           (per-module page components)
        ├── components/      (shared: ListView, DetailPanel, FilterBar, CSVUploader, etc.)
        └── types/           (TypeScript interfaces)
```

### Docker Compose — 4 Services
1. **spanner-db** — `postgres:16-alpine`, volume `postgres_data`, healthcheck with `pg_isready`
2. **spanner-api** — Python FastAPI on port 8000, depends on db healthy, runs `alembic upgrade head` on startup
3. **spanner-frontend** — React on port 3000
4. **spanner-nginx** — `nginx:1.25-alpine` on host port 80, proxies `/api/*` to backend, `/*` to frontend

Network: `spanner_net` (bridge). Only nginx exposes port to host.

### Environment Variables
```
DB_NAME=spanner
DB_USER=spanner
DB_PASSWORD=<required>
SECRET_KEY=<required>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000
MAX_UPLOAD_SIZE_MB=10
```

---

## PART 2: DATABASE — 15 Tables

Create these exact tables. Use UUID primary keys (gen_random_uuid). All timestamps WITH TIME ZONE.

### Table 1: `users`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### Table 2: `roles`
| Column | Type | Constraint |
|--------|------|-----------|
| id | SERIAL | PK |
| name | VARCHAR(50) | UNIQUE, NOT NULL |
| description | VARCHAR(255) | |

Seed 6 rows: Admin, Segment Owner, Researcher, Approver, SDR, Marketing.

### Table 3: `user_roles`
| Column | Type | Constraint |
|--------|------|-----------|
| user_id | UUID | FK → users.id, composite PK |
| role_id | INT | FK → roles.id, composite PK |

### Table 4: `permissions`
| Column | Type | Constraint |
|--------|------|-----------|
| id | SERIAL | PK |
| module | VARCHAR(100) | NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| description | VARCHAR(255) | |

UNIQUE(module, action). Seed rows for: segments:create, segments:archive, segments:read, companies:create, companies:read, companies:edit, companies:approve, companies:reject, companies:upload_csv, contacts:create, contacts:read, contacts:edit, contacts:approve, contacts:assign, contacts:upload_csv, contacts:schedule_meeting, assignments:create, collaterals:manage, exports:companies, exports:contacts, audit:read_global, uploads:read, users:manage.

### Table 5: `role_permissions`
| Column | Type | Constraint |
|--------|------|-----------|
| role_id | INT | FK → roles.id, composite PK |
| permission_id | INT | FK → permissions.id, composite PK |

Seed the role-permission mappings per the matrix in the attached requirements (Section 14).

### Table 6: `segments`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| name | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | |
| status | VARCHAR(20) | NOT NULL, default 'active', CHECK (active, archived) |
| created_by | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### Table 7: `offerings`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| name | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | |
| status | VARCHAR(20) | NOT NULL, default 'active', CHECK (active, inactive) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### Table 8: `segment_offerings`
| Column | Type | Constraint |
|--------|------|-----------|
| segment_id | UUID | FK → segments.id, composite PK |
| offering_id | UUID | FK → offerings.id, composite PK |

### Table 9: `companies`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| name | VARCHAR(500) | NOT NULL |
| website | VARCHAR(500) | |
| phone | VARCHAR(50) | |
| description | TEXT | |
| linkedin_url | VARCHAR(500) | |
| industry | VARCHAR(200) | |
| sub_industry | VARCHAR(200) | |
| address_street | VARCHAR(500) | |
| address_city | VARCHAR(200) | |
| address_state | VARCHAR(200) | |
| address_country | VARCHAR(200) | |
| address_zip | VARCHAR(50) | |
| founded_year | INT | CHECK (1800 to current_year) |
| revenue_range | VARCHAR(200) | |
| employee_size_range | VARCHAR(200) | |
| segment_id | UUID | FK → segments.id, NOT NULL |
| status | VARCHAR(20) | NOT NULL, default 'pending', CHECK (pending, approved, rejected) |
| rejection_reason | TEXT | |
| is_duplicate | BOOLEAN | NOT NULL, default false |
| is_active | BOOLEAN | NOT NULL, default true |
| batch_id | UUID | FK → upload_batches.id |
| created_by | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

Index: (name, website, segment_id) for dedup. Index: segment_id, status, created_by, is_duplicate+is_active.

### Table 10: `contacts`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| first_name | VARCHAR(200) | NOT NULL |
| last_name | VARCHAR(200) | NOT NULL |
| mobile_phone | VARCHAR(50) | |
| job_title | VARCHAR(500) | |
| company_id | UUID | FK → companies.id, NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| direct_phone | VARCHAR(50) | |
| email_2 | VARCHAR(255) | |
| email_active_status | VARCHAR(100) | |
| lead_source | VARCHAR(200) | |
| management_level | VARCHAR(200) | |
| address_street | VARCHAR(500) | |
| address_city | VARCHAR(200) | |
| address_state | VARCHAR(200) | |
| address_country | VARCHAR(200) | |
| address_zip | VARCHAR(50) | |
| primary_timezone | VARCHAR(100) | |
| linkedin_url | VARCHAR(500) | |
| linkedin_summary | TEXT | |
| data_requester_details | VARCHAR(500) | |
| segment_id | UUID | FK → segments.id, NOT NULL (derived from company) |
| status | VARCHAR(30) | NOT NULL, default 'uploaded', CHECK (uploaded, approved, assigned_to_sdr, meeting_scheduled) |
| assigned_sdr_id | UUID | FK → users.id |
| is_duplicate | BOOLEAN | NOT NULL, default false |
| is_active | BOOLEAN | NOT NULL, default true |
| batch_id | UUID | FK → upload_batches.id |
| created_by | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

Index: (email, company_id) for dedup. Index: company_id, segment_id, status, assigned_sdr_id, is_duplicate+is_active.

### Table 11: `assignments`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| entity_type | VARCHAR(50) | NOT NULL, CHECK (segment, company, contact) |
| entity_id | UUID | NOT NULL |
| assigned_to | UUID | FK → users.id, NOT NULL |
| assigned_by | UUID | FK → users.id, NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

UNIQUE(entity_type, entity_id, assigned_to).

### Table 12: `upload_batches`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| entity_type | VARCHAR(20) | NOT NULL, CHECK (company, contact) |
| file_name | VARCHAR(500) | NOT NULL |
| file_size_bytes | INT | NOT NULL |
| total_rows | INT | NOT NULL, default 0 |
| valid_rows | INT | NOT NULL, default 0 |
| invalid_rows | INT | NOT NULL, default 0 |
| status | VARCHAR(20) | NOT NULL, default 'processing', CHECK (processing, completed, failed) |
| uploader_id | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |

### Table 13: `upload_errors`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| batch_id | UUID | FK → upload_batches.id, NOT NULL |
| row_number | INT | NOT NULL |
| column_name | VARCHAR(200) | NOT NULL |
| value | TEXT | |
| error_message | VARCHAR(500) | NOT NULL |
| is_corrected | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |

### Table 14: `audit_logs`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| actor_id | UUID | FK → users.id, NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NOT NULL |
| details | JSONB | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |

Append-only. No updates or deletes. Index: (entity_type, entity_id), actor_id, created_at.

### Table 15: `marketing_collaterals`
| Column | Type | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| title | VARCHAR(500) | NOT NULL |
| url | VARCHAR(1000) | NOT NULL |
| scope_type | VARCHAR(50) | NOT NULL, CHECK (segment, offering, lead) |
| scope_id | UUID | NOT NULL |
| created_by | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### Seed Data (in initial migration)
1. Insert 6 roles
2. Insert ~23 permissions
3. Insert role-permission mappings
4. Create admin user: email=admin@spanner.local, password=admin123 (bcrypt hashed), role=Admin

---

## PART 3: BACKEND API — 54 Endpoints

Build all of these. JSON request/response. JWT auth on all except login/forgot-password/health.

### Auth (5 endpoints)
```
POST   /api/auth/login              — email + password → access_token + refresh_token + user info
POST   /api/auth/refresh            — refresh_token → new access_token
POST   /api/auth/forgot-password    — email → send reset token (for now, just return token in response)
POST   /api/auth/reset-password     — token + new_password → success
POST   /api/auth/logout             — invalidate token
```

### Users — Admin only (6 endpoints)
```
GET    /api/users                   — list users, search, filter by role/status, cursor pagination
POST   /api/users                   — create user (name, email, password, role_ids)
GET    /api/users/:id               — get user details
PATCH  /api/users/:id               — update user details/roles
POST   /api/users/:id/deactivate    — soft deactivate (is_active=false)
POST   /api/users/:id/activate      — re-activate
```

### Segments (6 endpoints)
```
GET    /api/segments                — list (all users), filter by status, search, pagination
POST   /api/segments                — create (Segment Owner), body: name, description, offering_ids[], new_offerings[]
GET    /api/segments/:id            — detail
PATCH  /api/segments/:id            — update (Segment Owner)
POST   /api/segments/:id/archive    — archive
POST   /api/segments/:id/activate   — re-activate
```

### Companies (6 endpoints)
```
GET    /api/companies               — list (all users*), filters: segment_id, status, created_by, is_duplicate, is_active, search, pagination
POST   /api/companies               — create single (Researcher, Approver), all company fields + segment_id
GET    /api/companies/:id           — detail with related contacts
PATCH  /api/companies/:id           — basic edit (Researcher, Approver)
POST   /api/companies/:id/approve   — approve (Approver, SDR grant). Individual only.
POST   /api/companies/:id/reject    — reject (Approver, SDR grant). Body: rejection_reason (required). Permanent.
```

### Contacts (7 endpoints)
```
GET    /api/contacts                — list, filters: company_id, segment_id, status, assigned_sdr_id, is_duplicate, is_active, search, pagination
POST   /api/contacts                — create single (Researcher, Approver), all contact fields + company_id. segment_id derived from company.
GET    /api/contacts/:id            — detail
PATCH  /api/contacts/:id            — basic edit
POST   /api/contacts/approve        — BULK approve. Body: contact_ids[]. No rejection.
POST   /api/contacts/:id/assign     — assign to SDR. Body: sdr_id
POST   /api/contacts/:id/schedule-meeting — mark meeting scheduled (SDR)
```

### CSV Uploads (6 endpoints)
```
POST   /api/uploads/companies       — multipart file upload. Validate + partial import. Return batch summary.
POST   /api/uploads/contacts        — multipart file upload. Same pattern.
GET    /api/uploads/batches         — list batches for current user, pagination
GET    /api/uploads/batches/:id     — batch detail
GET    /api/uploads/batches/:id/errors          — list errors for batch
GET    /api/uploads/batches/:id/errors/download  — download error report as CSV
```

### Assignments (3 endpoints)
```
POST   /api/assignments             — create (entity_type, entity_id, assigned_to). Validate role.
GET    /api/assignments             — list, filter by entity_type, entity_id, assigned_to
DELETE /api/assignments/:id         — remove assignment
```

### Approval Queue (2 endpoints)
```
GET    /api/approval-queue/companies — companies with status=pending, filters: segment, researcher, date
GET    /api/approval-queue/contacts  — contacts with status=uploaded, filters: segment, company, researcher, date
```

### Marketing Collateral (5 endpoints)
```
GET    /api/collaterals             — list, filter by scope_type, search
POST   /api/collaterals             — create (title, url, scope_type, scope_id)
GET    /api/collaterals/:id         — detail
PATCH  /api/collaterals/:id         — update
DELETE /api/collaterals/:id         — delete
```

### Exports (2 endpoints)
```
GET    /api/exports/companies       — CSV download, same filters as company list
GET    /api/exports/contacts        — CSV download, same filters as contact list
```

### Researcher Workbench (3 endpoints)
```
GET    /api/workbench/segments      — segments assigned to current user
GET    /api/workbench/segments/:id/companies — approved companies in segment
GET    /api/workbench/my-uploads    — uploads by current user, filter by entity_type, status
```

### Audit Logs (2 endpoints)
```
GET    /api/audit-logs              — global list (Admin only)
GET    /api/audit-logs/entity/:type/:id — activity timeline for one record (any authenticated user)
```

### Health (1 endpoint)
```
GET    /api/health                  — returns { status: "healthy", database: "connected" }. No auth.
```

### API Conventions (apply to ALL endpoints)
- **Pagination:** cursor-based: `?cursor=<uuid>&limit=20`
- **Filtering:** query params: `?status=approved&segment_id=<uuid>`
- **Search:** `?search=<term>` (server-side, case-insensitive across relevant text fields)
- **Sorting:** `?sort_by=created_at&sort_order=desc`
- **Response envelope:** `{ data: ..., meta: { total, limit, next_cursor, timestamp } }`
- **Error envelope:** `{ error: { code, message, details[] } }`
- **Status codes:** 200 (success), 201 (created), 400 (validation), 401 (unauth), 403 (forbidden), 404 (not found), 409 (conflict/state error), 413 (file too large), 422 (CSV validation errors), 500 (internal)

---

## PART 4: CSV PROCESSING ENGINE

### Company CSV — 16 columns
Headers (case-insensitive): Company Name*, Company Website, Company Phone, Company Description, Company Linkedin Url, Company Industry, Company Sub-Industry, Company Address 1: Street 1, Company Address 1: City, Company Address 1: State/Province, Company Address 1: Country/Region, Company Address 1: ZIP/Postal Code, Founded Year, Company Revenue Range, Company Employee Size Range, Segment Name*

### Contact CSV — 20 columns
Headers (case-insensitive): First Name*, Last Name*, Mobile Phone, Job Title, Company Name*, Email*, Direct Phone Number, Email Address 2, Email Active Status, Lead Source Global, Management Level, Contact Address 1: Street 1, Contact Address 1: City, Contact Address 1: State/Province, Contact Address 1: Country/Region, Contact Address 1: ZIP/Postal Code, Primary Time Zone, Contact Linkedin Url, LinkedIn Summary, Data Requester Details

### Validation Pipeline (both CSVs)
1. Check file extension (.csv only), encoding (UTF-8), size (max 10MB), not empty
2. Parse headers case-insensitively. Reject if required columns missing. Ignore extra columns.
3. Validate every row: required fields non-empty, email format (RFC 5322), URL format, max lengths, integer ranges
4. Lookup validation: Segment Name must match active segment (company CSV), Company Name must match approved company (contact CSV)
5. **Partial import:** valid rows inserted, invalid rows stored in upload_errors
6. Return batch summary with error report download link

### Data Normalization (apply on every insert/update)
- Trim whitespace on all strings
- Normalize company names (title case)
- Normalize URLs (lowercase scheme+host, strip trailing slash)
- Normalize emails (lowercase)

### Dedup Scheduled Job
- **Frequency:** Weekly (Sunday 2 AM UTC, configurable)
- **Company dedup key:** LOWER(name) + LOWER(website) + segment_id. Keep oldest, flag rest is_duplicate=true. **Cross-segment duplicates are intentional — do NOT flag.**
- **Contact dedup key:** LOWER(email) + company_id. Keep oldest, flag rest.
- Write audit log entry with counts.

---

## PART 5: RBAC MIDDLEWARE

### Implementation
1. **Auth middleware:** Extract JWT from Authorization header. Decode. Attach user to request context.
2. **RBAC middleware/decorator:** Check user's roles → role_permissions → match required module:action. Return 403 if no match.
3. Use `@require_permission("module", "action")` decorator on every route handler.

### Default Role-Permission Matrix
| Permission | Admin | Seg.Owner | Researcher | Approver | SDR | Marketing |
|-----------|:-----:|:---------:|:----------:|:--------:|:---:|:---------:|
| users:manage | x | | | | | |
| segments:create | | x | | | | |
| segments:archive | | x | | | | |
| segments:read | x | x | x | x | x | x |
| companies:create | | | x | x | | |
| companies:read | x | x | x | x | x | |
| companies:edit | | | x | x | | |
| companies:approve | | | | x | x | |
| companies:reject | | | | x | x | |
| companies:upload_csv | | | x | x | | |
| contacts:create | | | x | x | | |
| contacts:read | x | x | x | x | x | |
| contacts:edit | | | x | x | | |
| contacts:approve | | | | x | x | |
| contacts:assign | | | | x | | |
| contacts:upload_csv | | | x | x | | |
| contacts:schedule_meeting | | | | | x | |
| assignments:create | | x | | x | | |
| collaterals:manage | | | | | | x |
| exports:companies | x | x | x | x | x | |
| exports:contacts | x | x | x | x | x | |
| uploads:read | | | x | x | | |

---

## PART 6: FRONTEND — Every Screen

Build these screens using React 18 + TypeScript. Modern, clean SaaS design (linear.app / Notion aesthetic). Left sidebar + top header layout.

### Shared Components (build first, reuse everywhere)
1. **AppShell** — left sidebar (nav items change per role) + top header (app name "Spanner", user name, role badge, logout)
2. **ListView** — reusable: table with infinite scroll, search bar, filter bar, CSV export button, empty state
3. **FilterBar** — dropdowns, date pickers, search, "Show duplicates" toggle (off), "Show deactivated" toggle (off)
4. **DetailPanel** — Jira-style side panel, slides from right, ~45% width, scrollable. Sections: Fields, Status, Timeline, Actions.
5. **SummaryPopup** — quick overlay on row click (key fields + status + "View Details" button)
6. **ActivityTimeline** — vertical timeline (actor, action, timestamp, details). Used in every DetailPanel.
7. **StatusBadge** — color-coded pill. Colors: Pending=amber, Approved=green, Rejected=red, Uploaded=blue, Assigned to SDR=indigo, Meeting Scheduled=purple, Active=green, Archived=gray, Duplicate=orange-outline.
8. **CSVUploader** — drag-and-drop zone, file type/size validation, upload progress, result display
9. **ProtectedRoute** — checks auth + role before rendering

### Pages

**Auth pages (3):**
- Login — centered card, email + password, "Forgot password" link
- Forgot password — email input, submit
- Reset password — new password + confirm

**User Management — Admin only (2):**
- User list — table (Name, Email, Roles, Status, Created At), search, filters, Create User button
- Create/Edit user — form: Name, Email, Password, Roles multi-select, Deactivate button (edit mode)

**Segments (2):**
- Segment list — table/cards (Name, Offerings tags, Status, Created By, Date), filter active/archived, search
- Create/Edit segment form — Name, Description, Offerings auto-complete tag input

**Companies (2):**
- Company list — table (Name, Segment, Status badge, Industry, Created By, Date), full filter bar, infinite scroll, CSV export
- Create company form — all 16 fields, Segment dropdown

**Contacts (2):**
- Contact list — table (Name, Email, Company, Segment, Status badge, SDR, Date), full filter bar, infinite scroll, CSV export
- Create contact form — all 20 fields, Company dropdown (approved only)

**CSV Upload (1):**
- Upload page — two tabs (Company CSV / Contact CSV), drag-drop, progress, result with error report link

**Approval Queue (1):**
- Two tabs: Pending Companies (individual approve/reject per row) + Uploaded Contacts (checkbox bulk approve)

**Researcher Workbench (2):**
- Dashboard — My Segments cards + My Uploads summary
- Segment drill-down — approved companies table, per-company actions (Add Contact, Upload CSV), contacts list

**Marketing Collateral (1):**
- List + Add/Edit form (Title, URL, Scope Type, Scope reference)

**Detail views (built as side panels, not separate pages):**
- Segment detail panel — fields, offerings, assigned users, timeline, actions (Edit, Archive, Assign)
- Company detail panel — all fields (editable), status history, contacts list, timeline, actions (Approve, Reject modal, Assign)
- Contact detail panel — all fields (editable), status pipeline stepper (Uploaded → Approved → Assigned → Meeting), company info, timeline, actions (Approve, Assign SDR, Schedule Meeting)

**Modals:**
- Company rejection modal — textarea (mandatory reason), warning "permanent, no re-submission"
- Assignment modal — role-filtered user dropdown, multi-select
- Error correction view — table of failed rows per batch, re-upload button

### Sidebar Navigation per Role
| Role | Sidebar Items |
|------|--------------|
| Admin | Dashboard, User Management, Segments, Companies, Contacts, Approval Queue |
| Segment Owner | Segments, Companies, Contacts |
| Researcher | Workbench, Segments, Companies, Contacts, Upload CSV |
| Approver | Workbench, Segments, Companies, Contacts, Approval Queue, Upload CSV |
| SDR | Segments, Companies, Contacts, Approval Queue |
| Marketing | Segments, Marketing Collateral |

---

## PART 7: BUSINESS RULES — CRITICAL (do not skip any of these)

1. **Sign up is admin-only.** No public registration. Admin creates all users.
2. **Company → Segment is one-to-one.** Each company record belongs to ONE segment. Same company in two segments = two records. Each has independent approval status.
3. **Company dedup key = name + website WITHIN same segment.** Cross-segment duplicates are intentional. Do NOT flag them.
4. **Company approval is individual only.** No bulk approve button for companies.
5. **Company rejection requires mandatory reason.** No re-submission. Rejected records stay visible.
6. **Contact approval allows bulk.** No rejection for contacts.
7. **Contact segment is derived from company.** When creating a contact, auto-set segment_id from the company's segment.
8. **All list views show same data to all users.** Role determines available action buttons, NOT data visibility.
9. **Duplicates and deactivated records hidden by default** in all list views. Toggle to show.
10. **No in-app notifications.** Users manually check their queues.
11. **No edit module.** Only basic inline edit on detail side panel.
12. **No delete** in initial phase.
13. **Audit everything:** creates, approvals, rejections, assignments, edits, uploads, dedup job runs.
14. **CSV partial import:** Valid rows go in. Invalid rows go to upload_errors. Both counts returned.
15. **Error Correction** applies only to failed/invalid rows (never imported), not to successfully imported records.

---

## PART 8: SAMPLE DATA

After building, seed the database with sample data so the app works immediately:

**Users:**
- admin@spanner.local (Admin)
- prashant@spanner.local (Segment Owner)
- jane@spanner.local (Researcher)
- bob@spanner.local (Approver)
- alice@spanner.local (SDR)
- maria@spanner.local (Marketing)

All passwords: `password123`

**Segments:** "Enterprise Fintech APAC", "Mid-Market Healthcare US", "Startup SaaS Europe"
**Offerings:** "Cloud Migration", "Data Analytics Platform", "Managed Security", "DevOps Consulting"
**Companies:** 5 companies across segments with mix of Pending/Approved/Rejected statuses
**Contacts:** 8-10 contacts across companies with mix of statuses
**Assignments:** Researchers and SDRs assigned to segments

---

## FINAL INSTRUCTION

Build the ENTIRE application — backend, frontend, database, Docker setup — in one go. Every table, every endpoint, every screen, every validation rule listed above must be implemented. Do not skip anything. Do not use placeholder/mock implementations. Make it fully functional end-to-end.

## PROMPT END
