import { useMemo } from "react"
import { type Task, type TaskPriority, type Tag, type Subtask } from "@/lib/api"

const areTagsDirty = (local: Tag[], original: Tag[]) => 
  local.length !== original.length || 
  local.some(lt => !original.some(ot => ot.id === lt.id))

const areSubtasksDirty = (local: Subtask[], original: Subtask[]) => {
  if (local.length !== original.length) return true
  return local.some((ls, i) => {
    const os = original[i]
    return ls.id !== os?.id || ls.title !== os?.title || ls.completed !== os?.completed
  })
}

interface UseTaskDirtyStateProps {
  task: Task | null
  isCreate: boolean
  title: string
  description: string
  priority: TaskPriority
  completed: boolean
  projectId: string
  dueDate: Date | undefined
  localTags: Tag[]
  localSubtasks: Subtask[]
}

export function useTaskDirtyState({
  task,
  isCreate,
  title,
  description,
  priority,
  completed,
  projectId,
  dueDate,
  localTags,
  localSubtasks,
}: UseTaskDirtyStateProps): {
  title: boolean
  description: boolean
  priority: boolean
  status: boolean
  project: boolean
  dueDate: boolean
  tags: boolean
  subtasks: boolean
  hasChanges: boolean
} {
  return useMemo(() => {
    const isNew = isCreate || !task
    
    const checks = {
      title: !isNew && task ? title !== task.title : false,
      description: !isNew && task ? description !== (task.description ?? "") : false,
      priority: !isNew && task ? priority !== task.priority : false,
      status: !isNew && task ? completed !== task.completed : false,
      project: !isNew && task ? projectId !== (task.project_id?.toString() ?? "none") : false,
      dueDate: !isNew && task ? dueDate?.getTime() !== (task.due_date ? new Date(task.due_date).getTime() : undefined) : false,
      tags: !isNew && task ? areTagsDirty(localTags, task.tags || []) : false,
      subtasks: !isNew && task ? areSubtasksDirty(localSubtasks, task.subtasks || []) : false,
    }

    return {
      title: checks.title,
      description: checks.description,
      priority: checks.priority,
      status: checks.status,
      project: checks.project,
      dueDate: checks.dueDate,
      tags: checks.tags,
      subtasks: checks.subtasks,
      hasChanges: Object.values(checks).some(Boolean)
    }
  }, [isCreate, task, title, description, priority, completed, projectId, dueDate, localTags, localSubtasks])
}
