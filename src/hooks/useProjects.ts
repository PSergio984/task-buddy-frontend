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
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData<import("@/lib/api").Project[]>(["projects"])
      
      queryClient.setQueryData<import("@/lib/api").Project[]>(["projects"], (old) => {
        const temp: import("@/lib/api").Project = {
          id: Math.random(),
          name: newProject.name,
          color: newProject.color,
          icon: newProject.icon,
          user_id: 0,
          created_at: new Date().toISOString()
        }
        return old ? [...old, temp] : [temp]
      })
      
      return { previousProjects }
    },
    onError: (_err, _newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onSuccess: (data) => {
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData<import("@/lib/api").Project[]>(["projects"])
      
      queryClient.setQueryData<import("@/lib/api").Project[]>(["projects"], (old) => {
        if (!old) return []
        return old.map(p => p.id === id ? { ...p, ...updates } : p)
      })
      
      return { previousProjects }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onSuccess: (data) => {
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousProjects = queryClient.getQueryData<import("@/lib/api").Project[]>(["projects"])
      
      queryClient.setQueryData<import("@/lib/api").Project[]>(["projects"], (old) => {
        if (!old) return []
        return old.filter(p => p.id !== id)
      })
      
      return { previousProjects }
    },
    onError: (_err, _id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      // Also invalidate tasks because they might belong to this project
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
    onSuccess: () => {
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
