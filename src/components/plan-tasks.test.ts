import { describe, expect, it } from "vitest"
import {
  BUCKET_LABELS,
  type PlanBucket,
  type PlanTaskRow,
  resolveBucketRows,
} from "./plan-tasks"

const bucket = (
  period: PlanBucket["period"],
  tasks: PlanTaskRow[]
): PlanBucket => ({ period, tasks })

const row = (taskId: number, reason = "because", effortMinutes?: number) => ({
  task_id: taskId,
  reason,
  effort_minutes: effortMinutes ?? null,
})

describe("BUCKET_LABELS", () => {
  it("covers all three planner periods in order", () => {
    expect(Object.keys(BUCKET_LABELS)).toEqual(["tonight", "tomorrow", "later"])
  })
})

describe("resolveBucketRows", () => {
  const titles = new Map([
    [1, "Write chapter"],
    [2, "Renew passport"],
  ])

  it("maps task ids to titles via the provided lookup", () => {
    const rows = resolveBucketRows(
      bucket("tonight", [row(1, "due soon")]),
      titles
    )
    expect(rows).toEqual([
      {
        taskId: 1,
        title: "Write chapter",
        reason: "due soon",
        effortMinutes: null,
      },
    ])
  })

  it("carries effort minutes through", () => {
    const rows = resolveBucketRows(
      bucket("tonight", [row(2, "quick win", 45)]),
      titles
    )
    expect(rows[0].effortMinutes).toBe(45)
  })

  it("drops ids missing from the lookup instead of showing blanks", () => {
    const rows = resolveBucketRows(
      bucket("later", [row(1), row(999), row(2)]),
      titles
    )
    expect(rows.map((r) => r.taskId)).toEqual([1, 2])
  })

  it("returns an empty list for an empty bucket", () => {
    expect(resolveBucketRows(bucket("tomorrow", []), titles)).toEqual([])
  })
})
