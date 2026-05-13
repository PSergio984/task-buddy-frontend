import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tagsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

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

  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      // Also invalidate tasks because they might have this tag
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string; icon?: string } }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useReorderTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.reorder,
    onMutate: async (orderedIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: ["tags"] })
      const previous = queryClient.getQueryData<import("@/lib/api").Tag[]>(["tags"])
      queryClient.setQueryData<import("@/lib/api").Tag[]>(["tags"], (old) =>
        old ? orderedIds.map((id) => old.find((t) => t.id === id)!).filter(Boolean) : old
      )
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
