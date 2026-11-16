/**
 * Task Domain Model
 * Encapsulates entity contracts, input schemas, and API communication for tasks.
 */
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
}
