import React, { createContext, useContext, useState, useMemo, ReactNode } from "react"

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
