#!/bin/bash

echo "=========================================="
echo "Spanner CRM - Setup Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if files exist
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ - MISSING"
    fi
}

echo "Checking Docker Configuration..."
check_file "docker-compose.yml"
check_file ".env"
check_file ".env.example"
check_file ".gitignore"
echo ""

echo "Checking Backend Structure..."
check_file "backend/Dockerfile"
check_file "backend/.dockerignore"
check_file "backend/requirements.txt"
check_file "backend/alembic.ini"
check_file "backend/alembic/env.py"
check_file "backend/alembic/script.py.mako"
check_file "backend/app/main.py"
check_file "backend/app/core/config.py"
check_file "backend/app/core/database.py"
check_dir "backend/app/models"
check_dir "backend/app/schemas"
check_dir "backend/app/routers"
check_dir "backend/app/services"
check_dir "backend/app/middleware"
check_dir "backend/app/utils"
check_dir "backend/app/jobs"
echo ""

echo "Checking Frontend Structure..."
check_file "frontend/Dockerfile"
check_file "frontend/.dockerignore"
check_file "frontend/package.json"
check_file "frontend/vite.config.ts"
check_file "frontend/tsconfig.json"
check_file "frontend/tsconfig.node.json"
check_file "frontend/tailwind.config.js"
check_file "frontend/postcss.config.js"
check_file "frontend/index.html"
check_file "frontend/src/main.tsx"
check_file "frontend/src/App.tsx"
check_file "frontend/src/index.css"
check_file "frontend/src/pages/Home.tsx"
check_file "frontend/src/pages/NotFound.tsx"
check_file "frontend/src/lib/api.ts"
check_file "frontend/src/lib/utils.ts"
echo ""

echo "Checking Documentation..."
check_file "README.md"
check_file "SETUP.md"
echo ""

echo "=========================================="
echo "Docker Services Status"
echo "=========================================="
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose: ${GREEN}Installed${NC}"
    echo ""
    echo "To start the application:"
    echo -e "${YELLOW}  docker-compose up --build${NC}"
    echo ""
    echo "After starting, access:"
    echo "  Frontend:  http://localhost:5173"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
else
    echo -e "${RED}Docker Compose: Not installed${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
fi

echo ""
echo "=========================================="
echo "Setup verification complete!"
echo "=========================================="
