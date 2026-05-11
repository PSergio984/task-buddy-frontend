# Phase 2 Spec: Real-time, PWA, and Premium Comms

## Goal
Transform Task Buddy into a high-performance, installable application with real-time feedback and professional communications.

## 1. PWA Integration (Installable Experience)
- **Goal:** Allow users to install Task Buddy as a standalone app on Mobile and Desktop.
- **Tech:** `vite-plugin-pwa`.
- **Requirements:**
  - Standard manifest (Icons, Theme Color, Display: standalone).
  - Service Worker for offline caching of assets.
  - "Install App" prompt/detection in Sidebar.
  - Custom splash screens for iOS/Android.

## 2. Real-time Notifications & State
- **Goal:** Ensure the UI stays in sync without manual refreshes.
- **Tech:** WebSockets (FastAPI) or Polling + React Query auto-refetch.
- **Requirements:**
  - Real-time notification for task deadlines.
  - UI auto-updates when a task is completed/updated (if multiple tabs open).
  - "Toast" notifications for background sync status.

## 3. Premium Email Enhancement (Minimalist)
- **Goal:** Replace plain text emails with a high-end, minimalist design.
- **Tech:** MJML or HTML/CSS templates on Backend.
- **Design Principles:**
  - **Color Palette:** Slate (#F1F5F9 background), Navy (#0F172A text), Accent (#C2A388 buttons).
  - **Typography:** Plus Jakarta Sans (fallback to Sans-Serif).
  - **Minimalism:** Single-column, generous white space, clear CTA button.
- **Flows:**
  - Welcome Email.
  - Password Reset Request.
  - Token Claimed / Password Changed Confirmation.

## 4. Reset Flow Refinement (Snappy UX)
- **Goal:** Close the feedback loop quickly.
- **Behavior:**
  - After submitting a new password successfully, the browser tab will automatically close after a 2-second success animation (or redirect if it's the only tab).
  - Standard fallback: "Back to Login" button.

## Success Criteria
1. Application scores >90 on Lighthouse PWA audit.
2. Emails look professional and consistent with the "Executive Dashboard" brand.
3. User receives real-time alerts for nearing deadlines.
