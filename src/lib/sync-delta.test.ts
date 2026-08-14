import { describe, it, expect } from "vitest"
import {
  applyDeltaToCache,
  mergeConflictsIntoDelta,
  removeFromCache,
  type SyncDelta,
} from "./sync-delta"

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

  describe("mergeConflictsIntoDelta", () => {
    it("merges server_state over an existing delta row", () => {
      const delta: SyncDelta = {
        tasks: [{ id: 1, title: "Old" }],
        subtasks: [],
        projects: [],
      }
      const merged = mergeConflictsIntoDelta(delta, [
        {
          entity: "task",
          id: 1,
          op: "update",
          server_state: { id: 1, title: "Server won" },
        },
      ])
      expect(merged.tasks).toHaveLength(1)
      expect(merged.tasks[0]).toMatchObject({ id: 1, title: "Server won" })
    })

    it("appends a conflict row missing from the delta", () => {
      const delta: SyncDelta = { tasks: [], subtasks: [], projects: [] }
      const merged = mergeConflictsIntoDelta(delta, [
        {
          entity: "project",
          id: 3,
          op: "update",
          server_state: { id: 3, name: "New" },
        },
      ])
      expect(merged.projects).toHaveLength(1)
      expect(merged.projects[0]).toMatchObject({ id: 3, name: "New" })
    })

    it("skips conflicts without server_state", () => {
      const delta: SyncDelta = { tasks: [], subtasks: [], projects: [] }
      const merged = mergeConflictsIntoDelta(delta, [
        { entity: "task", id: 9, op: "delete" },
      ])
      expect(merged.tasks).toHaveLength(0)
    })

    it("returns the input delta untouched when there are no conflicts", () => {
      const delta: SyncDelta = {
        tasks: [{ id: 1 }],
        subtasks: [],
        projects: [],
      }
      expect(mergeConflictsIntoDelta(delta, [])).toEqual(delta)
    })
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

  describe("removeFromCache", () => {
    it("removes a task row from the list", () => {
      const cache = {
        tasks: [
          { id: 1, title: "Keep" },
          { id: 2, title: "Gone" },
        ],
        projects: [],
      }
      const result = removeFromCache(cache, "task", 2)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0]).toMatchObject({ id: 1 })
    })

    it("removes a project row from the list", () => {
      const cache = {
        tasks: [],
        projects: [
          { id: 1, name: "Keep" },
          { id: 2, name: "Gone" },
        ],
      }
      const result = removeFromCache(cache, "project", 2)
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0]).toMatchObject({ id: 1 })
    })

    it("removes a subtask from inside every task's subtasks array", () => {
      const cache = {
        tasks: [
          {
            id: 1,
            title: "Parent",
            subtasks: [
              { id: 9, task_id: 1, title: "Keep" },
              { id: 10, task_id: 1, title: "Gone" },
            ],
          },
        ],
        projects: [],
      }
      const result = removeFromCache(cache, "subtask", 10)
      const subtasks = result.tasks[0].subtasks as Record<string, unknown>[]
      expect(subtasks).toHaveLength(1)
      expect(subtasks[0]).toMatchObject({ id: 9 })
    })
  })
})
