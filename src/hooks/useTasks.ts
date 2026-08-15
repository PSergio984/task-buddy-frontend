import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  tasksApi,
  subtasksApi,
  tagsApi,
  type Task,
  type Subtask,
  type Tag,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useSync } from "@/contexts/SyncContext"

/**
 * Reorders an array of items based on a list of IDs.
 */
function reorderItems<T extends { id: number }>(
  items: T[],
  orderedIds: number[]
): T[] {
  const itemMap = new Map(items.map((item) => [item.id, item]))
  const reordered = orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => !!item)

  // Keep temp items that were optimistically created (non-integer IDs like Math.random())
  const tempItems = items.filter((item) => !Number.isInteger(item.id))

  // Avoid duplicating items if somehow they were both temp and in orderedIds
  const reorderedIds = new Set(reordered.map((i) => i.id))
  const uniqueTempItems = tempItems.filter((item) => !reorderedIds.has(item.id))

  return [...reordered, ...uniqueTempItems]
}

/**
 * Helper to update a task in a list of tasks.
 */
function updateTaskInList(
  tasks: Task[],
  id: number,
  updates: Partial<Task>
): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
}

/**
 * Helper to update a subtask within a specific task.
 */
function updateSubtaskInTask(
  task: Task,
  subtaskId: number,
  updates: Partial<Subtask>
): Task {
  if (!task.subtasks) return task
  return {
    ...task,
    subtasks: task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, ...updates } : s
    ),
  }
}

/**
 * Helper to update a subtask across all tasks in a list.
 */
function updateSubtaskInTasks(
  tasks: Task[],
  subtaskId: number,
  updates: Partial<Subtask>
): Task[] {
  return tasks.map((task) => updateSubtaskInTask(task, subtaskId, updates))
}

/**
 * Helper to remove a subtask from a specific task.
 */
function removeSubtaskFromTask(task: Task, subtaskId: number): Task {
  if (!task.subtasks) return task
  return {
    ...task,
    subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
  }
}

/**
 * Helper to remove a subtask across all tasks in a list.
 */
function removeSubtaskFromTasks(tasks: Task[], subtaskId: number): Task[] {
  return tasks.map((task) => removeSubtaskFromTask(task, subtaskId))
}

/**
 * Helper to add a tag to a task in a list.
 */
function addTagToTaskInList(tasks: Task[], taskId: number, tag: Tag): Task[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      const hasTag = task.tags?.some((t) => t.id === tag.id)
      if (hasTag) return task
      return { ...task, tags: [...(task.tags || []), tag] }
    }
    return task
  })
}

/**
 * Helper to remove a tag from a task in a list.
 */
function removeTagFromTaskInList(
  tasks: Task[],
  taskId: number,
  tagId: number
): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, tags: task.tags?.filter((t) => t.id !== tagId) }
      : task
  )
}

/**
 * Helper to add a subtask to a specific task.
 */
function addSubtaskToTask(task: Task, subtask: Subtask): Task {
  return {
    ...task,
    subtasks: [...(task.subtasks || []), subtask],
  }
}

/**
 * Helper to add a subtask across all tasks in a list.
 */
function addSubtaskToTasks(
  tasks: Task[],
  taskId: number,
  subtask: Subtask
): Task[] {
  return tasks.map((task) =>
    task.id === taskId ? addSubtaskToTask(task, subtask) : task
  )
}

export function useTasks(
  filter?: string,
  project_id?: number,
  tag_id?: number
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["tasks", { userId: user?.id, filter, project_id, tag_id }],
    queryFn: () => tasksApi.list(filter, project_id, tag_id),
    enabled: !!user,
  })
}

