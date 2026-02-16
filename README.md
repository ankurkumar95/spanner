# Spanner CRM

A comprehensive CRM system for managing business operations, built with FastAPI, PostgreSQL, and React.

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Production-grade relational database
- **SQLAlchemy** - Async ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client

## Project Structure

```
spanner/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── core/             # Configuration, database
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Custom middleware
│   │   ├── utils/            # Utility functions
│   │   ├── jobs/             # Background jobs
│   │   └── main.py           # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities, API client
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
├── .env
└── README.md
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- (Optional) Node.js 20+ and Python 3.12+ for local development

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration (defaults are suitable for development)

### Running with Docker

Start all services:
```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on port 5432
- **Backend API** on port 8000
- **Frontend** on port 5173

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Database Migrations

Run migrations inside the backend container:
```bash
docker-compose exec backend alembic upgrade head
```

Create a new migration:
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### Development Workflow

The Docker setup includes hot-reload for both frontend and backend:
- Backend changes are auto-reloaded by uvicorn
- Frontend changes trigger Vite's HMR

To view logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

To stop services:
```bash
docker-compose down
```

To stop and remove volumes (WARNING: deletes database data):
```bash
docker-compose down -v
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

### Backend Tests
```bash
docker-compose exec backend pytest
```

### Frontend Tests
```bash
docker-compose exec frontend npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved
