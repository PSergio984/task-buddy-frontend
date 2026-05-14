import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export function useProjects() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
    enabled: !!user,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({
        title: "Project created",
        description: `Project "${data.name}" has been created.`,
        variant: "success",
      })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: { name?: string; color?: string; icon?: string } }) =>
      projectsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast({
        title: "Project updated",
        description: `Project "${data.name}" has been updated.`,
        variant: "success",
      })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      // Also invalidate tasks because they might belong to this project
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({
        title: "Project deleted",
        description: "Project has been removed successfully.",
        variant: "success",
      })
    },
  })
}

export function useReorderProjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsApi.reorder,
    onMutate: async (orderedIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previous = queryClient.getQueryData<import("@/lib/api").Project[]>(["projects"])
      queryClient.setQueryData<import("@/lib/api").Project[]>(["projects"], (old) =>
        old ? orderedIds.map((id) => old.find((p) => p.id === id)!).filter(Boolean) : old
      )
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["projects"], ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
