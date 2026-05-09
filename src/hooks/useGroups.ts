import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { groupsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function useGroups() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
    enabled: !!user,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: { name?: string; color?: string } }) =>
      groupsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      // Also invalidate tasks because they might belong to this group
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}
