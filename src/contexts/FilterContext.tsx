/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, type ReactNode } from "react"

interface FilterContextType {
  activeSidebarFilter: string
  setActiveSidebarFilter: (filter: string) => void
  activeStatus: string
  setActiveStatus: (status: string) => void
  activeTagId: number | null
  setActiveTagId: (tagId: number | null) => void
  selectedPriorities: string[]
  setSelectedPriorities: (priorities: string[] | ((prev: string[]) => string[])) => void
  selectedProjects: number[]
  setSelectedProjects: (projects: number[] | ((prev: number[]) => number[])) => void
  selectedTags: number[]
  setSelectedTags: (tags: number[] | ((prev: number[]) => number[])) => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeSidebarFilter, setActiveSidebarFilter] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")
  const [activeTagId, setActiveTagId] = useState<number | null>(null)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const value = useMemo(() => ({
    activeSidebarFilter,
    setActiveSidebarFilter,
    activeStatus,
    setActiveStatus,
    activeTagId,
    setActiveTagId,
    selectedPriorities,
    setSelectedPriorities,
    selectedProjects,
    setSelectedProjects,
    selectedTags,
    setSelectedTags,
  }), [
    activeSidebarFilter, 
    activeStatus, 
    activeTagId, 
    selectedPriorities, 
    selectedProjects, 
    selectedTags
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
