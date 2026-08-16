import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"
import { toast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { createUuid } from "@/lib/utils"

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Suppress the global 429 toast for requests that handle their own rate-limit UX. */
    skipRateLimitToast?: boolean
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const createIdempotencyKey = () => createUuid()

// Helper to generate an idempotency key (unique per request)
async function generateIdempotencyKey(
  config: InternalAxiosRequestConfig
): Promise<string> {
  const nonce = createIdempotencyKey()

  // Robust payload construction
  const dataPart = (() => {
    if (!config.data) return "null"
    if (config.data instanceof FormData) return "[form-data]"
    if (config.data instanceof URLSearchParams) return config.data.toString()
    try {
      return JSON.stringify(config.data)
    } catch {
      return "[complex-data]"
    }
  })()

  const paramsPart = (() => {
    if (!config.params) return "null"
    if (config.params instanceof URLSearchParams)
      return config.params.toString()
    try {
      return JSON.stringify(config.params)
    } catch {
      return "[complex-params]"
    }
  })()

  const payload = `${config.method?.toLowerCase()}|${config.url}|${dataPart}|${paramsPart}|${nonce}`
  const msgUint8 = new TextEncoder().encode(payload)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
// Add a request interceptor for idempotency (POST-only)
api.interceptors.request.use(async (config) => {
  // Only POST creates need idempotency protection against accidental double-submission.
  // PUT/PATCH/DELETE are excluded: the same URL+body can legitimately represent
  // different state transitions (e.g. toggling a checkbox on and off).
  if (config.method?.toLowerCase() === "post") {
    try {
      if (!config.headers["X-Idempotency-Key"]) {
        config.headers["X-Idempotency-Key"] =
          await generateIdempotencyKey(config)
      }
    } catch (error) {
      console.error("Failed to generate idempotency key:", error)
    }
  }
  return config
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

    if (error.response?.status === 429 && !error.config?.skipRateLimitToast) {
      const detail =
        error.response.data?.detail ||
        "Too many attempts. Please try again later."
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
  updated_at?: string
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

export type NotificationType =
  | "TASK_DUE"
  | "TASK_OVERDUE"
  | "REMINDER_BEFORE"
  | "REMINDER_DUE"
  | "REMINDER_OVERDUE"
  | "SYSTEM"

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: NotificationType
  task_id?: number
  action_url?: string
  is_read: boolean
  created_at: string
}

export interface StatsOverview {
  task_stats: TaskStats
  tag_distribution: TagDistribution[]
}

export interface KnowledgeNote {
  id: number
  user_id: number
  task_id: number
  source_type: "note"
  title?: string | null
  content: string
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
}

export interface KnowledgeCitation {
  knowledge_id: number
  chunk_text: string
  rrf_score: number
}

export interface KnowledgeAskResponse {
  task_id: number
  answer: string
  citations: KnowledgeCitation[]
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  response_time_ms: number
  judge_verdict: string | null
  judge_explanation: string | null
  answer_id: number
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
  create: async (
    taskData: TaskCreateData,
    options?: { idempotencyKey?: string }
  ) => {
    const response = await api.post<Task>("/api/v1/tasks/", taskData, {
      headers: options?.idempotencyKey
        ? { "X-Idempotency-Key": options.idempotencyKey }
        : undefined,
    })
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

export const knowledgeApi = {
  list: async (taskId: number) => {
    const response = await api.get<KnowledgeNote[]>(
      `/api/v1/tasks/${taskId}/knowledge`
    )
    return response.data
  },
  create: async (taskId: number, content: string) => {
    const response = await api.post<KnowledgeNote>(
      `/api/v1/tasks/${taskId}/knowledge`,
      { content }
    )
    return response.data
  },
  ask: async (taskId: number, query?: string) => {
    const response = await api.post<KnowledgeAskResponse>(
      `/api/v1/tasks/${taskId}/knowledge/ask`,
      query ? { query } : {}
    )
    return response.data
  },
  feedback: async (taskId: number, answerId: number, rating: 1 | -1) => {
    const response = await api.post(
      `/api/v1/tasks/${taskId}/knowledge/answers/${answerId}/feedback`,
      { rating },
      { skipRateLimitToast: true }
    )
    return response.data
  },
}

export const projectsApi = {
  list: async () => {
    const response = await api.get<Project[] | { items: Project[] }>(
      "/api/v1/projects/"
    )
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (
    projectData: { name: string; color?: string; icon?: string },
    options?: { idempotencyKey?: string }
  ) => {
    const response = await api.post<Project>("/api/v1/projects/", projectData, {
      headers: options?.idempotencyKey
        ? { "X-Idempotency-Key": options.idempotencyKey }
        : undefined,
    })
    return response.data
  },
  update: async (
    id: number,
    updates: { name?: string; color?: string; icon?: string }
  ) => {
    const response = await api.put<Project>(`/api/v1/projects/${id}`, updates)
    return response.data
  },
  delete: async (id: number, deleteTasks: boolean = false) => {
    await api.delete(`/api/v1/projects/${id}`, {
      params: { delete_tasks: deleteTasks },
    })
  },
  reorder: async (orderedIds: number[]) => {
    await api.post("/api/v1/projects/reorder", orderedIds)
  },
}
export const subtasksApi = {
  create: async (
    taskId: number,
    data: {
      title: string
      completed?: boolean
      description?: string
      due_date?: string
    }
  ) => {
    const response = await api.post<Subtask>(`/api/v1/tasks/subtask`, {
      ...data,
      task_id: taskId,
    })
    return response.data
  },
  update: async (id: number, updates: Partial<Subtask>) => {
    const response = await api.put<Subtask>(
      `/api/v1/tasks/subtask/${id}`,
      updates
    )
    return response.data
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/tasks/subtask/${id}`)
  },
  reorder: async (taskId: number, orderedIds: number[]) => {
    await api.post(`/api/v1/tasks/${taskId}/subtask/reorder`, orderedIds)
  },
}

export const tagsApi = {
  list: async () => {
    const response = await api.get<Tag[] | { items: Tag[] }>(
      "/api/v1/tasks/tags/"
    )
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  },
  create: async (
    data: { name: string; color?: string; icon?: string },
    options?: { idempotencyKey?: string }
  ) => {
    const response = await api.post<Tag>("/api/v1/tasks/tags/", data, {
      headers: options?.idempotencyKey
        ? { "X-Idempotency-Key": options.idempotencyKey }
        : undefined,
    })
    return response.data
  },
  update: async (
    id: number,
    data: { name?: string; color?: string; icon?: string }
  ) => {
    const response = await api.put<Tag>(`/api/v1/tasks/tags/${id}`, data)
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
  reorder: async (orderedIds: number[]) => {
    await api.post("/api/v1/tasks/tags/reorder", orderedIds)
  },
}

export const notificationsApi = {
  getVapidKey: async () => {
    const response = await api.get<{ public_key: string }>(
      "/api/v1/notifications/vapid-key"
    )
    return response.data
  },
  list: async (params?: {
    limit?: number
    offset?: number
    read?: boolean
  }) => {
    const response = await api.get<
      Notification[] | { items: Notification[]; total: number }
    >("/api/v1/notifications/", { params })
    const data = response.data
    return Array.isArray(data) ? { items: data, total: data.length } : data
  },
  markRead: async (id: number) => {
    const response = await api.patch<Notification>(
      `/api/v1/notifications/${id}/read`
    )
    return response.data
  },
  markAllRead: async () => {
    await api.post("/api/v1/notifications/read-all")
  },
  delete: async (id: number) => {
    await api.delete(`/api/v1/notifications/${id}`)
  },
  registerPushSubscription: async (subscription: {
    endpoint: string
    p256dh: string
    auth: string
  }) => {
    await api.post("/api/v1/notifications/push-subscription", subscription)
  },
}
