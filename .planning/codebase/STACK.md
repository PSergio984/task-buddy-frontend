# Technology Stack

**Analysis Date:** [YYYY-MM-DD]

## Languages

**Primary:**
- TypeScript v5.9.3 - Frontend (React/Vite)
- Python v3.9+ - Backend (FastAPI)

**Secondary:**
- HTML/CSS - Frontend UI styling
- SQL - Backend database queries and migrations

## Runtime

**Environment:**
- Node.js - Frontend development & build process
- Python 3.9+ - Backend application execution

**Package Manager:**
- npm (Frontend)
  - Lockfile: present
- pip/uv (Backend)
  - Lockfile: present (`uv.lock`)

## Frameworks

**Core:**
- React v19.2.4 - Frontend UI framework
- FastAPI v0.100.0 - Backend API framework
- TailwindCSS v4.2.1 - Frontend CSS framework
- SQLAlchemy v2.0.0 - Backend ORM

**Testing:**
- Playwright v1.59.1 - Frontend E2E testing
- Pytest v7.4.0 - Backend unit and integration testing

**Build/Dev:**
- Vite v7.3.1 - Frontend build tool and dev server
- Uvicorn v0.23.0 - Backend ASGI server
- Alembic v1.12.0 - Backend database migrations

## Key Dependencies

**Critical:**
- Zustand v5.0.13 - Frontend state management
- Axios v1.16.0 - Frontend HTTP client
- Pydantic v2.0.0 - Backend data validation and settings
- Passlib[argon2] v1.7.4 - Backend password hashing
- python-jose[cryptography] v3.3.0 - Backend JWT authentication

**Infrastructure:**
- asyncpg v0.28.0 - Backend async PostgreSQL driver
- slowapi v0.1.9 - Backend rate limiting
- Sentry-sdk v1.30.0 - Error tracking and monitoring

## Configuration

**Environment:**
- Frontend: Managed via Vite `.env` variables (e.g., `VITE_API_BASE_URL`)
- Backend: Managed via Pydantic `BaseSettings` (`.env` file)
- Key configs required: `DATABASE_URL`, `SECRET_KEY`, `SENTRY_DSN`, `VITE_API_BASE_URL`

**Build:**
- Frontend: `vite.config.ts`, `tsconfig.json`
- Backend: `pyproject.toml`

## Platform Requirements

**Development:**
- Node.js (for frontend Vite server)
- Python 3.9+ (for backend FastAPI server)
- SQLite or PostgreSQL (for backend database)

**Production:**
- Standard web server / static host for compiled frontend assets
- ASGI compatible server (Uvicorn) for backend API
- PostgreSQL for backend persistent storage

---

*Stack analysis: [YYYY-MM-DD]*