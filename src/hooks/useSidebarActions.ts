import { useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useFilters } from "@/contexts/FilterContext"
import { useDeleteProject, useReorderProjects } from "@/hooks/useProjects"
import { useDeleteTag, useReorderTags } from "@/hooks/useTags"
import { type Project as ProjectType, type Tag as TagType } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { type DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export function useSidebarActions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  
  const { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId,
    setSelectedPriorities,
  } = useFilters()

  const deleteTag = useDeleteTag()
  const deleteProject = useDeleteProject()
  const reorderProjects = useReorderProjects()
  const reorderTags = useReorderTags()

  const [editingTag, setEditingTag] = useState<TagType | undefined>()
  const [editingProject, setEditingProject] = useState<ProjectType | undefined>()
  const [deletingItem, setDeletingItem] = useState<{ type: "project" | "tag"; id: number; name: string } | null>(null)
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)

  const clearHubFilters = useCallback(() => {
    setSelectedPriorities([])
  }, [setSelectedPriorities])

  const handleSidebarFilterClick = useCallback((filter: string) => {
    if (activeSidebarFilter === filter) {
      setActiveSidebarFilter("all")
    } else {
      setActiveSidebarFilter(filter)
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }, [activeSidebarFilter, setActiveSidebarFilter, clearHubFilters, location.pathname, navigate])

  const handleProjectClick = useCallback((projectId: number) => {
    const filterId = `project:${projectId}`
    if (activeSidebarFilter === filterId && activeTagId === null) {
      setActiveSidebarFilter("all")
    } else {
      setActiveSidebarFilter(filterId)
      setActiveTagId(null)
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }, [activeSidebarFilter, activeTagId, setActiveSidebarFilter, setActiveTagId, clearHubFilters, location.pathname, navigate])

  const handleTagClick = useCallback((tagId: number) => {
    if (activeTagId === tagId) {
      setActiveTagId(null)
    } else {
      setActiveTagId(tagId)
      setActiveSidebarFilter("all")
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }, [activeTagId, setActiveTagId, setActiveSidebarFilter, clearHubFilters, location.pathname, navigate])

  const handleProjectDragEnd = useCallback((event: DragEndEvent, projects: ProjectType[]) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id)
      const newIndex = projects.findIndex((p) => p.id === over.id)
      const newOrder = arrayMove(projects, oldIndex, newIndex)
      reorderProjects.mutate(newOrder.map((p) => p.id))
    }
  }, [reorderProjects])

  const handleTagDragEnd = useCallback((event: DragEndEvent, tags: TagType[]) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id)
      const newIndex = tags.findIndex((t) => t.id === over.id)
      const newOrder = arrayMove(tags, oldIndex, newIndex)
      reorderTags.mutate(newOrder.map((t) => t.id))
    }
  }, [reorderTags])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItem) return
    
    try {
      if (deletingItem.type === "project") {
        await deleteProject.mutateAsync(deletingItem.id)
        if (activeSidebarFilter === `project:${deletingItem.id}`) {
          setActiveSidebarFilter("all")
        }
      } else {
        await deleteTag.mutateAsync(deletingItem.id)
        if (activeTagId === deletingItem.id) {
          setActiveTagId(null)
          setActiveSidebarFilter("all")
        }
      }
      toast({
        title: "Deleted",
        description: `${deletingItem.type === "project" ? "Project" : "Tag"} deleted successfully`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    } finally {
      setDeletingItem(null)
    }
  }, [deletingItem, deleteProject, deleteTag, activeSidebarFilter, activeTagId, setActiveSidebarFilter, setActiveTagId, toast])

  const openCreateProjectModal = useCallback(() => {
    setEditingProject(undefined)
    setIsCreateProjectModalOpen(true)
  }, [])

  const openEditProjectModal = useCallback((project: ProjectType) => {
    setEditingProject(project)
    setIsCreateProjectModalOpen(true)
  }, [])

  const openCreateTagModal = useCallback(() => {
    setEditingTag(undefined)
    setIsCreateTagModalOpen(true)
  }, [])

  const openEditTagModal = useCallback((tag: TagType) => {
    setEditingTag(tag)
    setIsCreateTagModalOpen(true)
  }, [])

  const openDeleteProjectModal = useCallback((project: ProjectType) => {
    setDeletingItem({ type: "project", id: project.id, name: project.name })
  }, [])

  const openDeleteTagModal = useCallback((tag: TagType) => {
    setDeletingItem({ type: "tag", id: tag.id, name: tag.name })
  }, [])

  const closeCreateProjectModal = useCallback(() => {
    setIsCreateProjectModalOpen(false)
    setEditingProject(undefined)
  }, [])

  const closeCreateTagModal = useCallback(() => {
    setIsCreateTagModalOpen(false)
    setEditingTag(undefined)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setDeletingItem(null)
  }, [])

  return {
    editingTag, setEditingTag,
    editingProject, setEditingProject,
    deletingItem, setDeletingItem,
    isCreateProjectModalOpen, setIsCreateProjectModalOpen,
    isCreateTagModalOpen, setIsCreateTagModalOpen,
    handleSidebarFilterClick,
    handleProjectClick,
    handleTagClick,
    handleConfirmDelete,
    handleProjectDragEnd,
    handleTagDragEnd,
    openCreateProjectModal,
    openEditProjectModal,
    openCreateTagModal,
    openEditTagModal,
    openDeleteProjectModal,
    openDeleteTagModal,
    closeCreateProjectModal,
    closeCreateTagModal,
    closeDeleteModal,
    deleteProject,
    deleteTag,
    activeSidebarFilter,
    activeTagId,
  }
}
