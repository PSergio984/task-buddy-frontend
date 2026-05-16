import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi, subtasksApi, tagsApi, type Task, type Subtask, type Tag } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

/**
 * Reorders an array of items based on a list of IDs.
 */
function reorderItems<T extends { id: number }>(items: T[], orderedIds: number[]): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]))
  return orderedIds
    .map(id => itemMap.get(id))
    .filter((item): item is T => !!item)
}

/**
 * Helper to update a task in a list of tasks.
 */
function updateTaskInList(tasks: Task[], id: number, updates: Partial<Task>): Task[] {
  return tasks.map(task => (task.id === id ? { ...task, ...updates } : task))
}

/**
 * Helper to update a subtask within a specific task.
 */
function updateSubtaskInTask(task: Task, subtaskId: number, updates: Partial<Subtask>): Task {
  if (!task.subtasks) return task
  return {
    ...task,
    subtasks: task.subtasks.map(s => (s.id === subtaskId ? { ...s, ...updates } : s)),
  }
}

/**
 * Helper to update a subtask across all tasks in a list.
 */
function updateSubtaskInTasks(tasks: Task[], subtaskId: number, updates: Partial<Subtask>): Task[] {
  return tasks.map(task => updateSubtaskInTask(task, subtaskId, updates))
}

/**
 * Helper to remove a subtask from a specific task.
 */
function removeSubtaskFromTask(task: Task, subtaskId: number): Task {
  if (!task.subtasks) return task
  return {
    ...task,
    subtasks: task.subtasks.filter(s => s.id !== subtaskId),
  }
}

/**
 * Helper to remove a subtask across all tasks in a list.
 */
function removeSubtaskFromTasks(tasks: Task[], subtaskId: number): Task[] {
  return tasks.map(task => removeSubtaskFromTask(task, subtaskId))
}

/**
 * Helper to add a tag to a task in a list.
 */
function addTagToTaskInList(tasks: Task[], taskId: number, tag: Tag): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, tags: [...(task.tags || []), tag] } : task
  )
}

/**
 * Helper to remove a tag from a task in a list.
 */
function removeTagFromTaskInList(tasks: Task[], taskId: number, tagId: number): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, tags: task.tags?.filter(t => t.id !== tagId) } : task
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
function addSubtaskToTasks(tasks: Task[], taskId: number, subtask: Subtask): Task[] {
  return tasks.map(task => (task.id === taskId ? addSubtaskToTask(task, subtask) : task))
}



export function useTasks(filter?: string, project_id?: number, tag_id?: number) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["tasks", { filter, project_id, tag_id }],
    queryFn: () => tasksApi.list(filter, project_id, tag_id),
    enabled: !!user,
  })
}

