<!-- generated-by: gsd-doc-writer -->
# Technology Stack

**Analysis Date: 2026-05-13**

## Languages

**Primary:**
- TypeScript v5.9.3 - Frontend (React/Vite)
- Python v3.12+ - Backend (FastAPI)

**Secondary:**
- HTML/CSS - Frontend UI styling (Tailwind CSS v4)
- SQL - Backend database queries and migrations

## Runtime

**Environment:**
- Node.js - Frontend development & build process
- Python 3.12+ - Backend application execution

**Package Manager:**
- npm (Frontend)
  - Lockfile: `package-lock.json`
- pip/uv (Backend)
  - Lockfile: `uv.lock`

## Frameworks

**Core:**
- React v19.2.4 - Frontend UI framework (using React 19 features)
- FastAPI v0.100.0 - Backend API framework
- Tailwind CSS v4.2.1 - CSS framework (using `@tailwindcss/vite` for engine-native performance)
- SQLAlchemy v2.0.0 - Backend ORM

**State Management & Data Fetching:**
- TanStack Query (React Query) v5.100.9 - Server state management and data fetching
- Zustand v5.0.13 - Client-side state management

**Testing:**
- Playwright v1.59.1 - Frontend E2E testing
- Vitest v4.1.5 - Frontend unit and component testing
- Pytest v7.4.0 - Backend unit and integration testing

**Build/Dev:**
- Vite v7.3.1 - Frontend build tool and dev server
- Vite PWA Plugin v1.3.0 - Progressive Web App support
- Uvicorn v0.23.0 - Backend ASGI server
- Alembic v1.12.0 - Backend database migrations

## Key Dependencies

**Critical:**
- Axios v1.16.0 - HTTP client
- Framer Motion v12.38.0 - Animation library
- Lucide React v1.14.0 - Icon library
- Radix UI v1.1.0+ - Unstyled, accessible UI primitives
- Shadcn UI - Reusable component system (Latest primitives)
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
- Frontend: `vite.config.ts`, `tsconfig.json`, `index.css` (Tailwind v4 config)
- Backend: `pyproject.toml`

## Platform Requirements

**Development:**
- Node.js (for frontend Vite server)
- Python 3.12+ (for backend FastAPI server)
- SQLite or PostgreSQL (for backend database)

**Production:**
- Standard web server / static host for compiled frontend assets
- PWA support for mobile/desktop installation
- ASGI compatible server (Uvicorn) for backend API
- PostgreSQL for backend persistent storage

---

*Stack analysis: 2026-05-13*
