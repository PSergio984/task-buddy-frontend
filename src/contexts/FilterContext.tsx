/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, type ReactNode } from "react"

interface FilterContextType {
  activeSidebarFilter: string
  setActiveSidebarFilter: (filter: string) => void
  activeStatus: string
  setActiveStatus: (status: string) => void
  activeTagId: number | null
  setActiveTagId: (tagId: number | null) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeSidebarFilter, setActiveSidebarFilter] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")
  const [activeTagId, setActiveTagId] = useState<number | null>(null)

  const value = useMemo(() => ({
    activeSidebarFilter,
    setActiveSidebarFilter,
    activeStatus,
    setActiveStatus,
    activeTagId,
    setActiveTagId,
  }), [activeSidebarFilter, activeStatus, activeTagId])

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
