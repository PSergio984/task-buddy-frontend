import axios from "axios"
import { toast } from "@/hooks/use-toast"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Add a response interceptor to handle 401 and 429 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop: don't trigger logout if the request that failed was already a logout request
    const isLogoutRequest = error.config?.url?.endsWith("/api/v1/users/logout")
    
    if (error.response?.status === 401 && !isLogoutRequest) {
      // Dispatch a custom event to notify AuthContext
      globalThis.dispatchEvent(new CustomEvent("auth:unauthorized"))
    }

    if (error.response?.status === 429) {
      const detail = error.response.data?.detail || "Too many attempts. Please try again later."
      toast({
        title: "Slow down",
        description: detail,
        variant: "warning",
      })
    }

    return Promise.reject(error)
  }
)

// Types
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export interface Project {
  id: number
  name: string
  color?: string
  icon?: string
  user_id: number
  created_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: TaskPriority
  project_id?: number
  project?: Project
  due_date?: string
  created_at: string
  user_id: number
  subtasks?: Subtask[]
  tags?: Tag[]
}

export interface Subtask {
  id: number
  task_id: number
  title: string
  description?: string
  completed: boolean
  due_date?: string
  created_at: string
}

export interface Tag {
  id: number
  name: string
  color?: string
  icon?: string
  user_id: number
  created_at: string
}

export interface TaskStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  completion_percentage: number
}

export interface TagDistribution {
  tag_name: string
  task_count: number
}

export interface StatsOverview {
  task_stats: TaskStats
  tag_distribution: TagDistribution[]
}

export interface TaskCreateData {
  title: string
  description?: string
  completed?: boolean
  priority?: TaskPriority
  project_id?: number
  due_date?: string
  tags?: string[]
  subtasks?: Array<{
    title: string
    description?: string
    due_date?: string
    completed?: boolean
  }>
}

// Raw API functions
export const tasksApi = {
  list: async (filter?: string, project_id?: number, tag_id?: number) => {
    const params = new URLSearchParams()
    if (filter === "completed") {
      params.append("completed", "true")
    } else if (filter === "pending") {
      params.append("completed", "false")
    }
    if (project_id) {
      params.append("project_id", project_id.toString())
    }
    if (tag_id) {
      params.append("tag_id", tag_id.toString())
    }
    const queryString = params.toString()
    const url = queryString ? `/api/v1/tasks/?${queryString}` : "/api/v1/tasks/"
    const response = await api.get<Task[] | { items: Task[] }>(url)
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (taskData: TaskCreateData) => {
    const response = await api.post<Task>("/api/v1/tasks/", taskData)
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get<Task>(`/api/v1/tasks/${id}`)
    return response.data
  },
  update: async (id: number, updates: Partial<Task>) => {
    const response = await api.put<Task>(`/api/v1/tasks/${id}`, updates)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/tasks/${id}`)
  },
}

export const statsApi = {
  getOverview: async () => {
    const response = await api.get<StatsOverview>("/api/v1/stats/overview")
    return response.data
  },
}

export const projectsApi = {
  list: async () => {
    const response = await api.get<Project[] | { items: Project[] }>("/api/v1/projects/")
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (projectData: { name: string; color?: string; icon?: string }) => {
    const response = await api.post<Project>("/api/v1/projects/", projectData)
    return response.data
  },
  update: async (id: number, updates: { name?: string; color?: string; icon?: string }) => {
    const response = await api.put<Project>(`/api/v1/projects/${id}`, updates)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/projects/${id}`)
  },
}
export const subtasksApi = {
  create: async (taskId: number, data: { title: string }) => {
    const response = await api.post<Subtask>(`/api/v1/tasks/subtask`, {
      ...data,
      task_id: taskId,
    })
    return response.data
  },
  update: async (id: number, updates: Partial<Subtask>) => {
    const response = await api.put<Subtask>(`/api/v1/tasks/subtask/${id}`, updates)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/tasks/subtask/${id}`)
  },
}

export const tagsApi = {
  list: async () => {
    const response = await api.get<Tag[] | { items: Tag[] }>("/api/v1/tasks/tags/")
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (data: { name: string; color?: string; icon?: string }) => {
    const response = await api.post<Tag>("/api/v1/tasks/tags/", data)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/tasks/tags/${id}`)
  },
  detach: async (taskId: number, tagId: number) => {
    await api.delete(`/api/v1/tasks/${taskId}/tags/${tagId}`)
  },
  attach: async (taskId: number, tagId: number) => {
    await api.post(`/api/v1/tasks/${taskId}/tags/${tagId}`)
  },
}
