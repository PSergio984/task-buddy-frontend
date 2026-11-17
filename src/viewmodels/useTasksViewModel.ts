/**
 * Tasks ViewModel
 * Encapsulates task querying, filtering, sorting, confirmation flows,
 * user preferences, and optimistic mutations for TasksPage.
 */
import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useFilters } from "@/contexts/FilterContext"
import { useToast } from "@/hooks/use-toast"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import {
  useTasks,
  useUpdateTask,
  useUpdateSubtask,
  useDeleteSubtask,
  useDetachTag,
} from "@/hooks/useTasks"
import { useTaskFilters } from "@/hooks/useTaskFilters"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import type { Task, Tag } from "@/models/task.model"
import { TASK_SORT_LABELS } from "@/models/task.model"

const LS_KEY = "tb_sort_preference"

function checkMutationResult<T>(res: T): boolean {
  if (res && typeof res === "object" && "error" in res && res.error) {
    throw res.error
  }
  return Boolean(
    res && typeof res === "object" && "queued" in res && res.queued
  )
}

export interface ConfirmData {
  type: "task" | "subtask" | "detach_tag" | "delete_subtask"
  id: number
  title: string
  completed?: boolean
  taskId?: number
}

export function useTasksViewModel() {
  const { activeSidebarFilter, activeStatus, setActiveStatus, activeTagId } =
    useFilters()

  const { toast } = useToast()
  const { user, logout } = useAuth()
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null)

  const isProjectFilter = activeSidebarFilter.startsWith("project:")
  const filterParam = activeStatus === "all" ? undefined : activeStatus
  const projectIdParam = isProjectFilter
    ? Number.parseInt(activeSidebarFilter.split(":")[1], 10)
    : undefined

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refreshTasks,
  } = useTasks(filterParam, projectIdParam, activeTagId || undefined)

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: updateSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortedTasks,
    togglePriority,
    clearAllFilters,
    selectedPriorities,
  } = useTaskFilters(tasks)

  const handleSetSortBy = useCallback(
    (mode: Parameters<typeof setSortBy>[0]) => {
      setSortBy(mode)
      try {
        if (typeof mode === "string") {
          globalThis.localStorage.setItem(LS_KEY, mode)
        }
      } catch {
        // ignore storage errors
      }
    },
    [setSortBy]
  )

  useEffect(() => {
    try {
      const saved = globalThis.localStorage.getItem(LS_KEY)
      if (
        saved &&
        (saved === "priority" || saved === "due_date" || saved === "alpha")
      ) {
        setSortBy(saved)
      }
    } catch {
      // ignore storage errors
    }
  }, [setSortBy])

  const {
    skipTaskCompletionConfirm,
    skipSubtaskCompletionConfirm,
    skipTagDetachmentConfirm,
    skipSubtaskDeletionConfirm,
    setPreference,
  } = useUserPreferences(user?.id ?? "default")

  const performToggle = async (id: number, completed: boolean) => {
    setIsCompleting(true)
    try {
      const res = await updateTask({ id, updates: { completed }, silent: true })
      const isQueued = checkMutationResult(res)
      if (isQueued) {
        toast({
          title: "Task saved offline",
          description: "Task status saved locally and will sync automatically.",
        })
      } else {
        toast({
          title: completed ? "Task completed!" : "Task restored",
          description: completed ? "Great job!" : "Task moved to pending.",
          variant: "success",
        })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      console.error("Failed to toggle task status:", err)
      toast({
        title: "Action failed",
        description: "Could not update task status.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find((t: Task) => t.id === id)
    if (!task) return

    const nextStatus = !task.completed

    if (nextStatus) {
      if (skipTaskCompletionConfirm) {
        await performToggle(id, nextStatus)
        return
      }

      setConfirmData({
        type: "task",
        id,
        title: task.title,
        completed: true,
      })
      return
    }

    await performToggle(id, nextStatus)
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (skipSubtaskDeletionConfirm) {
      try {
        const res = await deleteSubtask({ id: subtaskId, silent: true })
        const isQueued = checkMutationResult(res)
        if (!isQueued) {
          refreshTasks()
        }
        toast({
          title: isQueued ? "Subtask deleted offline" : "Subtask deleted",
          description: isQueued
            ? "Saved locally and will sync automatically."
            : undefined,
          variant: isQueued ? "default" : "success",
        })
        return
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          await logout()
          return
        }
        console.error("Failed to delete subtask:", err)
        toast({
          title: "Action failed",
          description: "Could not delete subtask.",
          variant: "destructive",
        })
        return
      }
    }

    const subtask = tasks
      .flatMap((t: Task) => t.subtasks || [])
      .find((s) => s.id === subtaskId)
    setConfirmData({
      type: "delete_subtask",
      id: subtaskId,
      title: subtask?.title || "this subtask",
    })
  }

  const handleToggleSubtask = async (subtaskId: number, completed: boolean) => {
    if (completed) {
      if (skipSubtaskCompletionConfirm) {
        try {
          const res = await updateSubtask({
            id: subtaskId,
            updates: { completed: true },
            silent: true,
          })
          const isQueued = checkMutationResult(res)
          if (!isQueued) {
            refreshTasks()
          }
          if (isQueued) {
            toast({
              title: "Subtask updated offline",
              description: "Saved locally and will sync automatically.",
            })
          }
          return
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            await logout()
            return
          }
          console.error("Failed to update subtask:", err)
          toast({
            title: "Action failed",
            description: "Could not update subtask.",
            variant: "destructive",
          })
          return
        }
      }

      const allSubtasks = tasks.flatMap((t) => t.subtasks || [])
      const subtask = allSubtasks.find((s) => s.id === subtaskId)
      if (subtask) {
        setConfirmData({
          type: "subtask",
          id: subtaskId,
          title: subtask.title,
          completed: true,
        })
        return
      }
    }

    try {
      const res = await updateSubtask({
        id: subtaskId,
        updates: { completed },
        silent: true,
      })
      const isQueued = checkMutationResult(res)
      if (!isQueued) {
        refreshTasks()
      }
      if (isQueued) {
        toast({
          title: "Subtask updated offline",
          description: "Saved locally and will sync automatically.",
        })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      console.error("Failed to update subtask:", err)
      toast({
        title: "Action failed",
        description: "Could not update subtask.",
        variant: "destructive",
      })
    }
  }

  const handleDetachTag = async (taskId: number, tagId: number) => {
    if (skipTagDetachmentConfirm) {
      try {
        await detachTag({ taskId, tagId, silent: true })
        toast({
          title: "Tag removed",
          variant: "success",
        })
        return
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          await logout()
          return
        }
        console.error("Failed to detach tag:", err)
        toast({
          title: "Action failed",
          description: "Could not detach tag.",
          variant: "destructive",
        })
        return
      }
    }

    const task = tasks.find((t: Task) => t.id === taskId)
    const tag = tags.find((t: Tag) => t.id === tagId)
    if (task && tag) {
      setConfirmData({
        type: "detach_tag",
        id: tagId,
        taskId,
        title: tag.name,
      })
    }
  }

  const handleConfirmAction = async (dontShowAgain?: boolean) => {
    if (!confirmData) return

    setIsCompleting(true)
    try {
      if (confirmData.type === "task") {
        if (dontShowAgain) setPreference("skipTaskCompletionConfirm", true)
        await performToggle(confirmData.id, confirmData.completed ?? false)
      } else if (confirmData.type === "subtask") {
        if (dontShowAgain) setPreference("skipSubtaskCompletionConfirm", true)
        const res = await updateSubtask({
          id: confirmData.id,
          updates: { completed: confirmData.completed ?? false },
          silent: true,
        })
        const isQueued = checkMutationResult(res)
        if (!isQueued) {
          refreshTasks()
        }
        toast({
          title: isQueued ? "Subtask updated offline" : "Subtask completed!",
          description: isQueued
            ? "Saved locally and will sync automatically."
            : undefined,
          variant: isQueued ? "default" : "success",
        })
      } else if (confirmData.type === "detach_tag" && confirmData.taskId) {
        if (dontShowAgain) setPreference("skipTagDetachmentConfirm", true)
        await detachTag({
          taskId: confirmData.taskId,
          tagId: confirmData.id,
          silent: true,
        })
        toast({
          title: "Tag removed",
          variant: "success",
        })
      } else if (confirmData.type === "delete_subtask") {
        if (dontShowAgain) setPreference("skipSubtaskDeletionConfirm", true)
        const res = await deleteSubtask({ id: confirmData.id, silent: true })
        const isQueued = checkMutationResult(res)
        if (!isQueued) {
          refreshTasks()
        }
        toast({
          title: isQueued ? "Subtask deleted offline" : "Subtask deleted",
          description: isQueued
            ? "Saved locally and will sync automatically."
            : undefined,
          variant: isQueued ? "default" : "success",
        })
      }
      setConfirmData(null)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      console.error("Failed to complete action:", err)
      toast({
        title: "Action failed",
        description: "Could not update status.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const activeProject = isProjectFilter
    ? projects.find((p) => p.id === projectIdParam)
    : null
  const activeTag = activeTagId ? tags.find((t) => t.id === activeTagId) : null

  return {
    // Layout and UI mode
    viewMode,
    setViewMode,
    isFiltersExpanded,
    setIsFiltersExpanded,
    isCompleting,
    confirmData,
    setConfirmData,
    closeConfirmModal: () => setConfirmData(null),

    // Dataset & State
    tasks,
    sortedTasks,
    loadingTasks,
    activeSidebarFilter,
    activeStatus,
    setActiveStatus,
    activeProject,
    activeTag,

    // Filter/Search/Sort
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy: handleSetSortBy,
    sortLabels: TASK_SORT_LABELS,
    togglePriority,
    clearAllFilters,
    selectedPriorities,

    // Actions
    handleToggleComplete,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleDetachTag,
    handleConfirmAction,
    refreshTasks,
  }
}
