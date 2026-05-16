import { useState } from "react"
import { PRESET_COLORS } from "@/components/color-icon-picker"
import { type UseMutationResult } from "@tanstack/react-query"
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
  handleCreateProject: () => Promise<void>
}

type CreateProjectMutation = UseMutationResult<
  Project, 
  Error, 
  { name: string; color?: string; icon?: string }
>

export function useProjectManagement(
  createProject: CreateProjectMutation, 
  toast: ReturnType<typeof useToast>["toast"]
): UseProjectManagementReturn {
  const [projectId, setProjectId] = useState<string>("none")
  const [projectSearch, setProjectSearch] = useState("")
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false)
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState("Layers")

  const handleCreateProject = async () => {
    if (!projectSearch.trim()) return
    try {
      const p = await createProject.mutateAsync({ 
        name: projectSearch.trim(),
        color: newProjectColor,
        icon: newProjectIcon
      })
      setProjectId(p.id.toString())
      setProjectSearch("")
      setIsProjectPickerOpen(false)
      setNewProjectColor(PRESET_COLORS[0])
      setNewProjectIcon("Layers")
      toast({ title: "Project created!", variant: "success" })
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" })
    }
  }

  return {
    projectId, setProjectId,
    projectSearch, setProjectSearch,
    isProjectPickerOpen, setIsProjectPickerOpen,
    newProjectColor, setNewProjectColor,
    newProjectIcon, setNewProjectIcon,
    handleCreateProject
  }
}
