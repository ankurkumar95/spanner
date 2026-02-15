# Spanner — System Architecture

**Document Version:** 1.0  
**Last Updated:** 2026-02-14  
**Source:** `requirements.md` v3.1

---

## 1. Technology Stack

| Layer | Technology | Version (Recommended) | Notes |
|-------|-----------|----------------------|-------|
| **Backend** | Python + FastAPI | Python 3.12, FastAPI 0.110+ | API-first, async support |
| **ORM** | SQLAlchemy + Alembic | SQLAlchemy 2.0, Alembic 1.13+ | Async ORM, migration management |
| **Database** | PostgreSQL | 16.x | Separate Docker container |
| **Frontend** | React | 18.x | SPA, communicates via REST API |
| **HTTP Client** | Axios or Fetch API | — | Frontend → Backend |
| **Auth** | JWT (access + refresh tokens) | python-jose / PyJWT | Token-based API auth |
| **Password Hashing** | bcrypt | passlib[bcrypt] | Secure password storage |
| **CSV Processing** | Python csv / pandas | stdlib or pandas 2.x | Validation + partial import |
| **Task Scheduling** | APScheduler or Celery | — | Dedup scheduled job |
| **Containerization** | Docker + Docker Compose | Docker 25+, Compose v2 | All components containerized |
| **Reverse Proxy** | Nginx | 1.25+ | Route frontend/API, serve static |

---

## 2. Container Diagram

High-level view of all Docker containers and their interactions.

```mermaid
graph TB
    subgraph docker [Docker Environment]
        subgraph nginx_container [Nginx Reverse Proxy]
            Nginx["Nginx :80/:443"]
        end

        subgraph frontend_container [Frontend Container]
            ReactApp["React SPA :3000"]
        end

        subgraph backend_container [Backend Container]
            FastAPI["FastAPI :8000"]
        end

        subgraph db_container [Database Container]
            PostgreSQL["PostgreSQL :5432"]
        end
    end

    Browser["Browser Client"] -->|"HTTP/HTTPS"| Nginx
    Nginx -->|"/api/* proxy_pass"| FastAPI
    Nginx -->|"/* static/SPA"| ReactApp
    FastAPI -->|"SQLAlchemy"| PostgreSQL
    ReactApp -->|"REST API calls"| Nginx
```

### Container Responsibilities

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| **nginx** | nginx:1.25-alpine | 80, 443 | Reverse proxy, route `/api/*` to backend, serve frontend |
| **frontend** | node:20-alpine (build) | 3000 (dev) | React SPA — UI layer |
| **backend** | python:3.12-slim | 8000 | FastAPI — REST API, business logic, CSV processing |
| **db** | postgres:16-alpine | 5432 | PostgreSQL — persistent data storage |

---

## 3. Component Diagram (Backend)

Internal structure of the FastAPI backend application.

```mermaid
graph TB
    subgraph api_layer [API Layer — FastAPI Routers]
        AuthRouter["Auth Router"]
        UserRouter["User Router"]
        SegmentRouter["Segment Router"]
        CompanyRouter["Company Router"]
        ContactRouter["Contact Router"]
        UploadRouter["Upload Router"]
        AssignmentRouter["Assignment Router"]
        ApprovalRouter["Approval Queue Router"]
        CollateralRouter["Collateral Router"]
        ExportRouter["Export Router"]
    end

    subgraph middleware [Middleware]
        AuthMiddleware["Auth Middleware — JWT validation"]
        RBACMiddleware["RBAC Middleware — role/permission check"]
        AuditMiddleware["Audit Middleware — log actions"]
    end

    subgraph service_layer [Service Layer]
        AuthService["Auth Service"]
        UserService["User Service"]
        SegmentService["Segment Service"]
        CompanyService["Company Service"]
        ContactService["Contact Service"]
        CSVService["CSV Processing Service"]
        AssignmentService["Assignment Service"]
        ApprovalService["Approval Service"]
        DedupService["Dedup Service"]
        AuditService["Audit Service"]
        ExportService["Export Service"]
    end

    subgraph data_layer [Data Layer — SQLAlchemy Models]
        Models["ORM Models"]
        Schemas["Pydantic Schemas"]
        Migrations["Alembic Migrations"]
    end

    subgraph scheduler [Background Jobs]
        DedupScheduler["Dedup Scheduler — weekly"]
    end

    api_layer --> middleware
    middleware --> service_layer
    service_layer --> data_layer
    DedupScheduler --> DedupService
    DedupService --> data_layer
    data_layer --> DB[("PostgreSQL")]
```

---

## 4. Component Diagram (Frontend)

Internal structure of the React frontend application.

