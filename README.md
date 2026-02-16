# Spanner CRM

Account-Based Marketing (ABM) CRM platform for managing segments, companies, contacts, and the approval/assignment pipeline.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, JWT |
| Frontend | React 19, TypeScript, Vite, TailwindCSS, TanStack Query v5, Zustand, React Router v7 |
| Database | PostgreSQL 16 |
| Infra | Docker Compose (3 services) |

## Quick Start

```bash
# Start everything
docker compose up --build

# Or start in background
docker compose up -d --build
```

Services:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432 (user: `spanner`, db: `spanner`)

Default login: `admin@spanner.local` / `admin123`

## Project Structure

```
spanner/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, database, security, deps
│   │   ├── models/        # SQLAlchemy models (14 tables)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   └── main.py
│   ├── alembic/           # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout + shared components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── lib/           # API client, utils
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env
```

## Common Commands

```bash
# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild a single service
docker compose up -d --build backend

# Database shell
docker compose exec postgres psql -U spanner -d spanner

# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Backend shell
docker compose exec backend bash

# Database backup/restore
docker compose exec postgres pg_dump -U spanner spanner > backup.sql
docker compose exec -T postgres psql -U spanner spanner < backup.sql
```

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/v1/auth` | Login, register, refresh, forgot/reset password |
| `/api/v1/users` | User CRUD, roles, deactivation |
| `/api/v1/segments` | Segment CRUD, offerings, archive, stats |
| `/api/v1/companies` | Company CRUD, approve/reject, duplicate flagging |
| `/api/v1/contacts` | Contact CRUD, approve, assign, bulk-assign |
| `/api/v1/uploads` | CSV upload (companies + contacts), batch management |
| `/api/v1/assignments` | SDR assignment CRUD, bulk operations |
| `/api/v1/marketing` | Marketing collateral CRUD |
| `/api/v1/notifications` | Notification list, read, bulk read |
| `/api/v1/exports` | CSV export (companies, contacts, segments) |
| `/api/v1/audit` | Audit log listing, entity history |

## Environment Variables

Key variables in `.env`:

```bash
DATABASE_URL=postgresql+asyncpg://spanner:spanner_dev_pwd@postgres:5432/spanner
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

## Troubleshooting

**Port conflicts:** `lsof -i :5173` / `lsof -i :8000` to find conflicting processes.

**Backend won't start:** Check `docker compose logs backend` — usually a migration or import error.

**Frontend can't reach backend:** Verify proxy in `vite.config.ts` and that backend is healthy: `curl http://localhost:8000/api/health`

**Database issues:** `docker compose restart postgres`, then check with `docker compose exec postgres pg_isready -U spanner`

## License

Proprietary - All rights reserved
