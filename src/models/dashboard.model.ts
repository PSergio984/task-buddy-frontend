import type { Task, TaskStats } from "@/lib/api"

/**
 * Pure domain model for Dashboard.
 * Zero React/DOM hooks or JSX.
 */

export function parseProjectIdFromFilter(filter: string): number | undefined {
  if (filter.startsWith("project:")) {
    const raw = filter.split(":")[1]
    const parsed = Number.parseInt(raw, 10)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

export type { Task, TaskStats }
