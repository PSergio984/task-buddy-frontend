# Codebase Concerns

**Analysis Date:** [YYYY-MM-DD]

## Tech Debt

**Monolithic Frontend Components:**
- Issue: Pages and key components are growing very large (over 10-12KB each).
- Files: `src/pages/ProfilePage.tsx`, `src/pages/LandingPage.tsx`, `src/components/new-task-modal.tsx`
- Impact: Decreased readability, harder to maintain, and hinders reusability of internal UI logic.
- Fix approach: Refactor these files by extracting sections into smaller, dedicated atomic components.

## Known Bugs

**Test Database Polluting Workspace:**
- Symptoms: Running tests leaves a persistent SQLite file in the repository.
- Files: `task-buddy-backend/app/config.py` (TestConfig), `test.db`
- Trigger: Hardcoded database URL in `TestConfig` points to `sqlite:///./test.db`.
- Workaround: Change `TestConfig` to use an in-memory database like `sqlite:///:memory:` or ensure the file is cleaned up post-test.

## Security Considerations

**CORS & Allowed Origins Misconfiguration:**
- Risk: `ProdConfig` inherits `ALLOWED_ORIGINS` which defaults to `["http://localhost:3000", "http://localhost:5173"]`. Coupled with `allow_credentials=True` in `CORSMiddleware`, a misconfigured production environment might allow malicious local or wildcard cross-origin requests.
- Files: `task-buddy-backend/app/main.py`, `task-buddy-backend/app/config.py`
- Current mitigation: CORS is explicitly configured rather than fully open.
- Recommendations: Add strict validation in `ProdConfig` to reject `localhost` or wildcard origins.

## Performance Bottlenecks

**Synchronous Password Hashing in Async Routes:**
- Problem: Password verification and hashing operations block the asyncio event loop.
- Files: `task-buddy-backend/app/api/routers/user.py`, `task-buddy-backend/app/security.py`
- Cause: `pwd_context.hash` and `pwd_context.verify` are CPU-bound synchronous functions, but are awaited directly in the main thread (e.g., during `authenticate_user` or `/register`).
- Improvement path: Wrap password hashing/verification calls using `fastapi.concurrency.run_in_threadpool` or `asyncio.to_thread`.

## Fragile Areas

**Implicit Transaction Handling on Password Rehash:**
- Files: `task-buddy-backend/app/security.py`, `task-buddy-backend/app/api/routers/user.py`
- Why fragile: `authenticate_user` mutates `user.password` when a hash needs updating (lazy migration) but relies on the caller (the router) to invoke `await db.commit()`. If a router drops the commit or fails midway, the rehash is lost.
- Safe modification: Enforce a clear separation of concerns—either handle the database commit internally within the security layer or queue a background task specifically for rehashing.
- Test coverage: Missing comprehensive unit test coverage for edge cases in authentication.

## Scaling Limits

**In-Memory Rate Limiting:**
- Current capacity: Single-process memory store for rate limits.
- Limit: `slowapi` will not share rate limits across multiple ASGI worker processes or horizontal pods (e.g., in Kubernetes).
- Scaling path: Configure the `Limiter` in `app/limiter.py` to use a Redis storage backend.

## Dependencies at Risk

**python-jose:**
- Risk: The `python-jose` package is largely unmaintained and may lack timely updates for future cryptographic vulnerabilities.
- Impact: Risk of unpatched security flaws related to JWT encoding/decoding.
- Migration plan: Migrate to the actively maintained `PyJWT` library.

## Missing Critical Features

**JWT Revocation / Blacklisting:**
- Problem: The `/logout` endpoint instructs the client to clear the token but does not invalidate the token on the server.
- Blocks: Cannot forcefully terminate active sessions or revoke tokens if an account is compromised.

## Test Coverage Gaps

**Frontend Component & Unit Tests:**
- What's not tested: Isolated testing for UI components, custom hooks (`useApi.ts`), and state management. The frontend currently relies entirely on E2E tests (Playwright).
- Files: `src/components/**/*`, `src/hooks/**/*`, `src/pages/**/*`
- Risk: Edge-case rendering issues, complex hook behaviors, and non-happy-path logic might fail without detection. 
- Priority: High

---

*Concerns audit: [YYYY-MM-DD]*