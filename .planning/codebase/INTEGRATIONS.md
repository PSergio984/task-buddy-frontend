# External Integrations

**Analysis Date:** [YYYY-MM-DD]

## APIs & External Services

**Error Tracking:**
- Sentry - Error tracking and performance monitoring in the backend
  - SDK/Client: `sentry-sdk`
  - Auth: `SENTRY_DSN`

## Data Storage

**Databases:**
- PostgreSQL / SQLite
  - Connection: `DATABASE_URL`
  - Client: `asyncpg` / `databases[sqlite]` / `SQLAlchemy` ORM

**File Storage:**
- Local filesystem only

**Caching:**
- None detected (in-memory caching for some config via `lru_cache`)

## Authentication & Identity

**Auth Provider:**
- Custom
  - Implementation: JWT (JSON Web Tokens) managed by the backend using `python-jose` and hashed with `passlib[argon2]`. Frontend stores and transmits tokens via `Authorization` header (`Bearer`).

## Monitoring & Observability

**Error Tracking:**
- Sentry
  - Configured in backend `app/main.py` with environment isolation (Dev vs Prod).

**Logs:**
- Standard Python logging configuration (`app/logging_conf.py`) integrated with FastAPI and Uvicorn.
- Request tracing via `asgi-correlation-id`.

## CI/CD & Deployment

**Hosting:**
- Not strictly defined in application config, though `VITE_API_BASE_URL` allows flexible frontend deployment. Docker configuration (`Dockerfile`, `docker-compose.yml`) is available in the backend repository.

**CI Pipeline:**
- GitHub Actions detected (`.github/workflows/` for backend scans like `apisec-scan.yml`, `mayhem-for-api.yml`, and `datadog-synthetics.yml` for frontend).

## Environment Configuration

**Required env vars:**
- `SECRET_KEY` (Backend JWT signing, required in production)
- `DATABASE_URL` (Backend database connection)
- `SENTRY_DSN` (Backend error tracking)
- `VITE_API_BASE_URL` (Frontend API endpoint)

**Secrets location:**
- `.env` files locally (ignored in version control). Production secrets should be injected via environment variables.

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: [YYYY-MM-DD]*