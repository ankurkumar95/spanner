# Jules Agent 0 — Foundation

> **Run this FIRST, alone.** All other agents depend on this branch being merged to main.
> **Branch name:** `foundation`

---

## Task

Set up the complete project skeleton, Docker infrastructure, database with ALL 15 tables, authentication system, RBAC middleware, audit logging service, and seed data. After this agent completes, the app should start with `docker compose up`, and you should be able to login via API.

---

## Stitch Design References

Reference these UI mockup files when building frontend components. Match the visual style, layout, colors, and component structure from these designs:

| Screen | Design File | Screenshot |
|--------|------------|------------|
| Login Page | `designs/html/01-login-screen.html` | `designs/screenshots/01-login-screen.png` |
| Forgot Password | `designs/html/02-forgot-password.html` | `designs/screenshots/02-forgot-password.png` |
| Reset Password | `designs/html/03-reset-password.html` | `designs/screenshots/03-reset-password.png` |

Open the HTML files in a browser to see the exact design. Replicate the visual style: colors, spacing, typography, and component layout.

---

## What to Build

### 1. Project Structure

Create this exact directory structure:

```
spanner/
├── docker-compose.yml
├── .env.example
├── .env                    (copy of .env.example with dev defaults)
├── .gitignore
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── __init__.py
│       ├── main.py              (FastAPI app, CORS, middleware registration, router includes)
│       ├── config.py            (Settings from env vars using pydantic-settings)
│       ├── database.py          (async SQLAlchemy engine + session)
│       ├── models/
│       │   ├── __init__.py      (import all models for Alembic)
│       │   ├── user.py          (User, Role, UserRole, Permission, RolePermission)
│       │   ├── segment.py       (Segment, Offering, SegmentOffering)
│       │   ├── company.py       (Company)
│       │   ├── contact.py       (Contact)
│       │   ├── assignment.py    (Assignment)
│       │   ├── upload.py        (UploadBatch, UploadError)
│       │   ├── audit.py         (AuditLog)
│       │   └── collateral.py    (MarketingCollateral)
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── auth.py          (LoginRequest, TokenResponse, UserResponse)
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── auth.py          (login, refresh, forgot-password, reset-password, logout)
│       │   └── health.py        (health check)
│       ├── services/
│       │   ├── __init__.py
│       │   ├── auth_service.py  (login, token generation, password hashing)
│       │   └── audit_service.py (log action — used by all other agents)
│       ├── middleware/
│       │   ├── __init__.py
│       │   ├── auth.py          (JWT extraction + validation, attach user to request)
│       │   └── rbac.py          (require_permission decorator, role-permission check)
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── security.py      (bcrypt hash/verify, JWT create/decode)
│       │   ├── pagination.py    (cursor-based pagination helper)
│       │   └── normalizers.py   (trim, normalize_url, normalize_email, normalize_company_name)
│       └── jobs/
│           └── __init__.py
├── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.tsx
        ├── App.tsx              (placeholder with react-router setup)
        ├── api/
        │   └── client.ts        (Axios instance with JWT interceptor, refresh logic)
        ├── contexts/
        │   └── AuthContext.tsx   (token storage, user state, login/logout functions)
        ├── hooks/
        │   └── useAuth.ts
        ├── types/
        │   ├── api.ts           (API response envelope types)
        │   ├── models.ts        (all entity TypeScript interfaces)
        │   └── auth.ts
        ├── pages/
        │   └── Login.tsx        (working login page — email + password form)
        └── components/
            └── ProtectedRoute.tsx
└── designs/                    (UI mockup designs — reference only, not deployed)
    ├── html/                   (20 interactive HTML screen mockups)
    └── screenshots/            (20 PNG preview images)
```

### 2. Docker Compose

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    container_name: spanner-db
    environment:
      POSTGRES_DB: ${DB_NAME:-spanner}
      POSTGRES_USER: ${DB_USER:-spanner}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-spanner}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - spanner_net

  api:
    build: ./backend
    container_name: spanner-api
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-spanner}:${DB_PASSWORD}@db:5432/${DB_NAME:-spanner}
      SECRET_KEY: ${SECRET_KEY}
      ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES:-30}
      REFRESH_TOKEN_EXPIRE_DAYS: ${REFRESH_TOKEN_EXPIRE_DAYS:-7}
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:3000}
      MAX_UPLOAD_SIZE_MB: ${MAX_UPLOAD_SIZE_MB:-10}
    volumes:
      - upload_temp:/tmp/uploads
    networks:
      - spanner_net

  frontend:
    build: ./frontend
    container_name: spanner-frontend
    environment:
      REACT_APP_API_URL: /api
    networks:
      - spanner_net

  nginx:
    image: nginx:1.25-alpine
    container_name: spanner-nginx
    depends_on:
      - api
      - frontend
    ports:
      - "${HOST_PORT:-80}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - spanner_net

volumes:
  postgres_data:
  upload_temp:

networks:
  spanner_net:
    driver: bridge
