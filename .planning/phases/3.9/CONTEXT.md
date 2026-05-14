# Phase 3.9 Context: UI and Idempotency Overhaul

## Overview
This phase focuses on a significant upgrade to the Task-Buddy user experience and backend reliability. The primary goals are to fix UX bugs in the time picker, enhance UI responsiveness with performance-optimized components (skeletons, snappy animations), and implement a robust idempotency mechanism to prevent duplicate request processing.

## Requirements
- **RE-3.9-01**: Replace custom time picker with `react-time-picker` for stability and better UX.
- **RE-3.9-02**: Implement backend idempotency middleware using Redis to cache responses for `POST`, `PATCH`, `PUT`, `DELETE` requests.
- **RE-3.9-03**: Implement frontend idempotency via Axios interceptors (automatic `X-Idempotency-Key` generation) and button-level loading states.
- **RE-3.9-04**: Add a mandatory confirmation modal for completing tasks and subtasks.
- **RE-3.9-05**: Improve loading screen performance by simplifying animations and utilizing GPU acceleration.
- **RE-3.9-06**: Implement shimmering skeletons for all major UI components (Dashboard, Audit Trail, Status Widgets, Task Cards).
- **RE-3.9-07**: Accelerate global animations for a snappier, more performant feel.

## Technical Decisions
- **Backend Idempotency**:
    - Header: `X-Idempotency-Key`.
    - Cache: Redis (TTL: 24h, policy: allkeys-lru).
    - Scope: Mutating methods only.
- **Frontend Performance**:
    - Use `Framer Motion` for accelerated animations.
    - Skeletons: Custom component with `shimmer` effect.
    - Idempotency Key: Generated in `api.ts` (deterministic based on payload).
- **Time Picker**: `react-time-picker` library integration.
- **Deployment**: Render-specific adjustments (no Docker Compose in prod).

## Deployment Notes
- Backend is deployed as a standalone Python/FastAPI server on Render.
- Redis is available for caching.
