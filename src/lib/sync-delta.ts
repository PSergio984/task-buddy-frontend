export interface SyncDelta {
  tasks: Record<string, unknown>[]
  subtasks: Record<string, unknown>[]
  projects: Record<string, unknown>[]
}

export interface CacheShape {
  tasks: Record<string, unknown>[]
  projects: Record<string, unknown>[]
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
