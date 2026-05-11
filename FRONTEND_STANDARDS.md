# Frontend Standards & Guidelines (Task Buddy)

This document serves as the source of truth for frontend development standards in the Task Buddy project. All future modifications to the frontend should strictly adhere to these principles.

## 1. Karpathy Behavioral Guidelines
*   **Think Before Coding**: State assumptions explicitly. Surface tradeoffs. Ask for clarification if ambiguous.
*   **Simplicity First**: Minimum code that solves the problem. No speculative features or over-abstractions.
*   **Surgical Changes**: Touch only what is necessary. Match existing style. Clean up your own mess (unused imports/variables created by your changes).
*   **Goal-Driven Execution**: Define success criteria. Write tests or verify functionality before and after changes.

## 2. Type Safety & Standards
*   **Strict Readonly Props**: All component props MUST be wrapped in `Readonly<T>` or use `readonly` modifiers in their interfaces.
    ```tsx
    // Correct
    function MyComponent({ label }: Readonly<{ label: string }>) { ... }
    
    // Also Correct
    interface MyProps { readonly label: string }
    function MyComponent({ label }: Readonly<MyProps>) { ... }
    ```
*   **No Redundant Assertions**: Avoid using `as Type` when TypeScript's inference is already correct.
*   **Import Hygiene**: Consolidate imports from the same module. Resolve any "multiple imports" warnings immediately.

## 3. Accessibility (WCAG)
*   **Semantic Interaction**: Use native HTML interactive elements (e.g., `<button>`, `<a>`, `<input>`) instead of adding `onClick` to generic elements like `div` or `h2`.
*   **No Generic Roles**: Avoid `role="button"` or `role="group"` if a semantic alternative exists (e.g., `<button>`, `<fieldset>`, `<details>`).
*   **Label Association**: Every form control (input, textarea, select) must have a corresponding `<label>` with an explicit `htmlFor` matching the control's `id`.

## 4. React 19 Compatibility
*   **Event Handling**: Use `React.SubmitEvent` instead of the deprecated `React.FormEvent` for `onSubmit` handlers.

## 5. Code Quality & Patterns
*   **Ternary Refactoring**: Avoid complex or nested ternary operations. If a ternary exceeds one level or becomes hard to read, refactor it into an independent `if-else` block or a helper variable.
*   **Component Modularity**: Extract large sub-components into their own files or independent statements to keep the main component logic clean.

## 6. Project-Specific Context
*   **Sanitization**: Always use `sanitizeUsername` and `sanitizePassword` from `@/lib/auth` before sending auth data to the backend.
*   **Error Handling**: Use the `getErrorMessage` helper for consistent toast notifications on API failures.
