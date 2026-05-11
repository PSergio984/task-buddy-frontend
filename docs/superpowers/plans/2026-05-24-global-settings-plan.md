# Global Settings Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a global settings context to manage user preferences, starting with Time Format ('12h' | '24h').

**Architecture:** A React context provider `SettingsProvider` will manage settings state and persist it to `localStorage`. A custom hook `useSettings` will provide access to settings throughout the app.

**Tech Stack:** React 19, TypeScript, Radix UI (Tabs), Lucide Icons, Vitest.

---

### Task 1: SettingsContext Logic

**Files:**
- Create: `src/contexts/SettingsContext.tsx`
- Create: `src/contexts/SettingsContext.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { renderHook, act } from "@testing-library/react"
import { SettingsProvider, useSettings } from "./SettingsContext"
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("SettingsContext", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should provide default time format of 12h", () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    expect(result.current.timeFormat).toBe("12h")
  })

  it("should update time format and persist to localStorage", () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    act(() => {
      result.current.setTimeFormat("24h")
    })
    expect(result.current.timeFormat).toBe("24h")
    expect(localStorage.getItem("pref_time_format")).toBe("24h")
  })

  it("should initialize from localStorage", () => {
    localStorage.setItem("pref_time_format", "24h")
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })
    expect(result.current.timeFormat).toBe("24h")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/contexts/SettingsContext.test.tsx`
Expected: FAIL (files don't exist)

- [ ] **Step 3: Implement SettingsContext**

```typescript
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"

export type TimeFormat = "12h" | "24h"

interface SettingsContextType {
  timeFormat: TimeFormat
  setTimeFormat: (format: TimeFormat) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = "pref_time_format"

export function SettingsProvider({ children }: { readonly children: ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved as TimeFormat) || "12h"
  })

  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format)
    localStorage.setItem(STORAGE_KEY, format)
  }

  const value = useMemo(() => ({ timeFormat, setTimeFormat }), [timeFormat])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/contexts/SettingsContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/SettingsContext.tsx src/contexts/SettingsContext.test.tsx
git commit -m "feat: implement SettingsContext with persistence"
```

---

### Task 2: App Integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Wrap App with SettingsProvider**

```typescript
// src/App.tsx
// ... existing imports
import { SettingsProvider } from "@/contexts/SettingsContext"

export function App() {
  const { user } = useAuth()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <SettingsProvider>
          <FilterProvider>
            {/* ... rest of the App structure */}
          </FilterProvider>
        </SettingsProvider>
      </TooltipProvider>
      {/* ... */}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (or `tsc --noEmit`)
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate SettingsProvider into App"
```

---

### Task 3: ProfilePage Preferences Section

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Add PreferencesCard component and integrate into ProfilePage**

```typescript
// src/pages/ProfilePage.tsx
// ... imports
import { Clock, Settings } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ... (Inside ProfilePage component, add PreferenceCard after SecurityCard)

function PreferenceCard() {
  const { timeFormat, setTimeFormat } = useSettings()

  return (
    <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2rem]">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Preferences</h2>
          <p className="text-sm text-muted-foreground">Customize your experience</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-orange-500" />
            <Label>Time Format</Label>
          </div>
          <Tabs 
            value={timeFormat} 
            onValueChange={(val) => setTimeFormat(val as "12h" | "24h")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-accent/50 rounded-xl">
              <TabsTrigger value="12h" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                12-hour (AM/PM)
              </TabsTrigger>
              <TabsTrigger value="24h" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                24-hour
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground px-1">
            Choose how times are displayed across the application.
          </p>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Update the main ProfilePage layout to include PreferenceCard**

```typescript
export function ProfilePage() {
  // ... existing code
  return (
    <div className="p-6 md:p-12">
      <motion.div ...>
        <div className="grid gap-8">
          <AccountCard />
          <PreferenceCard /> {/* New Card */}
          <SecurityCard />
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: Verify visually (if possible) or check for errors**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat: add preferences card to ProfilePage"
```
