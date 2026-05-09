import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop: don't trigger logout if the request that failed was already a logout request
    const isLogoutRequest = error.config?.url?.endsWith("/api/v1/users/logout")
    
    if (error.response?.status === 401 && !isLogoutRequest) {
      // Dispatch a custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent("auth:unauthorized"))
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
    const response = await api.get<Task[] | { items: Task[] }>(
      `/api/v1/tasks/${queryString ? `?${queryString}` : ""}`
    )
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (taskData: Omit<Task, "id" | "created_at" | "user_id">) => {
    const response = await api.post<Task>("/api/v1/tasks/", taskData)
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
  create: async (projectData: { name: string; color?: string }) => {
    const response = await api.post<Project>("/api/v1/projects/", projectData)
    return response.data
  },
  update: async (id: number, updates: { name?: string; color?: string }) => {
    const response = await api.put<Project>(`/api/v1/projects/${id}`, updates)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/projects/${id}`)
  },
}

export const subtasksApi = {
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
  delete: async (id: number) => {
    await api.delete(`/api/v1/tasks/tags/${id}`)
  },
  detach: async (taskId: number, tagId: number) => {
    await api.delete(`/api/v1/tasks/${taskId}/tags/${tagId}`)
  },
}
