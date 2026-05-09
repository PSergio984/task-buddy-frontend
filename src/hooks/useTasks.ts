import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi, subtasksApi, tagsApi, type Task, type Subtask } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function useTasks(filter?: string, group_id?: number, tag_id?: number) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["tasks", { filter, group_id, tag_id }],
    queryFn: () => tasksApi.list(filter, group_id, tag_id),
    enabled: !!user,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
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
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
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
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Subtask> }) =>
      subtasksApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: subtasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDetachTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: number; tagId: number }) =>
      tagsApi.detach(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
