# Proposal: Secure JWT Handling with HttpOnly Cookies

## 1. Problem Statement
The current implementation stores JWT tokens in `localStorage`, making them vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker injects a script into the frontend, they can steal the user's session token.

## 2. Proposed Solution
Migrate to **HttpOnly, Secure, SameSite=Strict** cookies for JWT storage. This ensures that the token is inaccessible to JavaScript and is only sent over HTTPS to the backend.

### Backend Changes (`task-buddy-backend`)
- **Login Endpoint (`POST /api/v1/users/token`)**:
  - Instead of (or in addition to) returning `access_token` in the JSON body, set a `Set-Cookie` header.
  - Cookie name: `access_token_cookie`
  - Attributes: `HttpOnly`, `Secure` (in prod), `SameSite=Strict`, `Path=/`, `Max-Age=...`.
- **Logout Endpoint (`POST /api/v1/users/logout`)**:
  - Set the cookie with an expired date and `Max-Age=0` to clear it.
- **Dependency (`get_current_user`)**:
  - Update to check the cookie if the `Authorization` header is missing.
  - FastAPI's `OAuth2PasswordBearer` can be adapted or complemented with a custom cookie extractor.
- **CORS Config**:
  - Ensure `allow_credentials=True` is set (it already is).

### Frontend Changes (`task-buddy-frontend`)
- **AuthContext**:
  - Remove `token` state and `localStorage.setItem(TOKEN_STORAGE_KEY, ...)` logic.
  - Axios will automatically include the cookie in requests if `withCredentials: true` is configured.
- **Axios Configuration**:
  - Set `axios.defaults.withCredentials = true` globally.
- **Auth Flow**:
  - Login/Register will no longer receive the token in the response body.
  - `refreshUser` will rely on the cookie being sent automatically.
  - Logout will call the backend to clear the cookie.

## 3. Implementation Plan
1. **Research Phase (Done)**: Identified current storage and backend routes.
2. **Backend implementation (Done)**:
   - Modified `app/api/routers/user.py` to set cookies.
   - Updated `app/security.py` and `app/dependencies.py` for cookie extraction.
3. **Frontend implementation (Done)**:
   - Updated `src/contexts/AuthContext.tsx` to remove manual token management.
   - Updated `src/hooks/useApi.ts` and other Axios calls to enable credentials.
4. **Verification (Done)**:
   - Verified type safety (`npm run typecheck`).
   - Verified logic via code review.
   - Ready for E2E validation.


## 4. Security Benefits
- **XSS Protection**: Tokens cannot be read by `document.cookie` or `localStorage`.
- **CSRF Consideration**: Using `SameSite=Strict` provides strong protection against CSRF, but we may consider adding a dedicated CSRF token if `SameSite=Strict` is too restrictive for certain flows (unlikely for this app).
