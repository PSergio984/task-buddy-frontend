import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Types
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export interface Group {
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
  group_id?: number
  group?: Group
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
  list: async (filter?: string, group_id?: number, tag_id?: number) => {
    const params = new URLSearchParams()
    if (filter === "completed") {
      params.append("completed", "true")
    } else if (filter === "pending") {
      params.append("completed", "false")
    }
    if (group_id) {
      params.append("group_id", group_id.toString())
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

export const groupsApi = {
  list: async () => {
    const response = await api.get<Group[] | { items: Group[] }>("/api/v1/groups/")
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (groupData: { name: string; color?: string }) => {
    const response = await api.post<Group>("/api/v1/groups/", groupData)
    return response.data
  },
  update: async (id: number, updates: { name?: string; color?: string }) => {
    const response = await api.put<Group>(`/api/v1/groups/${id}`, updates)
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/groups/${id}`)
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
