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

export function useDeleteTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
