# Fix @dnd-kit/core Type Import in Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the `SyntaxError` caused by importing `DragEndEvent` as a value when `verbatimModuleSyntax` is enabled.

**Architecture:** Use explicit `type` qualifier for type-only imports from `@dnd-kit/core` in `src/components/sidebar.tsx`.

**Tech Stack:** React, TypeScript, Vite, @dnd-kit

---

### Task 1: Fix Sidebar Imports

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Update @dnd-kit/core imports**

Change the import block to explicitly mark `DragEndEvent` as a type.

```tsx
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
```

- [ ] **Step 2: Verify with typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Verify with lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "fix: use explicit type import for DragEndEvent in sidebar"
```
