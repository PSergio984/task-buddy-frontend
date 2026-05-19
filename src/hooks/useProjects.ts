import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi, type Project } from "@/lib/api"
export type { Project }
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

/**
 * Reorders an array of projects based on a list of IDs.
 */
function reorderProjects(projects: Project[], orderedIds: number[]): Project[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  return orderedIds
    .map((id) => projectMap.get(id))
    .filter((p): p is Project => !!p)
}

/**
 * Updates an item in a list.
 */
function updateItem<T extends { id: number }>(
  items: T[] | undefined,
  id: number,
  updates: Partial<T>
): T[] {
  if (!items) return []
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

/**
 * Removes an item from a list.
 */
function removeItem<T extends { id: number }>(
  items: T[] | undefined,
  id: number
): T[] {
  if (!items) return []
  return items.filter((item) => item.id !== id)
}

export function useProjects() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["projects", { userId: user?.id }],
    queryFn: projectsApi.list,
    enabled: !!user,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...newProject
    }: Parameters<typeof projectsApi.create>[0] & {
      idempotencyKey?: string
    }) => projectsApi.create(newProject, { idempotencyKey }),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousQueries = queryClient.getQueriesData<Project[]>({
        queryKey: ["projects"],
      })

      const tempId = Math.random()
      const temp: Project = {
        id: tempId,
        name: newProject.name,
        color: newProject.color,
        icon: newProject.icon,
        user_id: 0,
        created_at: new Date().toISOString(),
      }

      previousQueries.forEach(([queryKey, previousProjects]) => {
        if (previousProjects) {
          queryClient.setQueryData<Project[]>(queryKey, [
            ...previousProjects,
            temp,
          ])
        }
      })

      return { previousQueries, tempId }
    },
    onError: (_err, _newProject, context) => {
      context?.previousQueries?.forEach(([queryKey, previousProjects]) => {
        queryClient.setQueryData(queryKey, previousProjects)
      })
    },
    onSuccess: (data, _variables, context) => {
      if (context?.tempId !== undefined) {
        const cachedQueries = queryClient.getQueriesData<Project[]>({
          queryKey: ["projects"],
        })
        cachedQueries.forEach(([queryKey, previousProjects]) => {
          if (!previousProjects) return
          const updated = previousProjects.map((project) =>
            project.id === context.tempId ? data : project
          )
          queryClient.setQueryData<Project[]>(queryKey, updated)
        })
      }
      toast({
        title: "Project created",
        description: `Project "${data.name}" has been created.`,
        variant: "success",
      })
    },
    onSettled: () => {
      // Invalidation removed to prevent race conditions where
      // stale backend data overwrites optimistic updates.
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number
      updates: { name?: string; color?: string; icon?: string }
    }) => projectsApi.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousQueries = queryClient.getQueriesData<Project[]>({
        queryKey: ["projects"],
      })

      previousQueries.forEach(([queryKey, previousProjects]) => {
        if (previousProjects) {
          queryClient.setQueryData<Project[]>(
            queryKey,
            updateItem(previousProjects, id, updates)
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, previousProjects]) => {
        queryClient.setQueryData(queryKey, previousProjects)
      })
    },
    onSettled: () => {
      // Invalidation removed to prevent race conditions where
      // stale backend data overwrites optimistic updates.
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
    mutationFn: ({ id, deleteTasks }: { id: number; deleteTasks?: boolean }) =>
      projectsApi.delete(id, deleteTasks),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previousQueries = queryClient.getQueriesData<Project[]>({
        queryKey: ["projects"],
      })

      previousQueries.forEach(([queryKey, previousProjects]) => {
        if (previousProjects) {
          queryClient.setQueryData<Project[]>(
            queryKey,
            removeItem(previousProjects, id)
          )
        }
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context) => {
      context?.previousQueries?.forEach(([queryKey, previousProjects]) => {
        queryClient.setQueryData(queryKey, previousProjects)
      })
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
      const previousQueries = queryClient.getQueriesData<Project[]>({
        queryKey: ["projects"],
      })

      previousQueries.forEach(([queryKey, previous]) => {
        if (previous) {
          queryClient.setQueryData<Project[]>(
            queryKey,
            reorderProjects(previous, orderedIds)
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
