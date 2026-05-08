# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Component-Based Architecture (React)
- Why this classification: The UI is composed of reusable, isolated components with shared state managed through hooks and context.
- Primary constraints:
  - React 19 functional components with hooks.
  - Tailwinds CSS v4 for utility-first styling.
  - shadcn/ui for accessible component primitives.

### 2) System Flow

```text
[User Interaction] -> [React Component] -> [Custom Hook (useApi)] -> [Axios/Fetch] -> [Backend API]
```

1. **User Action**: User interacts with a component (e.g., clicking a button).
2. **State/Logic**: Component triggers a callback or state change, often using a custom hook like `useTasks`.
3. **API Call**: The hook uses `axios` to send a request to the `VITE_API_BASE_URL`.
4. **Rendering**: React updates the UI based on the response data or loading/error states.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| `src/App.tsx` | Main routing and layout structure | Low-level styling, detailed API logic | `src/App.tsx` |
| `src/pages/` | Page-specific layout and orchestration | Reusable UI logic (should be in components) | `src/pages/` |
| `src/components/` | Specific UI features (TaskCard, Sidebar) | Routing definitions | `src/components/` |
| `src/hooks/` | Encapsulated logic, API data fetching | UI markup | `src/hooks/useApi.ts` |
| `src/lib/` | Shared utilities (formatting, cn) | Component state | `src/lib/utils.ts` |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Custom Hooks | `src/hooks/` | To encapsulate and reuse stateful logic (especially API integration). |
| Component Composition | `src/components/` | To build complex UIs from simpler, focused components. |
| Context API | `src/contexts/` | To provide global state like Auth and Theme without prop drilling. |

### 5) Graphify Insights (Core Abstractions)

According to `graphify-out/GRAPH_REPORT.md`, the following are the most connected "God Nodes" and key communities in the frontend:

**God Nodes (Core Abstractions):**
1. `useAuth()` (Global Authentication Hook)
2. `cn()` (Utility for conditional Tailwind classes)
3. `Task-Buddy Frontend` (System Root)
4. `useToast()` (Global User Feedback)
5. `sanitizePassword()` (Security Utility)

**Key Communities:**
- **Authentication & Authorization**: High node density (67), centralized around `useAuth`.
- **Core UI Components**: Dashboard, Sidebar, and other layout components.
- **User Navigation & Theme**: Routing and theme management.
- **Audit & Activity Logging**: Frontend tracking and display of audit entries.

### 6) Known Architectural Risks

- **Prop Drilling**: Potential for deep nesting if context is not used effectively for shared state.
- **API Coupling**: Hard-coding API endpoint logic within components instead of hooks.

### 7) Evidence

- `README.md` (Architecture section)
- `src/App.tsx`
- `src/hooks/useApi.ts`

## Extended Sections (Optional)

- Theme Provider: `src/components/theme-provider.tsx`.
