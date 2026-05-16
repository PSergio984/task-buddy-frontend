import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi, type Project } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

/**
 * Reorders an array of projects based on a list of IDs.
 */
function reorderProjects(projects: Project[], orderedIds: number[]): Project[] {
  const projectMap = new Map(projects.map(p => [p.id, p]))
  return orderedIds
    .map(id => projectMap.get(id))
    .filter((p): p is Project => !!p)
}

/**
 * Updates an item in a list.
 */
function updateItem<T extends { id: number }>(items: T[] | undefined, id: number, updates: Partial<T>): T[] {
  if (!items) return []
  return items.map(item => item.id === id ? { ...item, ...updates } : item)
}

/**
 * Removes an item from a list.
 */
function removeItem<T extends { id: number }>(items: T[] | undefined, id: number): T[] {
  if (!items) return []
  return items.filter(item => item.id !== id)
}

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
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"])
      
      const temp: Project = {
        id: Math.random(),
        name: newProject.name,
        color: newProject.color,
        icon: newProject.icon,
        user_id: 0,
        created_at: new Date().toISOString()
      }
      
      const updatedProjects = previousProjects ? [...previousProjects, temp] : [temp]
      queryClient.setQueryData<Project[]>(["projects"], updatedProjects)
      
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
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"])
      
      const updatedProjects = updateItem(previousProjects, id, updates)
      queryClient.setQueryData<Project[]>(["projects"], updatedProjects)
      
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
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"])
      
      const updatedProjects = removeItem(previousProjects, id)
      queryClient.setQueryData<Project[]>(["projects"], updatedProjects)
      
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
      const previous = queryClient.getQueryData<Project[]>(["projects"])
      
      if (previous) {
        const updatedProjects = reorderProjects(previous, orderedIds)
        queryClient.setQueryData<Project[]>(["projects"], updatedProjects)
      }
      
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