export function useTask(id: number | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["task", { userId: user?.id, id }],
    queryFn: () => (id ? tasksApi.get(id) : null),
    enabled: !!user && !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      silent: _silent,
      ...newTaskData
    }: Parameters<typeof tasksApi.create>[0] & {
      silent?: boolean
      idempotencyKey?: string
    }) => tasksApi.create(newTaskData, { idempotencyKey }),
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })

      const tempTask: Task = {
        id: Math.random(),
        title: newTaskData.title,
        description: newTaskData.description,
        completed: newTaskData.completed ?? false,
        priority: newTaskData.priority ?? "MEDIUM",
        project_id: newTaskData.project_id,
        due_date: newTaskData.due_date,
        created_at: new Date().toISOString(),
        user_id: 0,
      }

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(queryKey, [
            tempTask,
            ...previousTasks,
          ])
        }
      })

      return { previousTasksQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onSuccess: (data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Task created",
          description: `Task "${data.title}" has been created.`,
          variant: "success",
        })
      }
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { enqueueOrCall } = useSync()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number
      updates: Partial<Task>
      silent?: boolean
    }) =>
      enqueueOrCall(
        {
          entity: "task",
          id,
          op: "update",
          payload: updates,
          client_updated_at: new Date().toISOString(),
        },
        () => tasksApi.update(id, updates)
      ),
    // Optimistic Update
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      // Snapshot the previous value
      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      // Optimistically update to the new value in the list
      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            updateTaskInList(previousTasks, id, updates)
          )
        }
      })

      // Optimistically update the detail view
      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        const queryKeyObj = queryKey[1] as { id?: number } | undefined
        if (queryKeyObj?.id === id && previousTask) {
          queryClient.setQueryData<Task>(queryKey, {
            ...previousTask,
            ...updates,
          })
        }
      })

      // Return a context object with the snapshotted value
      return { previousTasksQueries, previousTaskQueries }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (result, variables) => {
      if (!variables.silent) {
        if (result.queued) {
          toast({
            title: "Task updated offline",
            description: `Task update saved locally and will sync automatically.`,
            variant: "info",
          })
          return
        }
        const data = result.data
        if (data) {
          toast({
            title: "Task updated",
            description: `Task "${data.title}" has been updated.`,
            variant: "success",
          })
        }
      }
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { enqueueOrCall } = useSync()

  return useMutation({
    mutationFn: (variables: number | { id: number; silent?: boolean }) => {
      const id = typeof variables === "number" ? variables : variables.id
      return enqueueOrCall(
        {
          entity: "task",
          id,
          op: "delete",
          payload: {},
          client_updated_at: new Date().toISOString(),
        },
        () => tasksApi.delete(id)
      )
    },
    // Optimistic Update
    onMutate: async (variables) => {
      const id = typeof variables === "number" ? variables : variables.id
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            previousTasks.filter((task) => task.id !== id)
          )
        }
      })

      return { previousTasksQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onSuccess: (result, variables) => {
      const silent =
        typeof variables === "object" &&
        variables !== null &&
        "silent" in variables &&
        (variables as { silent?: boolean }).silent
      if (!silent) {
        if (result.queued) {
          toast({
            title: "Task deleted offline",
            description:
              "Task deletion saved locally and will sync automatically.",
            variant: "info",
          })
          return
        }
        toast({
          title: "Task deleted",
          description: "Task has been removed successfully.",
          variant: "success",
        })
      }
    },
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { enqueueOrCall } = useSync()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number
      updates: Partial<Subtask>
      silent?: boolean
    }) =>
      enqueueOrCall(
        {
          entity: "subtask",
          id,
          op: "update",
          payload: updates,
          client_updated_at: new Date().toISOString(),
        },
        () => subtasksApi.update(id, updates)
      ),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      // Update in ["tasks"] list
      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            updateSubtaskInTasks(previousTasks, id, updates)
          )
        }
      })

      // Also try to find the task this subtask belongs to and update its detail query
      previousTasksQueries.forEach(([, previousTasks]) => {
        if (previousTasks) {
          for (const task of previousTasks) {
            if (task.subtasks?.some((s) => s.id === id)) {
              previousTaskQueries.forEach(([queryKey, previousTask]) => {
                const queryKeyObj = queryKey[1] as { id?: number } | undefined
                if (queryKeyObj?.id === task.id && previousTask) {
                  queryClient.setQueryData<Task>(
                    queryKey,
                    updateSubtaskInTask(previousTask, id, updates)
                  )
                }
              })
              break
            }
          }
        }
      })

      return { previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (result, variables) => {
      if (!variables.silent) {
        if (result.queued) {
          toast({
            title: "Subtask updated offline",
            description: `Subtask update saved locally and will sync automatically.`,
            variant: "info",
          })
          return
        }
        const data = result.data
        if (data?.title) {
          toast({
            title: "Subtask updated",
            description: `Subtask "${data.title}" has been updated.`,
            variant: "success",
          })
        }
      }
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { enqueueOrCall } = useSync()

  return useMutation({
    mutationFn: (id: number | { id: number; silent?: boolean }) => {
      const subtaskId = typeof id === "number" ? id : id.id
      return enqueueOrCall(
        {
          entity: "subtask",
          id: subtaskId,
          op: "delete",
          payload: {},
          client_updated_at: new Date().toISOString(),
        },
        () => subtasksApi.delete(subtaskId)
      )
    },
    onMutate: async (variables) => {
      const id = typeof variables === "number" ? variables : variables.id
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            removeSubtaskFromTasks(previousTasks, id)
          )
        }
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        if (previousTask && previousTask.subtasks?.some((s) => s.id === id)) {
          queryClient.setQueryData<Task>(queryKey, {
            ...previousTask,
            subtasks: previousTask.subtasks.filter((s) => s.id !== id),
          })
        }
      })

      return { previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _id, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (result, variables) => {
      const silent = typeof variables === "object" && variables.silent
      if (!silent) {
        if (result.queued) {
          toast({
            title: "Subtask deleted offline",
            description:
              "Subtask deletion saved locally and will sync automatically.",
            variant: "info",
          })
          return
        }
        toast({
          title: "Subtask deleted",
          description: "Subtask has been removed.",
          variant: "success",
        })
      }
    },
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      taskId,
      ...data
    }: {
      taskId: number
      title: string
      completed?: boolean
      description?: string
      due_date?: string
      silent?: boolean
    }) => subtasksApi.create(taskId, data),
    onMutate: async ({ taskId, title, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      const tempSub: Subtask = {
        id: Math.random(),
        task_id: taskId,
        title,
        completed: completed ?? false,
        created_at: new Date().toISOString(),
      }

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            addSubtaskToTasks(previousTasks, taskId, tempSub)
          )
        }
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        const queryKeyObj = queryKey[1] as { id?: number } | undefined
        if (queryKeyObj?.id === taskId && previousTask) {
          queryClient.setQueryData<Task>(
            queryKey,
            addSubtaskToTask(previousTask, tempSub)
          )
        }
      })

      return { previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Subtask created",
          description: `Subtask "${data.title}" has been created.`,
          variant: "success",
        })
      }
    },
  })
}

