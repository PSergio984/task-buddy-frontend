/**
 * Task Domain Model
 * Encapsulates entity contracts, input schemas, and API communication for tasks.
 */
import { format } from "date-fns"
import {
  tasksApi,
  projectsApi,
  tagsApi,
  type Task,
  type TaskPriority,
  type Subtask,
  type Tag,
  type Project,
  type TaskStats,
  type TaskCreateData,
} from "@/lib/api"

export type TaskUpdateData = Partial<Task>
export type TaskSortMode = "priority" | "due_date" | "alpha"

export const TASK_SORT_LABELS: Record<TaskSortMode, string> = {
  priority: "Priority (High–Low)",
  due_date: "Deadline (Soonest)",
  alpha: "Alphabetical",
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HIGH: "bg-destructive/10 text-destructive border-destructive/20",
}

export function getPriorityBadgeClass(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] || "bg-muted text-muted-foreground"
}

export function formatTaskDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "No deadline"
  const parsed = new Date(dueDate)
  if (Number.isNaN(parsed.getTime())) return "No deadline"
  return format(parsed, "MMM d, yyyy 'at' p")
}

export function formatTaskCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return ""
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return "Unknown date"
  return format(parsed, "MMM d, yyyy")
}

export type {
  Task,
  TaskPriority,
  Subtask,
  Tag,
  Project,
  TaskStats,
  TaskCreateData,
}

export const TaskModel = {
  api: tasksApi,
  projectsApi,
  tagsApi,
  sortLabels: TASK_SORT_LABELS,
  priorityColors: PRIORITY_COLORS,
  getPriorityBadgeClass,
  formatTaskDueDate,
  formatTaskCreatedAt,
}
