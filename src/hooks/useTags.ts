import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tagsApi, type Tag } from "@/lib/api"
export type { Tag }
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

/**
 * Reorders an array of items based on a list of IDs.
 * Extracted to reduce function nesting in hooks.
 */
function reorderItems<T extends { id: number }>(items: T[], orderedIds: number[]): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]))
  return orderedIds
    .map(id => itemMap.get(id))
    .filter((item): item is T => !!item)
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
    mutationFn: (newTag: Parameters<typeof tagsApi.create>[0] & { silent?: boolean }) => 
      tagsApi.create(newTag),
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({ queryKey: ["tags"] })
      
      const temp: Tag = {
        id: Math.random(),
        name: newTag.name,
        color: newTag.color,
        icon: newTag.icon,
        user_id: 0,
        created_at: new Date().toISOString()
      }
      
      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(queryKey, [...previousTags, temp])
        }
      })
      
      return { previousQueries }
    },
    onError: (_err, _newTag, context) => {
      context?.previousQueries?.forEach(([queryKey, previousTags]) => {
        queryClient.setQueryData(queryKey, previousTags)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
    onSuccess: (data, variables) => {
      if (!variables.silent) {
        toast({
          title: "Tag created",
          description: `Tag "${data.name}" has been created.`,
          variant: "success",
        })
      }
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (variables: number | { id: number; silent?: boolean }) => {
      const id = typeof variables === 'number' ? variables : variables.id
      return tagsApi.delete(id)
    },
    onMutate: async (variables) => {
      const id = typeof variables === 'number' ? variables : variables.id
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({ queryKey: ["tags"] })
      
      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(queryKey, previousTags.filter(t => t.id !== id))
        }
      })
      
      return { previousQueries }
    },
    onError: (_err, _id, context) => {
      context?.previousQueries?.forEach(([queryKey, previousTags]) => {
        queryClient.setQueryData(queryKey, previousTags)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      // Also invalidate tasks because they might have this tag
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onSuccess: (_data, variables) => {
      const silent = typeof variables === 'object' && variables.silent
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
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string; icon?: string }; silent?: boolean }) =>
      tagsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousQueries = queryClient.getQueriesData<Tag[]>({ queryKey: ["tags"] })
      
      previousQueries.forEach(([queryKey, previousTags]) => {
        if (previousTags) {
          queryClient.setQueryData<Tag[]>(queryKey, previousTags.map(t => t.id === id ? { ...t, ...data } : t))
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
      const previousQueries = queryClient.getQueriesData<Tag[]>({ queryKey: ["tags"] })
      
      previousQueries.forEach(([queryKey, previous]) => {
        if (previous) {
          queryClient.setQueryData<Tag[]>(queryKey, reorderItems(previous, orderedIds))
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
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}
