# Global Settings Management Design

**Goal:** Implement a global settings context to manage user preferences, specifically the Time Format ('12h' | '24h').

## Architecture

### SettingsContext
- **Path:** `src/contexts/SettingsContext.tsx`
- **Responsibilities:**
  - Define `TimeFormat` type.
  - Manage `timeFormat` state.
  - Persist `timeFormat` to `localStorage` (`pref_time_format`).
  - Provide `useSettings` hook.
- **State Management:**
  - Initial state from `localStorage` or default to `12h`.
  - Use `useMemo` for the context provider value to prevent unnecessary re-renders.

### ProfilePage Preferences Section
- **Path:** `src/pages/ProfilePage.tsx`
- **UI Component:** A new card matching the existing "Account Settings" and "Security" cards.
- **Interactions:** A toggle (using `Tabs` component) to switch between 12h and 24h formats.
- **Icons:** Use `Clock` icon for the card header.

### Application Integration
- **Path:** `src/App.tsx`
- **Location:** Wrap the `FilterProvider` with `SettingsProvider`.

## Data Flow
1. User changes preference in `ProfilePage`.
2. `useSettings` hook updates state in `SettingsProvider`.
3. `SettingsProvider` updates `localStorage`.
4. Other components (in future tasks) will use `useSettings` to format times.

## Testing Strategy
- **Unit Test:** `src/contexts/SettingsContext.test.tsx` to verify:
  - Default value is `12h`.
  - Updating value persists to `localStorage`.
  - Initializing with `localStorage` value works.

## Success Criteria
- Time format preference persists across sessions.
- Users can toggle preference in the Profile page.
- Code is type-safe and follows React 19 patterns.