```

### 3. Database — ALL 15 Tables

Create ALL tables in a single Alembic migration. Use UUID PKs (gen_random_uuid). All timestamps WITH TIME ZONE. Here are the tables:

**users:** id(UUID PK), email(VARCHAR 255 UNIQUE NOT NULL), name(VARCHAR 255 NOT NULL), password_hash(VARCHAR 255 NOT NULL), is_active(BOOLEAN default true), created_at(TIMESTAMPTZ default now), updated_at(TIMESTAMPTZ default now)

**roles:** id(SERIAL PK), name(VARCHAR 50 UNIQUE NOT NULL), description(VARCHAR 255)

**user_roles:** user_id(UUID FK→users PK), role_id(INT FK→roles PK)

**permissions:** id(SERIAL PK), module(VARCHAR 100 NOT NULL), action(VARCHAR 100 NOT NULL), description(VARCHAR 255). UNIQUE(module, action).

**role_permissions:** role_id(INT FK→roles PK), permission_id(INT FK→permissions PK)

**segments:** id(UUID PK), name(VARCHAR 255 UNIQUE NOT NULL), description(TEXT), status(VARCHAR 20 NOT NULL default 'active' CHECK active/archived), created_by(UUID FK→users NOT NULL), created_at, updated_at

**offerings:** id(UUID PK), name(VARCHAR 255 UNIQUE NOT NULL), description(TEXT), status(VARCHAR 20 NOT NULL default 'active' CHECK active/inactive), created_at, updated_at

**segment_offerings:** segment_id(UUID FK→segments PK), offering_id(UUID FK→offerings PK)

**companies:** id(UUID PK), name(VARCHAR 500 NOT NULL), website(VARCHAR 500), phone(VARCHAR 50), description(TEXT), linkedin_url(VARCHAR 500), industry(VARCHAR 200), sub_industry(VARCHAR 200), address_street(VARCHAR 500), address_city(VARCHAR 200), address_state(VARCHAR 200), address_country(VARCHAR 200), address_zip(VARCHAR 50), founded_year(INT), revenue_range(VARCHAR 200), employee_size_range(VARCHAR 200), segment_id(UUID FK→segments NOT NULL), status(VARCHAR 20 NOT NULL default 'pending' CHECK pending/approved/rejected), rejection_reason(TEXT), is_duplicate(BOOLEAN default false), is_active(BOOLEAN default true), batch_id(UUID FK→upload_batches), created_by(UUID FK→users NOT NULL), created_at, updated_at

**contacts:** id(UUID PK), first_name(VARCHAR 200 NOT NULL), last_name(VARCHAR 200 NOT NULL), mobile_phone(VARCHAR 50), job_title(VARCHAR 500), company_id(UUID FK→companies NOT NULL), email(VARCHAR 255 NOT NULL), direct_phone(VARCHAR 50), email_2(VARCHAR 255), email_active_status(VARCHAR 100), lead_source(VARCHAR 200), management_level(VARCHAR 200), address_street(VARCHAR 500), address_city(VARCHAR 200), address_state(VARCHAR 200), address_country(VARCHAR 200), address_zip(VARCHAR 50), primary_timezone(VARCHAR 100), linkedin_url(VARCHAR 500), linkedin_summary(TEXT), data_requester_details(VARCHAR 500), segment_id(UUID FK→segments NOT NULL), status(VARCHAR 30 NOT NULL default 'uploaded' CHECK uploaded/approved/assigned_to_sdr/meeting_scheduled), assigned_sdr_id(UUID FK→users), is_duplicate(BOOLEAN default false), is_active(BOOLEAN default true), batch_id(UUID FK→upload_batches), created_by(UUID FK→users NOT NULL), created_at, updated_at

**assignments:** id(UUID PK), entity_type(VARCHAR 50 NOT NULL CHECK segment/company/contact), entity_id(UUID NOT NULL), assigned_to(UUID FK→users NOT NULL), assigned_by(UUID FK→users NOT NULL), is_active(BOOLEAN default true), created_at, updated_at. UNIQUE(entity_type, entity_id, assigned_to).

**upload_batches:** id(UUID PK), entity_type(VARCHAR 20 NOT NULL CHECK company/contact), file_name(VARCHAR 500 NOT NULL), file_size_bytes(INT NOT NULL), total_rows(INT default 0), valid_rows(INT default 0), invalid_rows(INT default 0), status(VARCHAR 20 NOT NULL default 'processing' CHECK processing/completed/failed), uploader_id(UUID FK→users NOT NULL), created_at

**upload_errors:** id(UUID PK), batch_id(UUID FK→upload_batches NOT NULL), row_number(INT NOT NULL), column_name(VARCHAR 200 NOT NULL), value(TEXT), error_message(VARCHAR 500 NOT NULL), is_corrected(BOOLEAN default false), created_at

**audit_logs:** id(UUID PK), actor_id(UUID FK→users NOT NULL), action(VARCHAR 100 NOT NULL), entity_type(VARCHAR 50 NOT NULL), entity_id(UUID NOT NULL), details(JSONB), created_at. Index on (entity_type, entity_id) and actor_id and created_at.

**marketing_collaterals:** id(UUID PK), title(VARCHAR 500 NOT NULL), url(VARCHAR 1000 NOT NULL), scope_type(VARCHAR 50 NOT NULL CHECK segment/offering/lead), scope_id(UUID NOT NULL), created_by(UUID FK→users NOT NULL), created_at, updated_at

### 4. Indexes to Create
- companies: (name, website, segment_id), segment_id, status, created_by, (is_duplicate, is_active), created_at, batch_id
- contacts: (email, company_id), company_id, segment_id, status, assigned_sdr_id, created_by, (is_duplicate, is_active), created_at, batch_id
- assignments: (entity_type, entity_id), assigned_to
- upload_errors: batch_id
- audit_logs: (entity_type, entity_id), actor_id, created_at

### 5. Seed Data (in migration or startup script)

**Roles:** Admin, Segment Owner, Researcher, Approver, SDR, Marketing

**Permissions (23 rows):**
segments:create, segments:archive, segments:read, companies:create, companies:read, companies:edit, companies:approve, companies:reject, companies:upload_csv, contacts:create, contacts:read, contacts:edit, contacts:approve, contacts:assign, contacts:upload_csv, contacts:schedule_meeting, assignments:create, collaterals:manage, exports:companies, exports:contacts, audit:read_global, uploads:read, users:manage

**Role-Permission Mapping:**
- Admin: users:manage, segments:read, companies:read, contacts:read, exports:companies, exports:contacts, audit:read_global
- Segment Owner: segments:create, segments:archive, segments:read, companies:read, contacts:read, assignments:create, exports:companies, exports:contacts
- Researcher: segments:read, companies:create, companies:read, companies:edit, companies:upload_csv, contacts:create, contacts:read, contacts:edit, contacts:upload_csv, uploads:read, exports:companies, exports:contacts
- Approver: segments:read, companies:create, companies:read, companies:edit, companies:approve, companies:reject, companies:upload_csv, contacts:create, contacts:read, contacts:edit, contacts:approve, contacts:assign, contacts:upload_csv, assignments:create, uploads:read, exports:companies, exports:contacts
- SDR: segments:read, companies:read, contacts:read, companies:approve, companies:reject, contacts:approve, contacts:schedule_meeting, exports:companies, exports:contacts
- Marketing: segments:read, collaterals:manage

**Admin User:** email=admin@spanner.local, name=Admin User, password=password123 (bcrypt hashed), role=Admin, is_active=true

**Sample Users:**
- prashant@spanner.local (Segment Owner)
- jane@spanner.local (Researcher)
- bob@spanner.local (Approver)
- alice@spanner.local (SDR)
- maria@spanner.local (Marketing)

All passwords: `password123`

### 6. Auth System

**Endpoints:**
```
POST /api/auth/login         — email + password → { access_token, refresh_token, user: { id, email, name, roles[] } }
POST /api/auth/refresh       — { refresh_token } → { access_token }
POST /api/auth/forgot-password — { email } → { reset_token } (return in response for now)
POST /api/auth/reset-password  — { token, new_password } → success
POST /api/auth/logout          — invalidate (just return 200 for now)
GET  /api/health               — { status: "healthy", database: "connected" } (no auth)
```

**JWT:** Access token = 30 min, Refresh token = 7 days. Payload: { sub: user_id, roles: [role_names] }
**Password:** bcrypt via passlib

### 7. RBAC Middleware

Create a `require_permission(module, action)` decorator:
1. Auth middleware extracts JWT, validates, loads user into `request.state.user`
2. RBAC decorator checks: user's roles → role_permissions → does any match (module, action)?
3. If yes: proceed. If no: 403 Forbidden.

### 8. Audit Service

Create `audit_service.log(db, actor_id, action, entity_type, entity_id, details=None)` that inserts into audit_logs. This will be called by all other agents.

### 9. Shared Utilities

- `utils/security.py` — hash_password, verify_password, create_access_token, create_refresh_token, decode_token
- `utils/pagination.py` — cursor_paginate(query, cursor, limit) → (results, next_cursor, total)
- `utils/normalizers.py` — normalize_string(trim), normalize_url, normalize_email, normalize_company_name

### 10. Frontend Foundation

- Working Login page (email + password → call /api/auth/login → store token → redirect)
- AuthContext (token management, user state, login/logout)
- Axios client with JWT interceptor (auto-attach token, auto-refresh on 401)
- ProtectedRoute component (redirect to login if no token)
- TypeScript interfaces for ALL entities (User, Role, Segment, Offering, Company, Contact, Assignment, UploadBatch, UploadError, AuditLog, Collateral)
- Placeholder App.tsx with react-router (routes will be added by other agents)

---

## Verification

After this agent completes:
1. `docker compose up` starts all 4 containers
2. `GET /api/health` returns healthy
3. `POST /api/auth/login` with admin@spanner.local / password123 returns tokens
4. JWT contains correct roles
5. All 15 tables exist in PostgreSQL
6. Login page works in browser at http://localhost