export function useReorderSubtasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      taskId,
      orderedIds,
    }: {
      taskId: number
      orderedIds: number[]
      silent?: boolean
    }) => subtasksApi.reorder(taskId, orderedIds),
    onMutate: async ({ taskId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["task"] })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        const queryKeyObj = queryKey[1] as { id?: number } | undefined
        if (queryKeyObj?.id === taskId && previousTask?.subtasks) {
          queryClient.setQueryData<Task>(queryKey, {
            ...previousTask,
            subtasks: reorderItems(previousTask.subtasks, orderedIds),
          })
        }
      })

      return { previousTaskQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (_data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Subtasks reordered",
          description: "Your subtask order has been saved.",
          variant: "success",
        })
      }
    },
  })
}

export function useAttachTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      taskId,
      tagId,
    }: {
      taskId: number
      tagId: number
      silent?: boolean
    }) => tagsApi.attach(taskId, tagId),
    onMutate: async ({ taskId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })
      const allTagsQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: ["tags"],
      })

      let tag: Tag | undefined
      for (const [, tags] of allTagsQueries) {
        if (tags) {
          tag = tags.find((t) => t.id === tagId)
          if (tag) break
        }
      }

      if (!tag) return { previousTasksQueries, previousTaskQueries }

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            addTagToTaskInList(previousTasks, taskId, tag!)
          )
        }
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        const queryKeyObj = queryKey[1] as { id?: number } | undefined
        if (queryKeyObj?.id === taskId && previousTask) {
          const hasTag = previousTask.tags?.some((t) => t.id === tag!.id)
          if (!hasTag) {
            queryClient.setQueryData<Task>(queryKey, {
              ...previousTask,
              tags: [...(previousTask.tags || []), tag!],
            })
          }
        }
      })

      return { previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (_data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Tag attached",
          description: "Tag has been added to the task.",
          variant: "success",
        })
      }
    },
  })
}

export function useDetachTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      taskId,
      tagId,
    }: {
      taskId: number
      tagId: number
      silent?: boolean
    }) => tagsApi.detach(taskId, tagId),
    onMutate: async ({ taskId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            removeTagFromTaskInList(previousTasks, taskId, tagId)
          )
        }
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        const queryKeyObj = queryKey[1] as { id?: number } | undefined
        if (queryKeyObj?.id === taskId && previousTask) {
          queryClient.setQueryData<Task>(queryKey, {
            ...previousTask,
            tags: previousTask.tags?.filter((t) => t.id !== tagId),
          })
        }
      })

      return { previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: (result) => {
      if ((result as { queued?: boolean } | null | undefined)?.queued) {
        // Offline: a refetch would overwrite the optimistic value with
        // pre-change server state; the flush's delta merge reconciles later.
        return
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (_data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Tag detached",
          description: "Tag has been removed from the task.",
          variant: "success",
        })
      }
    },
  })
}
