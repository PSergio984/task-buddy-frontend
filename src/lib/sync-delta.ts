export interface SyncDelta {
  tasks: Record<string, unknown>[]
  subtasks: Record<string, unknown>[]
  projects: Record<string, unknown>[]
}

export interface SyncConflict {
  entity: "task" | "subtask" | "project"
  id: number
  op: "update" | "delete"
  server_state?: Record<string, unknown>
}

export interface CacheShape {
  tasks: Record<string, unknown>[]
  projects: Record<string, unknown>[]
}

export function mergeConflictsIntoDelta(
  delta: SyncDelta,
  conflicts: SyncConflict[]
): SyncDelta {
  const merged = {
    tasks: [...delta.tasks],
    subtasks: [...delta.subtasks],
    projects: [...delta.projects],
  }
  for (const conflict of conflicts) {
    if (!conflict.server_state) continue
    const section =
      conflict.entity === "task"
        ? merged.tasks
        : conflict.entity === "subtask"
          ? merged.subtasks
          : merged.projects
    const index = section.findIndex((row) => Number(row.id) === conflict.id)
    if (index >= 0) {
      section[index] = { ...section[index], ...conflict.server_state }
    } else {
      section.push(conflict.server_state)
    }
  }
  return merged
}

function mergeById(
  list: Record<string, unknown>[],
  incoming: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (incoming.length === 0) return list
  const byId = new Map<number, Record<string, unknown>>()
  for (const item of list) {
    const id = Number(item.id)
    if (Number.isFinite(id)) byId.set(id, item)
  }
  for (const item of incoming) {
    byId.set(Number(item.id), item)
  }
  return [...byId.values()]
}

function mergeSubtasksIntoTasks(
  tasks: Record<string, unknown>[],
  subtasks: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (subtasks.length === 0) return tasks
  const byTaskId = new Map<number, Record<string, unknown>[]>()
  for (const sub of subtasks) {
    const taskId = Number(sub.task_id)
    if (!Number.isFinite(taskId)) continue
    const list = byTaskId.get(taskId) ?? []
    list.push(sub)
    byTaskId.set(taskId, list)
  }
  return tasks.map((task) => {
    const id = Number(task.id)
    const subs = byTaskId.get(id)
    if (!subs) return task
    const existing = Array.isArray(task.subtasks)
      ? (task.subtasks as Record<string, unknown>[])
      : []
    return { ...task, subtasks: mergeById(existing, subs) }
  })
}

export function applyDeltaToCache(
  cache: CacheShape,
  delta: SyncDelta
): CacheShape {
  const tasks = mergeSubtasksIntoTasks(
    mergeById(cache.tasks, delta.tasks),
    delta.subtasks
  )
  const projects = mergeById(cache.projects, delta.projects)
  return { tasks, projects }
}
