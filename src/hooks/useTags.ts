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
