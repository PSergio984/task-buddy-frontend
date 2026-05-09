# Phase 2 Context: Advanced Features & Architectural Hardening

## Background
Phase 1 established the visual foundation and basic layout persistence. Phase 2 aims to make the application "production-ready" by addressing critical architectural technical debt (component bloat, manual fetch logic) and security gaps (stateless logout), while delivering the core "Advanced Task" value proposition.

## Strategic Intent
Transform the application from a prototype shell into a scalable, secure, and feature-complete task management platform.

## Key Stakeholder Requirements
1. **Security**: Sessions must be invalidatable (Logout means LOGOUT).
2. **Performance**: Frontend must have efficient data caching and optimistic UI updates.
3. **Usability**: Support for subtasks, tagging, and task prioritization.
4. **Maintainability**: Core layout components must be decomposed and easy to test.

## Tech Stack Expansion
- **Backend**: Redis (Caching/Session management).
- **Frontend**: TanStack Query (Data fetching/Caching).

## Verification Strategy
- **Architectural**: Unit tests for new Query hooks.
- **Security**: Manual verification of token invalidation via Redis CLI/Logs.
- **Functional**: Playwright E2E tests for Subtasks and Tags.
