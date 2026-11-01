"use client"

import { createContext, useContext } from "react"
import {
  useFocusSessionRuntime,
  type FocusSessionRuntime,
} from "@/hooks/useFocusSession"

/**
 * Owns the single session-runtime instance for the whole app — the Focus page
 * and the persistent mini bar must share one probe/ticker/local session, so
 * the runtime is created here once instead of inside the /focus route.
 */
const FocusSessionContext = createContext<FocusSessionRuntime | null>(null)

export function FocusSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const runtime = useFocusSessionRuntime()
  return (
    <FocusSessionContext.Provider value={runtime}>
      {children}
    </FocusSessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocusSession(): FocusSessionRuntime {
  const context = useContext(FocusSessionContext)
  if (!context) {
    throw new Error("useFocusSession must be used within FocusSessionProvider")
  }
  return context
}
