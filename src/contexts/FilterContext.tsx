import { createContext, useContext, useState, type ReactNode } from "react"

interface FilterContextType {
  activeSidebarFilter: string
  setActiveSidebarFilter: (filter: string) => void
  activeStatus: string
  setActiveStatus: (status: string) => void
  activeTagId: number | null
  setActiveTagId: (tagId: number | null) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeSidebarFilter, setActiveSidebarFilter] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")
  const [activeTagId, setActiveTagId] = useState<number | null>(null)

  return (
    <FilterContext.Provider
      value={{
        activeSidebarFilter,
        setActiveSidebarFilter,
        activeStatus,
        setActiveStatus,
        activeTagId,
        setActiveTagId,
      }}
    >
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
