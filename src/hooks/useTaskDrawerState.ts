import { useState, useCallback } from "react"
import { type Task, type TaskPriority } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useTask } from "@/hooks/useTasks"
import { useProjects, useCreateProject } from "@/hooks/useProjects"
import { useTags, useCreateTag } from "@/hooks/useTags"
import { useSubtaskManagement } from "./useSubtaskManagement"
import { useTagManagement } from "./useTagManagement"
import { useProjectManagement } from "./useProjectManagement"
import { useTaskDirtyState } from "./useTaskDirtyState"
import { useTaskDrawerActions } from "./useTaskDrawerActions"

interface UseTaskDrawerStateProps {
  initialTask: Task | null
  mode: "view" | "create"
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function useTaskDrawerState({ initialTask, mode, isOpen, onOpenChange }: UseTaskDrawerStateProps) {
  const { toast } = useToast()
  const { data: fetchedTask } = useTask(initialTask?.id ?? null)
  const task = fetchedTask || initialTask

  const createTagMutation = useCreateTag()
  const createProjectMutation = useCreateProject()
  
  const { data: projects = [] } = useProjects()
  const { data: allTags = [] } = useTags()

  // Core Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [completed, setCompleted] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const isCreate = mode === "create"

  // Sub-hooks for management
  const subtasks = useSubtaskManagement(isCreate, task?.id)
  const tags = useTagManagement(isCreate, allTags, createTagMutation, toast)
  const projectMgmt = useProjectManagement(createProjectMutation, toast)

  const { projectId, setProjectId, setProjectSearch } = projectMgmt

  // Initialization & Reset - Adjusted during render to avoid cascading renders in useEffect
  const [prevTaskId, setPrevTaskId] = useState<number | string | null>(null)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  const currentTaskId = task?.id ?? (isCreate ? "new" : null)

  if (isOpen && (isOpen !== prevIsOpen || currentTaskId !== prevTaskId)) {
    setPrevIsOpen(isOpen)
    setPrevTaskId(currentTaskId)

    const isNew = isCreate || !task
    setTitle(isNew ? "" : task.title)
    setDescription(isNew ? "" : (task.description ?? ""))
    setPriority(isNew ? "MEDIUM" : task.priority)
    setCompleted(isNew ? false : task.completed)
    setProjectId(isNew ? "none" : (task.project_id?.toString() ?? "none"))
    setDueDate(isNew ? undefined : (task.due_date ? new Date(task.due_date) : undefined))
    
    subtasks.resetSubtasks(task)
    tags.resetTags(task)

    setProjectSearch("")
    setShowDeleteConfirm(false)
    setShowSaveConfirm(false)
    setIsEditingTitle(false)
  }

  // Dirty checks
  const dirtyState = useTaskDirtyState({
    task,
    isCreate,
    title,
    description,
    priority,
    completed,
    projectId,
    dueDate,
    localTags: tags.localTags,
    localSubtasks: subtasks.localSubtasks,
  })

  // Actions
  const actions = useTaskDrawerActions({
    task,
    isCreate,
    onOpenChange,
    title,
    description,
    priority,
    completed,
    projectId,
    dueDate,
    localTags: tags.localTags,
    localSubtasks: subtasks.localSubtasks,
    pendingTags: tags.pendingTags,
    pendingSubtasks: subtasks.pendingSubtasks,
  })

  const handleUpdate = useCallback((updates: Partial<Task>) => {
    if (updates.title !== undefined) setTitle(updates.title)
    if (updates.description !== undefined) setDescription(updates.description ?? "")
    if (updates.priority !== undefined) setPriority(updates.priority)
    if (updates.completed !== undefined) setCompleted(updates.completed)
    if (updates.project_id !== undefined) setProjectId(updates.project_id?.toString() ?? "none")
    if (updates.due_date !== undefined) setDueDate(updates.due_date ? new Date(updates.due_date) : undefined)
  }, [setProjectId])

  const handleDateSelect = useCallback((d: Date | undefined, preserveTime = true) => {
    if (!d) {
      setDueDate(undefined)
      return
    }
    
    const newDate = new Date(d)
    if (preserveTime) {
      const current = dueDate || (task?.due_date ? new Date(task.due_date) : new Date())
      newDate.setHours(current.getHours())
      newDate.setMinutes(current.getMinutes())
    }
    setDueDate(newDate)
  }, [dueDate, task])

  return {
    task,
    isCreate,
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    completed, setCompleted,
    dueDate, setDueDate,
    isEditingTitle, setIsEditingTitle,
    ...subtasks,
    ...tags,
    ...projectMgmt,
    showDeleteConfirm, setShowDeleteConfirm,
    showSaveConfirm, setShowSaveConfirm,
    hasChanges: dirtyState.hasChanges,
    isTitleDirty: dirtyState.title,
    isDescriptionDirty: dirtyState.description,
    isPriorityDirty: dirtyState.priority,
    isStatusDirty: dirtyState.status,
    isProjectDirty: dirtyState.project,
    isDueDateDirty: dirtyState.dueDate,
    isTagsDirty: dirtyState.tags,
    isSubtasksDirty: dirtyState.subtasks,
    projects,
    allTags,
    ...actions,
    isCreatingTag: createTagMutation.isPending,
    isCreatingProject: createProjectMutation.isPending,
    handleUpdate,
    handleDateSelect,
    toast,
  }
}

