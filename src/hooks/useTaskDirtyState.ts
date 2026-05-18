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
}: UseTaskDirtyStateProps) {
  return useMemo(() => {
    const isNew = isCreate || !task

    if (isNew) {
      const isTitleDirty = title.trim() !== ""
      const isDescriptionDirty = description.trim() !== ""
      const isPriorityDirty = priority !== "MEDIUM"
      const isStatusDirty = completed !== false
      const isProjectDirty = projectId !== "none"
      const isDueDateDirty = dueDate !== undefined
      const isTagsDirty = localTags.length > 0
      const isSubtasksDirty = localSubtasks.length > 0

      return {
        title: isTitleDirty,
        description: isDescriptionDirty,
        priority: isPriorityDirty,
        status: isStatusDirty,
        project: isProjectDirty,
        dueDate: isDueDateDirty,
        tags: isTagsDirty,
        subtasks: isSubtasksDirty,
        hasChanges: isTitleDirty || isDescriptionDirty || isPriorityDirty || isStatusDirty || isProjectDirty || isDueDateDirty || isTagsDirty || isSubtasksDirty
      }
    }

    const originalTime = task?.due_date ? new Date(task.due_date).getTime() : undefined
    const isDueDateDirty = dueDate?.getTime() !== originalTime

    const checks = {
      title: title !== task?.title,
      description: description !== (task?.description ?? ""),
      priority: priority !== task?.priority,
      status: completed !== task?.completed,
      project: projectId !== (task?.project_id?.toString() ?? "none"),
      dueDate: isDueDateDirty,
      tags: areTagsDirty(localTags, task?.tags || []),
      subtasks: areSubtasksDirty(localSubtasks, task?.subtasks || []),
    }

    return {
      ...checks,
      hasChanges: Object.values(checks).some(Boolean)
    }
  }, [isCreate, task, title, description, priority, completed, projectId, dueDate, localTags, localSubtasks])
}