```mermaid
graph TB
    subgraph pages [Pages]
        LoginPage["Login Page"]
        DashboardPage["Dashboard"]
        SegmentListPage["Segment List"]
        CompanyListPage["Company List"]
        ContactListPage["Contact List"]
        ApprovalQueuePage["Approval Queue"]
        ResearcherWorkbenchPage["Researcher Workbench"]
        UserManagementPage["User Management"]
        CollateralPage["Marketing Collateral"]
    end

    subgraph shared_components [Shared Components]
        ListView["ListView — infinite scroll, filters, search, export"]
        DetailPanel["Detail Side Panel — Jira-style"]
        SummaryPopup["Summary Popup"]
        CSVUploader["CSV Upload Component"]
        FilterBar["Filter Bar — active/deactivated/duplicate toggles"]
    end

    subgraph state [State Management]
        AuthState["Auth Context — token, user, role"]
        APIClient["API Client — Axios with interceptors"]
    end

    pages --> shared_components
    pages --> state
    APIClient -->|"REST"| BackendAPI["FastAPI Backend"]
```

---

## 5. Network Topology

```mermaid
graph LR
    subgraph external [External]
        Client["Browser"]
    end

    subgraph docker_network [Docker Network — spanner_net]
        Nginx["nginx :80"]
        API["api :8000"]
        DB["db :5432"]
        FE["frontend :3000"]
    end

    Client -->|":80/:443"| Nginx
    Nginx -->|"internal :8000"| API
    Nginx -->|"internal :3000"| FE
    API -->|"internal :5432"| DB
```

- Only **Nginx** exposes ports to the host
- Backend, frontend, and database communicate on an **internal Docker network**
- PostgreSQL is **not exposed** to the host (access via backend only)

---

## 6. Security Architecture

### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Browser
    participant Nginx
    participant API as FastAPI
    participant DB as PostgreSQL

    Client->>Nginx: POST /api/auth/login (email, password)
    Nginx->>API: proxy
    API->>DB: Lookup user by email
    DB-->>API: User record
    API->>API: Verify bcrypt hash
    API->>API: Generate JWT (access + refresh)
    API-->>Nginx: 200 OK + tokens
    Nginx-->>Client: tokens

    Note over Client: Store tokens (httpOnly cookie or memory)

    Client->>Nginx: GET /api/companies (Authorization: Bearer token)
    Nginx->>API: proxy
    API->>API: Validate JWT (Auth Middleware)
    API->>API: Check permissions (RBAC Middleware)
    API->>DB: Query companies
    DB-->>API: Results
    API-->>Client: 200 OK + data
```

### 6.2 Security Measures

| Area | Approach |
|------|----------|
| **Password storage** | bcrypt via passlib; min 12 rounds |
| **Token format** | JWT (access: 30 min, refresh: 7 days) |
| **Token storage** | httpOnly cookie (preferred) or in-memory |
| **RBAC enforcement** | Middleware checks role + permission before every request |
| **Admin-only signup** | `/api/users` POST restricted to Admin role |
| **Input validation** | Pydantic schemas on all endpoints |
| **CORS** | Restrict origins to frontend domain |
| **File upload** | Max 10MB, `.csv` only, UTF-8 validation |
| **SQL injection** | ORM (SQLAlchemy) — parameterized queries |
| **Rate limiting** | Optional — recommended on auth endpoints |

---

## 7. Data Flow Overview

```mermaid
graph LR
    subgraph input [Data Input]
        Form["Web Form"]
        CSV["CSV Upload"]
    end

    subgraph processing [Processing]
        Validate["Validation Engine"]
        Normalize["Data Normalization"]
        Import["Partial Import"]
    end

    subgraph storage [Storage]
        DB[("PostgreSQL")]
        Errors["Error Correction Module"]
    end

    subgraph output [Output]
        ListView["List Views"]
        DetailView["Detail Panel"]
        ExportCSV["CSV Export"]
        AuditLog["Audit Trail"]
    end

    Form --> Normalize
    CSV --> Validate
    Validate -->|"valid rows"| Normalize
    Validate -->|"invalid rows"| Errors
    Normalize --> Import
    Import --> DB
    DB --> ListView
    DB --> DetailView
    DB --> ExportCSV
    DB --> AuditLog
    Errors -->|"re-upload corrected"| Validate
```

---

## 8. Deployment Considerations

| Concern | Approach |
|---------|----------|
| **Environment config** | `.env` file per environment; Docker Compose env_file |
| **Database migrations** | Alembic — run on container startup |
| **Logging** | Structured JSON logs; stdout (Docker captures) |
| **Health checks** | `/api/health` endpoint; Docker HEALTHCHECK |
| **Backups** | PostgreSQL pg_dump scheduled job (outside app scope) |
| **Scaling** | Single-tenant; single instance sufficient for expected volumes |
