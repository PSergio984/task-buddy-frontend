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

const getDirtyValue = <T>(isNew: boolean, current: T, original: T, compare?: (a: T, b: T) => boolean) => {
  if (isNew) return false
  return compare ? compare(current, original) : current !== original
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
}: UseTaskDirtyStateProps) {
  return useMemo(() => {
    const isNew = isCreate || !task
    const originalTime = task?.due_date ? new Date(task.due_date).getTime() : undefined
    const isDueDateDirty = getDirtyValue(isNew, dueDate?.getTime(), originalTime)

    const checks = {
      title: getDirtyValue(isNew, title, task?.title),
      description: getDirtyValue(isNew, description, task?.description ?? ""),
      priority: getDirtyValue(isNew, priority, task?.priority),
      status: getDirtyValue(isNew, completed, task?.completed),
      project: getDirtyValue(isNew, projectId, task?.project_id?.toString() ?? "none"),
      dueDate: isDueDateDirty,
      tags: getDirtyValue(isNew, localTags, task?.tags || [], areTagsDirty),
      subtasks: getDirtyValue(isNew, localSubtasks, task?.subtasks || [], areSubtasksDirty),
    }

    return {
      ...checks,
      hasChanges: Object.values(checks).some(Boolean)
    }
  }, [isCreate, task, title, description, priority, completed, projectId, dueDate, localTags, localSubtasks])
}
