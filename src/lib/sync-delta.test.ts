import { describe, it, expect } from "vitest"
import { applyDeltaToCache, type SyncDelta } from "./sync-delta"

describe("applyDeltaToCache", () => {
  const delta: SyncDelta = {
    tasks: [
      {
        id: 1,
        title: "Task one",
        completed: true,
        updated_at: "2026-08-14T10:00:00Z",
      },
    ],
    subtasks: [
      {
        id: 9,
        task_id: 1,
        title: "Subtask nine",
        completed: false,
      },
    ],
    projects: [
      {
        id: 3,
        name: "Project three",
      },
    ],
  }

  it("merges delta tasks into an existing list, updating matching ids", () => {
    const tasks = [{ id: 1, title: "Task one", completed: false }]
    const result = applyDeltaToCache({ tasks, projects: [] }, delta)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]).toMatchObject({
      id: 1,
      title: "Task one",
      completed: true,
    })
  })

  it("appends delta tasks that are not in the list yet", () => {
    const result = applyDeltaToCache({ tasks: [], projects: [] }, delta)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].id).toBe(1)
  })

  it("merges delta subtasks into a task's subtasks array", () => {
    const task = {
      id: 1,
      title: "Task one",
      subtasks: [
        { id: 9, task_id: 1, title: "Subtask nine", completed: false },
      ],
    }
    const result = applyDeltaToCache({ tasks: [task], projects: [] }, delta)
    const merged = result.tasks[0].subtasks as Record<string, unknown>[]
    expect(merged[0]).toMatchObject({
      id: 9,
      task_id: 1,
      title: "Subtask nine",
    })
  })

  it("merges delta projects into an existing projects list", () => {
    const projects = [{ id: 3, name: "Project three" }]
    const result = applyDeltaToCache({ tasks: [], projects }, delta)
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0]).toMatchObject({ id: 3, name: "Project three" })
  })

  it("returns the input lists untouched when delta sections are empty", () => {
    const input = {
      tasks: [{ id: 1, title: "Keep" }],
      projects: [],
    }
    const result = applyDeltaToCache(input, {
      tasks: [],
      subtasks: [],
      projects: [],
    })
    expect(result).toEqual(input)
  })
})
