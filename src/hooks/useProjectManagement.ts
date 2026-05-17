import React, { useState, useCallback } from "react"
import { PRESET_COLORS } from "@/components/color-icon-picker"
import { type Project } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export interface UseProjectManagementReturn {
  projectId: string
  setProjectId: (id: string) => void
  projectSearch: string
  setProjectSearch: (search: string) => void
  isProjectPickerOpen: boolean
  setIsProjectPickerOpen: (open: boolean) => void
  newProjectColor: string
  setNewProjectColor: (color: string) => void
  newProjectIcon: string
  setNewProjectIcon: (icon: string) => void
  handleCreateProject: () => void
  localUnsavedProjects: { name: string; color: string; icon: string; tempId: number }[]
  resetProjects: (task: { project_id?: number } | null) => void
}

export function useProjectManagement(
  projects: Project[],
  toast: ReturnType<typeof useToast>["toast"]
): UseProjectManagementReturn {
  const [projectId, setProjectId] = useState<string>("none")
  const [projectSearch, setProjectSearch] = useState("")
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false)
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState("Layers")
  const [localUnsavedProjects, setLocalUnsavedProjects] = useState<{ name: string; color: string; icon: string; tempId: number }[]>([])

  const unsavedIdCounter = React.useRef(0)

  const handleCreateProject = useCallback(() => {
    if (!projectSearch.trim()) return

    const nameLower = projectSearch.trim().toLowerCase()
    const existsInAll = projects.some(p => p.name.toLowerCase() === nameLower)
    const existsInUnsaved = localUnsavedProjects.some(p => p.name.toLowerCase() === nameLower)

    if (existsInAll || existsInUnsaved) {
      toast({ title: "Project already exists", variant: "warning" })
      return
    }

    unsavedIdCounter.current += 1
    const tempId = -unsavedIdCounter.current
    
    setLocalUnsavedProjects(prev => [...prev, {
      name: projectSearch.trim(),
      color: newProjectColor,
      icon: newProjectIcon,
      tempId
    }])

    setProjectId(tempId.toString())
    setProjectSearch("")
    setIsProjectPickerOpen(false)
    setNewProjectColor(PRESET_COLORS[0])
    setNewProjectIcon("Layers")
  }, [projectSearch, projects, localUnsavedProjects, newProjectColor, newProjectIcon, toast])

  const resetProjects = useCallback((task: { project_id?: number } | null) => {
    setProjectId(task?.project_id?.toString() ?? "none")
    setProjectSearch("")
    setIsProjectPickerOpen(false)
    setNewProjectColor(PRESET_COLORS[0])
    setNewProjectIcon("Layers")
    setLocalUnsavedProjects([])
  }, [])

  return {
    projectId,
    setProjectId,
    projectSearch,
    setProjectSearch,
    isProjectPickerOpen,
    setIsProjectPickerOpen,
    newProjectColor,
    setNewProjectColor,
    newProjectIcon,
    setNewProjectIcon,
    handleCreateProject,
    localUnsavedProjects,
    resetProjects
  }
}
