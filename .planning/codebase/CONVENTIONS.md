<!-- generated-by: gsd-doc-writer -->
# Coding Conventions

This document outlines the coding standards and best practices for the Task Buddy Frontend project.

## React 19 Best Practices

### 1. Keys in Lists
**NEVER** use array indexes as `key` props. Always use unique identifiers (e.g., `task.id`, `project.id`).
```tsx
// Bad
{items.map((item, index) => <Component key={index} {...item} />)}

// Good
{items.map((item) => <Component key={item.id} {...item} />)}
```

### 2. Context Value Memoization
Always wrap the `value` object of Context Providers in `useMemo` to prevent unnecessary re-renders of all consumers when the provider component itself re-renders.
```tsx
const value = useMemo(() => ({
  user,
  loading,
  login,
  logout
}), [user, loading, login, logout]);

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

### 3. Read-only Props
Mark component props as read-only to ensure immutability and better type safety.
```tsx
export function MyComponent({ children }: Readonly<{ children: ReactNode }>) {
  // ...
}
```

## JavaScript/TypeScript Standards

### 1. Global Object Access
Prefer `globalThis` over `window` or `self` for environment-neutral global access.
```tsx
// Good
globalThis.localStorage.setItem('key', 'value');
globalThis.dispatchEvent(new CustomEvent('auth:unauthorized'));
```

### 2. Explicit Type Conversion
Use `Number.parseInt` instead of the global `parseInt` for explicit type conversion. Always provide the radix (usually 10).
```tsx
const taskId = Number.parseInt(id, 10);
```

### 3. Array Construction
Use `new Array()` instead of `Array()` for explicit constructor calls when creating arrays with a specific length.
```tsx
const placeholders = new Array(5).fill(null);
```

### 4. Positive Logic
Avoid negated conditions in `if-else` or ternary statements. Prefer positive logic for readability.
```tsx
// Preferred
isLoggedIn ? <Dashboard /> : <LandingPage />

// Avoid
!isLoggedIn ? <LandingPage /> : <Dashboard />
```

## State Management

### Zustand
- Use small, atomic stores where possible.
- Use selectors to prevent unnecessary re-renders.

### React Query
- Use custom hooks to wrap `useQuery` and `useMutation`.
- Centralize query keys in a constant or helper function.

## Styling

- Use Tailwind CSS for all styling.
- Follow the project's design system (Tailwind v4 based).
- Use `cn` utility (from `src/lib/utils.ts`) for conditional class merging.
