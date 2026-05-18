<!-- generated-by: gsd-doc-writer -->
# Integrations

This document describes the external service integrations and API configurations for the Task Buddy Frontend.

## Backend API

The frontend communicates with a FastAPI backend.

- **Base URL:** Configurable via `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).
- **Client:** [Axios](https://axios-http.com/) is used for all HTTP requests.
- **Configuration:** Centralized in `src/lib/api.ts`.

### Axios Configuration
- `withCredentials: true`: Ensures HttpOnly cookies are sent with every request.
- **Idempotency:** A request interceptor automatically adds an `X-Idempotency-Key` header to mutating requests (POST, PUT, PATCH, DELETE) to prevent duplicate operations in case of network retries.
- **Error Handling:** 
    - `401 Unauthorized`: Dispatches a global `auth:unauthorized` event to trigger logout cleanup.
    - `429 Too Many Requests`: Displays a toast notification with rate limit details.

## Authentication (HttpOnly Cookies)

Task Buddy uses a secure HttpOnly cookie-based authentication system.

1. **Login:** The user submits credentials to `/api/v1/users/token`. On success, the backend sets an `access_token` HttpOnly cookie.
2. **Persistence:** The browser automatically manages the cookie. The frontend stores basic user profile information in `localStorage` for UI consistency between page loads.
3. **Logout:** Calling `/api/v1/users/logout` instructs the backend to clear the auth cookie. The frontend then clears its local state.
4. **Auth Context:** The `AuthContext` (in `src/contexts/AuthContext.tsx`) provides the `user`, `login`, `register`, and `logout` functions to the application.

## State Management

### TanStack Query (React Query)
- **Purpose:** Server state management, caching, and synchronization.
- **Persistence:** Configured with `async-storage-persister` and `idb-keyval` to persist the cache in IndexedDB for offline support.
- **Client:** Configured in `src/lib/query-client.ts`.

### Zustand
- **Purpose:** Lightweight client-side state (e.g., sidebar collapse state, UI preferences).

## PWA and Notifications

- **PWA:** Managed by `vite-plugin-pwa`. Supports offline mode and "Add to Home Screen".
- **Push Notifications:** Integrates with the backend notification service using VAPID keys. Users can subscribe to task reminders and system alerts.