export function useTask(id: number | null) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => id ? tasksApi.get(id) : null,
    enabled: !!user && !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: tasksApi.create,
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])

      if (previousTasks) {
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
        queryClient.setQueryData<Task[]>(["tasks"], [tempTask, ...previousTasks])
      }

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onSuccess: (data) => {
      toast({
        title: "Task created",
        description: `Task "${data.title}" has been created.`,
        variant: "success",
      })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Task> }) =>
      tasksApi.update(id, updates),
    // Optimistic Update
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task", id] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      const previousTask = queryClient.getQueryData<Task>(["task", id])

      // Optimistically update to the new value in the list
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], updateTaskInList(previousTasks, id, updates))
      }

      // Optimistically update the detail view
      if (previousTask) {
        queryClient.setQueryData<Task>(["task", id], { ...previousTask, ...updates })
      }

      // Return a context object with the snapshotted value
      return { previousTasks, previousTask }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, { id }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["task", id], context.previousTask)
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] })
    },
    onSuccess: (data) => {
      toast({
        title: "Task updated",
        description: `Task "${data.title}" has been updated.`,
        variant: "success",
      })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: tasksApi.delete,
    // Optimistic Update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task", id] })
      
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], previousTasks.filter((task) => task.id !== id))
      }

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
        variant: "success",
      })
    }
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Subtask> }) =>
      subtasksApi.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      
      // Update in ["tasks"] list
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], updateSubtaskInTasks(previousTasks, id, updates))
      }

      // Note: Detail update is more complex because it could be any task.
      // For now, we only update the list which is most common.
      // If we want to update all cached task details, we can use setQueriesData but that's Level 3.

      return { previousTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      if (data?.task_id) {
        queryClient.invalidateQueries({ queryKey: ["task", data.task_id] })
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Subtask updated",
        description: `Subtask "${data.title}" has been updated.`,
        variant: "success",
      })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: subtasksApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], removeSubtaskFromTasks(previousTasks, id))
      }

      return { previousTasks }
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: () => {
      toast({
        title: "Subtask deleted",
        description: "Subtask has been removed.",
        variant: "success",
      })
    },
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: number; title: string; completed?: boolean; description?: string; due_date?: string }) =>
      subtasksApi.create(taskId, data),
    onMutate: async ({ taskId, title, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task", taskId] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      const previousTask = queryClient.getQueryData<Task>(["task", taskId])

      const tempSub: Subtask = {
        id: Math.random(),
        task_id: taskId,
        title,
        completed: completed ?? false,
        created_at: new Date().toISOString()
      }

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], addSubtaskToTasks(previousTasks, taskId, tempSub))
      }

      if (previousTask) {
        queryClient.setQueryData<Task>(["task", taskId], addSubtaskToTask(previousTask, tempSub))
      }

      return { previousTasks, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask)
      }
    },
    onSettled: (data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
    },
    onSuccess: (data) => {
      toast({
        title: "Subtask created",
        description: `Subtask "${data.title}" has been created.`,
        variant: "success",
      })
    },
  })
}

export function useReorderSubtasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, orderedIds }: { taskId: number; orderedIds: number[] }) =>
      subtasksApi.reorder(taskId, orderedIds),
    onMutate: async ({ taskId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] })
      const previousTask = queryClient.getQueryData<Task>(["task", taskId])

      if (previousTask?.subtasks) {
        queryClient.setQueryData<Task>(["task", taskId], {
          ...previousTask,
          subtasks: reorderItems(previousTask.subtasks, orderedIds)
        })
      }

      return { previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask)
      }
    },
    onSettled: (_, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
    },
    onSuccess: () => {
      toast({
        title: "Subtasks reordered",
        description: "Your subtask order has been saved.",
        variant: "success",
      })
    },
  })
}

export function useAttachTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: number; tagId: number }) =>
      tagsApi.attach(taskId, tagId),
    onMutate: async ({ taskId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task", taskId] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      const previousTask = queryClient.getQueryData<Task>(["task", taskId])
      const allTags = queryClient.getQueryData<Tag[]>(["tags"])
      const tag = allTags?.find(t => t.id === tagId)

      if (!tag) return { previousTasks, previousTask }

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], addTagToTaskInList(previousTasks, taskId, tag))
      }

      if (previousTask) {
        queryClient.setQueryData<Task>(["task", taskId], {
          ...previousTask,
          tags: [...(previousTask.tags || []), tag]
        })
      }

      return { previousTasks, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask)
      }
    },
    onSettled: (_, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
    },
    onSuccess: () => {
      toast({
        title: "Tag attached",
        description: "Tag has been added to the task.",
        variant: "success",
      })
    },
  })
}

export function useDetachTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: number; tagId: number }) =>
      tagsApi.detach(taskId, tagId),
    onMutate: async ({ taskId, tagId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task", taskId] })

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])
      const previousTask = queryClient.getQueryData<Task>(["task", taskId])

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], removeTagFromTaskInList(previousTasks, taskId, tagId))
      }

      if (previousTask) {
        queryClient.setQueryData<Task>(["task", taskId], {
          ...previousTask,
          tags: previousTask.tags?.filter(t => t.id !== tagId)
        })
      }

      return { previousTasks, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(["task", taskId], context.previousTask)
      }
    },
    onSettled: (_, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
    },
    onSuccess: () => {
      toast({
        title: "Tag detached",
        description: "Tag has been removed from the task.",
        variant: "success",
      })
    },
  })
}
