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
import { useTaskDrawerActions, type UseTaskDrawerActionsProps } from "./useTaskDrawerActions"

interface UseTaskDrawerStateProps {
  initialTask: Task | null
  mode: "view" | "create"
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export function useTaskDrawerState({ initialTask, mode, isOpen, onClose }: UseTaskDrawerStateProps) {
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

  const resetForm = () => {
    const isNew = isCreate || !task
    setTitle(isNew ? "" : task.title)
    setDescription(isNew ? "" : (task.description ?? ""))
    setPriority(isNew ? "MEDIUM" : task.priority)
    setCompleted(isNew ? false : task.completed)
    
    const initialProjectId = isNew ? "none" : (task.project_id?.toString() ?? "none")
    setProjectId(initialProjectId)
    
    let initialDueDate: Date | undefined = undefined
    if (!isNew && task.due_date) {
      initialDueDate = new Date(task.due_date)
    }
    setDueDate(initialDueDate)
    
    subtasks.resetSubtasks(task)
    tags.resetTags(task)

    setProjectSearch("")
    setShowDeleteConfirm(false)
    setShowSaveConfirm(false)
    setIsEditingTitle(false)
  }

  if (isOpen && (isOpen !== prevIsOpen || currentTaskId !== prevTaskId)) {
    setPrevIsOpen(isOpen)
    setPrevTaskId(currentTaskId)
    resetForm()
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
  const actionsProps: UseTaskDrawerActionsProps = {
    task,
    isCreate,
    onClose,
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
  }
  const actions = useTaskDrawerActions(actionsProps)

  const handleUpdate = useCallback((updates: Partial<Task>) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return

      switch (key) {
        case "title": setTitle(value as string); break
        case "description": setDescription((value as string) ?? ""); break
        case "priority": setPriority(value as TaskPriority); break
        case "completed": setCompleted(value as boolean); break
        case "project_id": setProjectId((value as number)?.toString() ?? "none"); break
        case "due_date": setDueDate(value ? new Date(value as string) : undefined); break
      }
    })
  }, [setProjectId])

  const handleDateSelect = useCallback((d: Date | undefined, preserveTime = true) => {
    if (!d) return setDueDate(undefined)
    
    const newDate = new Date(d)
    if (preserveTime) {
      const taskDate = task?.due_date ? new Date(task.due_date) : new Date()
      const current = dueDate || taskDate
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
    actions,
    isCreatingTag: createTagMutation.isPending,
    isCreatingProject: createProjectMutation.isPending,
    handleUpdate,
    handleDateSelect,
    toast,
  }
}

