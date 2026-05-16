import { useCallback } from "react"
import { type Task, type TaskPriority, type Tag, type Subtask } from "@/lib/api"
import { useUpdateTask, useCreateTask, useDeleteTask } from "@/hooks/useTasks"
import { useToast } from "@/hooks/use-toast"
import { useTaskDrawerSync } from "./useTaskDrawerSync"

export interface UseTaskDrawerActionsProps {
  task: Task | null
  isCreate: boolean
  onClose: () => void
  title: string
  description: string
  priority: TaskPriority
  completed: boolean
  projectId: string
  dueDate: Date | undefined
  localTags: Tag[]
  localSubtasks: Subtask[]
  pendingTags: Tag[]
  pendingSubtasks: { id: string; title: string }[]
}

export interface UseTaskDrawerActionsReturn {
  handleConfirmUpdate: () => Promise<void>
  handleCreate: () => Promise<void>
  handleDelete: () => Promise<void>
  isSaving: boolean
  isCreating: boolean
  isDeleting: boolean
}

export function useTaskDrawerActions({
  task,
  onClose,
  title,
  description,
  priority,
  completed,
  projectId,
  dueDate,
  localTags,
  localSubtasks,
  pendingTags,
  pendingSubtasks,
}: UseTaskDrawerActionsProps): UseTaskDrawerActionsReturn {
  const { toast } = useToast()
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()
  const { syncTags, syncSubtasks, isSyncing } = useTaskDrawerSync()

  const handleConfirmUpdate = useCallback(async () => {
    if (!task) return
    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          completed,
          project_id: projectId === "none" ? undefined : Number.parseInt(projectId, 10),
          due_date: dueDate?.toISOString(),
        }
      })

      await syncTags(task.id, localTags, task.tags || [])
      await syncSubtasks(task.id, localSubtasks, task.subtasks || [])

      toast({ title: "Changes saved", variant: "success" })
      onClose()
    } catch {
      toast({ title: "Failed to save changes", variant: "destructive" })
    }
  }, [task, title, description, priority, completed, projectId, dueDate, localTags, localSubtasks, updateTask, syncTags, syncSubtasks, toast, onClose])

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        project_id: projectId === "none" ? undefined : Number.parseInt(projectId, 10),
        due_date: dueDate?.toISOString(),
        completed: false,
        tags: pendingTags.map(t => t.name),
        subtasks: pendingSubtasks.map(st => ({ title: st.title }))
      })
      toast({ title: "Task created!", variant: "success" })
      onClose()
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" })
    }
  }, [title, description, priority, projectId, dueDate, pendingTags, pendingSubtasks, createTask, toast, onClose])

  const handleDelete = useCallback(async () => {
    if (!task) return
    try {
      await deleteTask.mutateAsync(task.id)
      toast({ title: "Task deleted", variant: "success" })
      onClose()
    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }, [task, deleteTask, toast, onClose])

  return {
    handleConfirmUpdate,
    handleCreate,
    handleDelete,
    isSaving: updateTask.isPending || isSyncing,
    isCreating: createTask.isPending,
    isDeleting: deleteTask.isPending,
  }
}

