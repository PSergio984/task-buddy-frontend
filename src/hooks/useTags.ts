import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tagsApi, type Tag, type Task } from "@/lib/api"
export type { Tag }
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

/**
 * Reorders an array of items based on a list of IDs.
 * Extracted to reduce function nesting in hooks.
 */
function reorderItems<T extends { id: number }>(
  items: T[],
  orderedIds: number[]
): T[] {
  const itemMap = new Map(items.map((item) => [item.id, item]))
  return orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => !!item)
}

function removeTagFromTask(task: Task, tagId: number): Task {
  if (!task.tags) return task
  return {
    ...task,
    tags: task.tags.filter((t) => t.id !== tagId),
  }
}

function removeTagFromTasks(tasks: Task[], tagId: number): Task[] {
  return tasks.map((task) => removeTagFromTask(task, tagId))
}

export function useTags() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["tags", { userId: user?.id }],
    queryFn: tagsApi.list,
    enabled: !!user,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      silent,
      ...newTag
    }: Parameters<typeof tagsApi.create>[0] & {
      silent?: boolean
      idempotencyKey?: string
    }) => tagsApi.create(newTag, { idempotencyKey }),
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: ["tags"],
      })

      const tempId = Math.random()
      const temp: Tag = {
        id: tempId,
        name: newTag.name,
        color: newTag.color,
        icon: newTag.icon,
        user_id: 0,
        created_at: new Date().toISOString(),
      }

      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(queryKey, [...previousTags, temp])
        }
      })

      return { previousQueries, tempId }
    },
    onError: (_err, _newTag, context) => {
      context?.previousQueries?.forEach(([queryKey, previousTags]) => {
        queryClient.setQueryData(queryKey, previousTags)
      })
    },
    onSuccess: (data, variables, context) => {
      if (context?.tempId !== undefined) {
        const cachedQueries = queryClient.getQueriesData<Tag[]>({
          queryKey: ["tags"],
        })
        cachedQueries.forEach(([queryKey, previousTags]) => {
          if (!previousTags) return
          const updated = previousTags.map((tag) =>
            tag.id === context.tempId ? data : tag
          )
          queryClient.setQueryData<Tag[]>(queryKey, updated)
        })
      }
      if (!variables.silent) {
        toast({
          title: "Tag created",
          description: `Tag "${data.name}" has been created.`,
          variant: "success",
        })
      }
    },
    onSettled: () => {
      // Invalidation removed to prevent race conditions where
      // stale backend data overwrites optimistic updates.
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (variables: number | { id: number; silent?: boolean }) => {
      const id = typeof variables === "number" ? variables : variables.id
      return tagsApi.delete(id)
    },
    onMutate: async (variables) => {
      const id = typeof variables === "number" ? variables : variables.id
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      await queryClient.cancelQueries({ queryKey: ["tasks"] })
      await queryClient.cancelQueries({ queryKey: ["task"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: ["tags"],
      })
      const previousTasksQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks"],
      })
      const previousTaskQueries = queryClient.getQueriesData<Task>({
        queryKey: ["task"],
      })

      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(
            queryKey,
            previousTags.filter((t) => t.id !== id)
          )
        }
      })

      previousTasksQueries.forEach(([queryKey, previousTasks]) => {
        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKey,
            removeTagFromTasks(previousTasks, id)
          )
        }
      })

      previousTaskQueries.forEach(([queryKey, previousTask]) => {
        if (previousTask) {
          queryClient.setQueryData<Task>(
            queryKey,
            removeTagFromTask(previousTask, id)
          )
        }
      })

      return { previousQueries, previousTasksQueries, previousTaskQueries }
    },
    onError: (_err, _id, context) => {
      context?.previousQueries?.forEach(([queryKey, previousTags]) => {
        queryClient.setQueryData(queryKey, previousTags)
      })
      context?.previousTasksQueries?.forEach(([queryKey, previousTasks]) => {
        queryClient.setQueryData(queryKey, previousTasks)
      })
      context?.previousTaskQueries?.forEach(([queryKey, previousTask]) => {
        queryClient.setQueryData(queryKey, previousTask)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      // Also invalidate tasks because they might have this tag
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task"] })
    },
    onSuccess: (_data, variables) => {
      const silent = typeof variables === "object" && variables.silent
      if (!silent) {
        toast({
          title: "Tag deleted",
          description: "Tag has been removed successfully.",
          variant: "success",
        })
      }
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { name?: string; color?: string; icon?: string }
      silent?: boolean
    }) => tagsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: ["tags"],
      })

      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(
            queryKey,
            previousTags.map((t) => (t.id === id ? { ...t, ...data } : t))
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, previousTags]) => {
        queryClient.setQueryData(queryKey, previousTags)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onSuccess: (data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Tag updated",
          description: `Tag "${data.name}" has been updated.`,
          variant: "success",
        })
      }
    },
  })
}

export function useReorderTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.reorder,
    onMutate: async (orderedIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({
        queryKey: ["tags"],
      })

      previousQueries.forEach(([queryKey, previous]) => {
        if (previous) {
          queryClient.setQueryData<Tag[]>(
            queryKey,
            reorderItems(previous, orderedIds)
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _ids, ctx) => {
      ctx?.previousQueries?.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous)
      })
    },
    onSettled: () => {
      // Invalidation removed to prevent race conditions where
      // stale backend data overwrites optimistic updates.
    },
  })
}
