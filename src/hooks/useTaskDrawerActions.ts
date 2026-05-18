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

    // Validate tag limit
    if (localTags.length > 10) {
      toast({
        title: "Too many tags",
        description: "A task can have a maximum of 10 tags.",
        variant: "destructive"
      })
      return
    }

    try {
      const updates: Partial<Task> = {}

      if (title.trim() !== task.title) updates.title = title.trim()

      const currentDesc = task.description ?? ""
      const newDesc = description.trim()
      if (newDesc !== currentDesc) {
        // If the new description is empty, explicitly set it to null or empty string if that's what the backend expects
        // Based on the schema, description is Optional[str] = Field(None, max_length=2000)
        updates.description = newDesc || ""
      }

      if (priority !== task.priority) updates.priority = priority
      if (completed !== task.completed) updates.completed = completed

      const currentProjId = task.project_id?.toString() ?? "none"
      if (projectId !== currentProjId) {
        updates.project_id = projectId === "none" ? undefined : Number.parseInt(projectId, 10)
      }

      const originalTime = task.due_date ? new Date(task.due_date).getTime() : undefined
      const newTime = dueDate?.getTime()
      if (newTime !== originalTime) {
        updates.due_date = dueDate?.toISOString()
      }

      // Filter out undefined values to prevent empty object if only undefined keys were added
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter((entry) => entry[1] !== undefined)
      )

      if (Object.keys(cleanUpdates).length > 0) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: cleanUpdates,
          silent: true
        })
      }

      await syncTags(task.id, localTags, task.tags || [], true)
      await syncSubtasks(task.id, localSubtasks, task.subtasks || [], true)

      toast({ title: "Changes saved", variant: "success" })
      onClose()
    } catch (err) {
      console.error("Update failed:", err)
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
        subtasks: pendingSubtasks.map(st => ({ title: st.title })),
        silent: true
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
      await deleteTask.mutateAsync({ id: task.id, silent: true })
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

