import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tagsApi, type Tag } from "@/lib/api"
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
    queryKey: ["tags"],
    queryFn: tagsApi.list,
    enabled: !!user,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: tagsApi.create,
    onMutate: async (newTag) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousTags = queryClient.getQueryData<Tag[]>(["tags"])
      
      const temp: Tag = {
        id: Math.random(),
        name: newTag.name,
        color: newTag.color,
        icon: newTag.icon,
        user_id: 0,
        created_at: new Date().toISOString()
      }
      
      const updatedTags = previousTags ? [...previousTags, temp] : [temp]
      queryClient.setQueryData<Tag[]>(["tags"], updatedTags)
      
      return { previousTags }
    },
    onError: (_err, _newTag, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(["tags"], context.previousTags)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
    onSuccess: (data) => {
      toast({
        title: "Tag created",
        description: `Tag "${data.name}" has been created.`,
        variant: "success",
      })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: tagsApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousTags = queryClient.getQueryData<Tag[]>(["tags"])
      
      const updatedTags = previousTags ? previousTags.filter(t => t.id !== id) : []
      queryClient.setQueryData<Tag[]>(["tags"], updatedTags)
      
      return { previousTags }
    },
    onError: (_err, _id, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(["tags"], context.previousTags)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      // Also invalidate tasks because they might have this tag
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onSuccess: () => {
      toast({
        title: "Tag deleted",
        description: "Tag has been removed successfully.",
        variant: "success",
      })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string; icon?: string } }) =>
      tagsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previousTags = queryClient.getQueryData<Tag[]>(["tags"])
      
      const updatedTags = previousTags ? previousTags.map(t => t.id === id ? { ...t, ...data } : t) : []
      queryClient.setQueryData<Tag[]>(["tags"], updatedTags)
      
      return { previousTags }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(["tags"], context.previousTags)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onSuccess: (data) => {
      toast({
        title: "Tag updated",
        description: `Tag "${data.name}" has been updated.`,
        variant: "success",
      })
    },
  })
}

export function useReorderTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.reorder,
    onMutate: async (orderedIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previous = queryClient.getQueryData<Tag[]>(["tags"])
      
      if (previous) {
        const updatedTags = reorderItems(previous, orderedIds)
        queryClient.setQueryData<Tag[]>(["tags"], updatedTags)
      }
      
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["tags"], ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}
