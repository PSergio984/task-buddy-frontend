# Sidebar & Tag Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor sidebar for collapsibility, dynamic project icons, and integrate tag creation flow.

**Architecture:**
- Update `api.ts` and `useTags.ts` for tag creation.
- Create `CreateTagModal` component.
- Refactor `Sidebar` with `framer-motion` for animations and state-driven collapsibility.

**Tech Stack:** React 19, TypeScript, Lucide Icons, Framer Motion, TanStack Query.

---

### Task 1: API and Hook Infrastructure

**Files:**
- Modify: `src/hooks/useTags.ts`

- [ ] **Step 1: Add useCreateTag hook**

```typescript
export function useCreateTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}
```

- [ ] **Step 2: Commit**
  `git add src/hooks/useTags.ts && git commit -m "feat: add useCreateTag hook"`

### Task 2: CreateTagModal Component

**Files:**
- Create: `src/components/create-tag-modal.tsx`

- [ ] **Step 1: Implement CreateTagModal**
  Use `CreateProjectModal` as a template. Update names, icons (Tag instead of Layers), and hooks (`useCreateTag`).

- [ ] **Step 2: Commit**
  `git add src/components/create-tag-modal.tsx && git commit -m "feat: add CreateTagModal component"`

### Task 3: Sidebar Refactor (Collapsibility & Dynamic Icons)

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Add imports and state**
  Import `ChevronDown`, `Plus`, `CreateTagModal`, `useCreateTag`, `LucideIcons`.
  Add `isProjectsCollapsed`, `isTagsCollapsed`, `isCreateTagModalOpen` states.

- [ ] **Step 2: Implement dynamic project icons**
  Lookup icon from `LucideIcons` using `project.icon`.

- [ ] **Step 3: Implement Filter Revert Logic**
  Toggle `activeSidebarFilter` back to `"all"` if already selected.

- [ ] **Step 4: Implement Collapsible Sections**
  Use `AnimatePresence` and `motion.div` for smooth opening/closing.

- [ ] **Step 5: Integrate CreateTagModal**
  Add "Plus" button to Tags header and wire up the modal.

- [ ] **Step 6: Commit**
  `git add src/components/sidebar.tsx && git commit -m "feat: collapsible sidebar sections, dynamic project icons, and tag creation"`

### Task 4: Centering & UI Polish

- [ ] **Step 1: Center branding/toggle in collapsed state**
  Ensure items are perfectly centered when `isCollapsed` is true.

- [ ] **Step 2: Commit**
  `git add src/components/sidebar.tsx && git commit -m "style: center sidebar items in collapsed state"`
