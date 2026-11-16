import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  TaskModel,
  type Task,
} from "@/models/task.model"

export function useTaskDetailViewModel() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
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

  const toggleMutation = useMutation({
    mutationFn: (completed: boolean) =>
      TaskModel.api.update(taskId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({
        title: "Status Updated",
        description: `Task marked as ${task?.completed ? "pending" : "completed"}.`,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => TaskModel.api.delete(taskId),
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "The task has been permanently removed.",
        variant: "destructive",
      })
      navigate("/tasks")
    },
  })

  const handleToggleCompleted = () => {
    if (task) {
      toggleMutation.mutate(!task.completed)
    }
  }

  const handleDeleteTask = () => {
    deleteMutation.mutate()
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
    isError: Boolean(error) || !task,
    isDeleting,
    setIsDeleting,
    isToggling: toggleMutation.isPending,
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
