import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks"
import { TaskModel, type Task } from "@/models/task.model"

export function useTaskDetailViewModel() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const taskId = id ? Number.parseInt(id, 10) : 0

  const {
    data: task,
    isLoading,
    error,
  } = useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/tasks/${taskId}`)
      return response.data
    },
    enabled: taskId > 0,
  })

  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateTask()
  const { mutateAsync: deleteTask } = useDeleteTask()

  const handleToggleCompleted = async () => {
    if (task) {
      try {
        await updateTask({
          id: taskId,
          updates: { completed: !task.completed },
          silent: true,
        })
        toast({
          title: "Status Updated",
          description: `Task marked as ${task.completed ? "pending" : "completed"}.`,
        })
      } catch (err) {
        console.error("Failed to toggle task completion:", err)
      }
    }
  }

  const handleDeleteTask = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteTask({ id: taskId, silent: true })
      if (result?.queued) {
        toast({
          title: "Task deleted offline",
          description:
            "Task deletion saved locally and will sync automatically.",
        })
      } else {
        toast({
          title: "Task Deleted",
          description: "The task has been permanently removed.",
          variant: "destructive",
        })
      }
      navigate("/tasks")
    } catch (err) {
      console.error("Failed to delete task:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const priorityColor = task
    ? TaskModel.getPriorityBadgeClass(task.priority)
    : ""

  const formattedDueDate = TaskModel.formatTaskDueDate(task?.due_date)
  const formattedCreatedAt = TaskModel.formatTaskCreatedAt(task?.created_at)

  return {
    taskId,
    task,
    isLoading,
    isError: Boolean(error),
    error,
    isUpdating,
    isDeleting,
    setIsDeleting,
    priorityColor,
    formattedDueDate,
    formattedCreatedAt,
    toggleCompleted: handleToggleCompleted,
    deleteTask: handleDeleteTask,
    goBack: () => navigate(-1),
    goToTasks: () => navigate("/tasks"),
  }
}

export type TaskDetailViewModel = ReturnType<typeof useTaskDetailViewModel>
