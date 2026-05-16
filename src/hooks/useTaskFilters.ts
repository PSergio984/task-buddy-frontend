import { useState, useMemo, useCallback } from "react"
import { useFilters } from "@/contexts/FilterContext"
import type { Task } from "@/lib/api"

type SortMode = "priority" | "due_date" | "alpha"

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export function useTaskFilters(tasks: Task[]) {
  const { 
    activeSidebarFilter, 
    selectedPriorities,
    setSelectedPriorities,
  } = useFilters()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortMode>("priority")

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const next7Days = useMemo(() => {
    const d = new Date(today)
    d.setDate(today.getDate() + 7)
    return d
  }, [today])

  const matchesTask = useCallback((task: Task) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = task.title.toLowerCase().includes(query)
    
    const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(task.priority)

    let matchesSidebar = true
    if (activeSidebarFilter === "today") {
      const taskDate = task.due_date ? new Date(task.due_date) : null
      matchesSidebar = taskDate ? taskDate.getTime() >= today.getTime() && taskDate.getTime() < today.getTime() + 86400000 : false
    } else if (activeSidebarFilter === "upcoming") {
      const taskDate = task.due_date ? new Date(task.due_date) : null
      matchesSidebar = taskDate ? taskDate.getTime() >= today.getTime() && taskDate.getTime() < next7Days.getTime() : false
    } else if (activeSidebarFilter === "inbox") {
      matchesSidebar = !task.project_id
    }

    return matchesSearch && matchesPriority && matchesSidebar
  }, [searchQuery, selectedPriorities, activeSidebarFilter, today, next7Days])

  const filteredTasks = useMemo(() => tasks.filter(t => matchesTask(t)), [tasks, matchesTask])

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "priority") {
        const pa = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 99
        const pb = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 99
        return pa - pb
      }
      if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return a.title.localeCompare(b.title)
    })
  }, [filteredTasks, sortBy])

  const togglePriority = useCallback((p: string) => {
    setSelectedPriorities(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }, [setSelectedPriorities])

  const clearAllFilters = useCallback(() => {
    setSelectedPriorities([])
    setSearchQuery("")
  }, [setSelectedPriorities])

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortedTasks,
    togglePriority,
    clearAllFilters,
    selectedPriorities
  }
}
