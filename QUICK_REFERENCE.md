# Spanner CRM - Quick Reference Card

## Start/Stop Commands

```bash
# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database!)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

## Logs & Debugging

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Service-specific logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Container Access

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL CLI
docker-compose exec postgres psql -U spanner -d spanner

# Run Python in backend
docker-compose exec backend python

# Run Node in frontend
docker-compose exec frontend node
```

## Database Operations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Add users table"

# View migration history
docker-compose exec backend alembic history

# View current revision
docker-compose exec backend alembic current

# Database backup
docker-compose exec postgres pg_dump -U spanner spanner > backup.sql

# Database restore
docker-compose exec -T postgres psql -U spanner spanner < backup.sql

# Drop and recreate database (WARNING: deletes all data)
docker-compose exec postgres psql -U spanner -c "DROP DATABASE spanner;"
docker-compose exec postgres psql -U spanner -c "CREATE DATABASE spanner;"
```

## Backend Operations

```bash
# Run tests
docker-compose exec backend pytest

# Run tests with coverage
docker-compose exec backend pytest --cov=app

# Run specific test file
docker-compose exec backend pytest tests/test_users.py

# Run linter
docker-compose exec backend flake8 app/

# Format code (if black is installed)
docker-compose exec backend black app/

# Install new Python package
docker-compose exec backend pip install package-name
# Then add to requirements.txt and rebuild
```

## Frontend Operations

```bash
# Install new npm package
docker-compose exec frontend npm install package-name

# Build for production
docker-compose exec frontend npm run build

# Run linter
docker-compose exec frontend npm run lint

# Preview production build
docker-compose exec frontend npm run preview
```

## Health Checks

```bash
# Check backend health
curl http://localhost:8000/api/health

# Check database connection
docker-compose exec postgres pg_isready -U spanner

# Check all containers status
docker-compose ps

# Check service resources
docker stats
```

## API Testing

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test with JSON data (POST)
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'

# Test with auth token
curl http://localhost:8000/api/v1/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Pretty print JSON response
curl http://localhost:8000/api/health | jq
```

## File Locations

### Backend
- **Main app**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/main.py`
- **Config**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/core/config.py`
- **Models**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/models/`
- **Schemas**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/schemas/`
- **Routers**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/routers/`
- **Services**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/app/services/`
- **Migrations**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/alembic/versions/`

### Frontend
- **Entry point**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/main.tsx`
- **Router config**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/App.tsx`
- **Pages**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/pages/`
- **Components**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/components/` (to be created)
- **API client**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/lib/api.ts`
- **Utilities**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/src/lib/utils.ts`

### Configuration
- **Environment**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/.env`
- **Docker Compose**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/docker-compose.yml`
- **Backend Dockerfile**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/backend/Dockerfile`
- **Frontend Dockerfile**: `/Users/ankur/Documents/projects/coding_with_claude/spanner/frontend/Dockerfile`

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/api/health |
| API v1 Root | http://localhost:8000/api/v1 |

## Common Issues

### Port Already in Use
```bash
# Find process using port 5173
lsof -i :5173
# Kill process
kill -9 PID

# Or change port in docker-compose.yml
```

### Database Connection Failed
```bash
# Check postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild container
docker-compose up --build backend

# Check if postgres is healthy
docker-compose ps postgres
```

### Frontend Won't Start
```bash
# Check logs
docker-compose logs frontend

# Clear node_modules and reinstall
docker-compose down
docker volume rm spanner_node_modules
docker-compose up --build frontend
```

### Changes Not Reflecting
```bash
# For backend - uvicorn should auto-reload
# Check if volume mount is working:
docker-compose exec backend ls -la /app

# For frontend - Vite HMR should work
# Check if volume mount is working:
docker-compose exec frontend ls -la /app/src

# If still not working, rebuild:
docker-compose up --build
```

## Environment Variables

Quick reference for `.env` file:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://spanner:spanner_dev_pwd@postgres:5432/spanner

# Security
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_V1_PREFIX=/api/v1
ENVIRONMENT=development
```

## Git Workflow

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "feat: add user authentication"

# Push
git push origin main

# Create feature branch
git checkout -b feature/user-management

# Merge branch
git checkout main
git merge feature/user-management
```

## Python Code Snippets

### Create a new model
```python
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Create a Pydantic schema
```python
# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True
```

### Create an API endpoint
```python
# backend/app/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()

@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    # Your logic here
    return {"users": []}
```

## TypeScript Code Snippets

### Create an API hook
```typescript
// frontend/src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
}
```

### Create a component
```typescript
// frontend/src/components/UserList.tsx
import { useUsers } from '@/hooks/useUsers';

export function UserList() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

## Keyboard Shortcuts (VS Code)

| Shortcut | Action |
|----------|--------|
| Cmd+P | Quick file open |
| Cmd+Shift+F | Search in project |
| Cmd+B | Toggle sidebar |
| Cmd+` | Toggle terminal |
| Cmd+Shift+P | Command palette |

## Production Deployment Checklist

- [ ] Change SECRET_KEY
- [ ] Use strong database password
- [ ] Update CORS_ORIGINS
- [ ] Set ENVIRONMENT=production
- [ ] Disable debug mode
- [ ] Set up HTTPS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up logging
- [ ] Add rate limiting
- [ ] Security scan
- [ ] Load testing
- [ ] Update documentation

---

**For detailed documentation, see:**
- `README.md` - General project information
- `SETUP.md` - Detailed setup and troubleshooting
- `INFRASTRUCTURE_SUMMARY.md` - Complete infrastructure overview
