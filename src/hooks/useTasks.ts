import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi, subtasksApi, tagsApi, type Task, type Subtask } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

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

      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        const tempTask: Task = {
          id: Math.random(), // Temporary ID
          title: newTaskData.title,
          description: newTaskData.description,
          completed: newTaskData.completed ?? false,
          priority: newTaskData.priority ?? "MEDIUM",
          project_id: newTaskData.project_id,
          due_date: newTaskData.due_date,
          created_at: new Date().toISOString(),
          user_id: 0, // Placeholder
        }
        return old ? [tempTask, ...old] : [tempTask]
      })

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

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])

      // Optimistically update to the new value
      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return []
        return old.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        )
      })

      // Return a context object with the snapshotted value
      return { previousTasks }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks)
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
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"])

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return []
        return old.filter((task) => task.id !== id)
      })

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
      toast({
        title: "Subtasks reordered",
        description: "Your subtask order has been saved.",
        variant: "success",
      })
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: { name: string; color?: string; icon?: string }) => tagsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast({
        title: "Tag created",
        description: `Tag "${data.name}" has been created.`,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
      toast({
        title: "Tag detached",
        description: "Tag has been removed from the task.",
        variant: "success",
      })
    },
  })
}
