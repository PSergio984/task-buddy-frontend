/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react"

interface FilterContextType {
  activeSidebarFilter: string
  setActiveSidebarFilter: (filter: string) => void
  activeStatus: string
  setActiveStatus: (status: string) => void
  activeTagId: number | null
  setActiveTagId: (tagId: number | null) => void
  selectedPriorities: string[]
  setSelectedPriorities: (priorities: string[] | ((prev: string[]) => string[])) => void
  clearHubFilters: () => void
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeSidebarFilter, setActiveSidebarFilter] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")
  const [activeTagId, setActiveTagId] = useState<number | null>(null)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])

  const clearHubFilters = useCallback(() => {
    setActiveSidebarFilter("all")
    setActiveStatus("all")
    setActiveTagId(null)
    setSelectedPriorities([])
  }, [])

  const value = useMemo(() => ({
    activeSidebarFilter,
    setActiveSidebarFilter,
    activeStatus,
    setActiveStatus,
    activeTagId,
    setActiveTagId,
    selectedPriorities,
    setSelectedPriorities,
    clearHubFilters
  }), [
    activeSidebarFilter, 
    activeStatus, 
    activeTagId, 
    selectedPriorities,
    clearHubFilters
  ])

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
