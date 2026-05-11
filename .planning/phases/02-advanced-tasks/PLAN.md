# Phase 2 Plan: PWA & Premium Comms (Sub-Phase A)

## Task 1: PWA Foundation (Frontend)
- [ ] Install `vite-plugin-pwa` and `@vite-pwa/assets-generator`.
- [ ] Configure `vite.config.ts` with manifest and workbox strategies.
- [ ] Add icons and `manifest.webmanifest` generation.
- [ ] Implement `InstallPrompt` hook and Sidebar button.
- **Verification:** Lighthouse PWA audit (local) and "Install" button appears in Sidebar.

## Task 2: Premium Email Templates (Backend)
- [ ] Create `app/libs/email_templates.py` with MJML/HTML generation logic.
- [ ] Design "Minimalist Executive" template (Slate/Navy/Accent).
- [ ] Refactor `send_password_reset_email` in `app/tasks.py` to use HTML template.
- [ ] Add `send_password_changed_confirmation` (The "Snappy" follow-up).
- **Verification:** Send test emails via `scripts/test_email.py` (to be created) and verify visual alignment with design spec.

## Task 3: Snappy Reset Flow (Frontend)
- [ ] Update `ResetPasswordPage.tsx` with high-performance "Success" animation (Framer Motion).
- [ ] Implement `window.close()` logic after 2s delay.
- [ ] Add "Session Secured" confirmation screen.
- **Verification:** Reset password and confirm tab closes (if browser allows) or redirects with a "You're all set" message.

## Task 4: Real-time Notification Foundation
- [ ] Implement deadline-check worker (backend) or refetch logic (frontend).
- [ ] Add "Nearing Deadline" toast notifications.
- **Verification:** Create task with deadline 5 mins away, verify toast appears.
