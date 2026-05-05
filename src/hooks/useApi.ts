import { useState, useEffect, useCallback } from "react"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

// Task types
export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "completed"
  priority: "low" | "medium" | "high"
  category: "work" | "personal" | "school" | "health" | "other"
  dueDate?: string
  createdAt: string
  updatedAt: string
}

// Fetch tasks from the backend
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/tasks`)

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`)
        }

        const data = await response.json()
        setTasks(Array.isArray(data) ? data : data.items || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return { tasks, loading, error }
}

// Create a new task
export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) {
          throw new Error(`Failed to create task: ${response.statusText}`)
        }

        const newTask = await response.json()
        setError(null)
        return newTask
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { createTask, loading, error }
}

// Update a task
export function useUpdateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`)
      }

      const updated = await response.json()
      setError(null)
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateTask, loading, error }
}

// Delete a task
export function useDeleteTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteTask = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`)
      }

      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteTask, loading, error }
}
