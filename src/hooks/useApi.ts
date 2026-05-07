import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

// Task types
export interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  priority?: "low" | "medium" | "high"
  category?: "work" | "personal" | "school" | "health" | "other"
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

// Fetch tasks from the backend
export function useTasks(filter?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const fetchTasks = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      // Force to next tick to avoid synchronous setState in effect warning
      await Promise.resolve()
      setLoading(true)
      let url = `${API_BASE_URL}/api/v1/tasks/`
      
      if (filter === "completed") {
        url += "?completed=true"
      } else if (filter === "pending") {
        url += "?completed=false"
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data
      setTasks(Array.isArray(data) ? data : data.items || [])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refreshTasks: fetchTasks }
}

// Fetch stats overview
export function useStats() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      await Promise.resolve()
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/v1/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(response.data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refreshStats: fetchStats }
}

// Create a new task
export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const createTask = useCallback(
    async (taskData: Omit<Task, "id" | "created_at" | "user_id">) => {
      if (!token) return
      try {
        setLoading(true)
        const response = await axios.post(`${API_BASE_URL}/api/v1/tasks/`, taskData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setError(null)
        return response.data
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  return { createTask, loading, error }
}

// Update a task
export function useUpdateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const updateTask = useCallback(async (id: number, updates: Partial<Task>) => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.put(`${API_BASE_URL}/api/v1/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
      return response.data
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { updateTask, loading, error }
}

// Delete a task
export function useDeleteTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const deleteTask = useCallback(async (id: number) => {
    if (!token) return
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/v1/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { deleteTask, loading, error }
}

// Update a subtask
export function useUpdateSubtask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const updateSubtask = useCallback(async (id: number, updates: Partial<Subtask>) => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.put(`${API_BASE_URL}/api/v1/tasks/subtask/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
      return response.data
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { updateSubtask, loading, error }
}

// Delete a subtask
export function useDeleteSubtask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const deleteSubtask = useCallback(async (id: number) => {
    if (!token) return
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/v1/tasks/subtask/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { deleteSubtask, loading, error }
}

// Detach a tag from a task
export function useDetachTag() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const detachTag = useCallback(async (taskId: number, tagId: number) => {
    if (!token) return
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/v1/tasks/${taskId}/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { detachTag, loading, error }
}

// Delete a tag
export function useDeleteTag() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { token } = useAuth()

  const deleteTag = useCallback(async (tagId: number) => {
    if (!token) return
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/v1/tasks/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setError(null)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [token])

  return { deleteTag, loading, error }
}
