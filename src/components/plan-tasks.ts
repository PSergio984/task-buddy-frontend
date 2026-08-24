import type { PlanBucket, PlanTaskRow, Task } from "@/lib/api"

export type { PlanBucket, PlanTaskRow }

export const BUCKET_LABELS: Record<PlanBucket["period"], string> = {
  tonight: "Tonight",
  tomorrow: "Tomorrow",
  later: "Later",
}

export interface ResolvedPlanRow {
  taskId: number
  title: string
  reason: string
  effortMinutes: number | null
}

/** Map a bucket's wire rows to display rows via the task-id → title lookup.
 * Ids missing from the lookup (deleted/filtered tasks) are dropped rather
 * than rendered blank. */
export function resolveBucketRows(
  bucket: PlanBucket,
  titlesById: Map<number, string>
): ResolvedPlanRow[] {
  return bucket.tasks
    .filter((row) => titlesById.has(row.task_id))
    .map((row) => ({
      taskId: row.task_id,
      title: titlesById.get(row.task_id) ?? "",
      reason: row.reason,
      effortMinutes: row.effort_minutes,
    }))
}

export function buildTitlesById(tasks: readonly Task[]): Map<number, string> {
  return new Map(tasks.map((task) => [task.id, task.title]))
}
