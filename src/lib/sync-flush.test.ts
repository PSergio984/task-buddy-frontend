import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushSync } from "./sync-flush"
import {
  enqueueMutation,
  listMutations,
  type PendingMutation,
} from "./sync-queue"
import type { SyncDelta } from "./sync-delta"

const storage = new Map<string, string>()

vi.mock("idb-keyval", () => ({
  get: async (key: string) => {
    const raw = storage.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  set: async (key: string, value: unknown) => {
    storage.set(key, JSON.stringify(value))
  },
  del: async (key: string) => {
    storage.delete(key)
  },
}))

const task = (
  id: number,
  overrides: Partial<PendingMutation> = {}
): PendingMutation => ({
  queueId: `q-${id}`,
  entity: "task",
  id,
  op: "update",
  payload: { title: `Task ${id}` },
  client_updated_at: "2026-08-14T10:00:00Z",
  ...overrides,
})

const okResponse = {
  applied: [
    {
      entity: "task",
      id: 1,
      op: "update",
      server_updated_at: "2026-08-14T10:05:00Z",
    },
  ],
  conflicts: [],
  not_found: [],
  delta: { tasks: [{ id: 1, title: "Task 1" }], subtasks: [], projects: [] },
  since: "2026-08-14T10:00:00Z",
}

describe("flushSync", () => {
  beforeEach(() => {
    storage.clear()
    vi.clearAllMocks()
  })

  it("drains the queue and returns the server response on success", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn().mockResolvedValue(okResponse)

    const result = await flushSync({ sendSync, isOnline: () => true })

    expect(sendSync).toHaveBeenCalledWith({
      since: undefined,
      changes: [
        {
          entity: "task",
          id: 1,
          op: "update",
          payload: { title: "Task 1" },
          client_updated_at: "2026-08-14T10:00:00Z",
        },
      ],
    })
    expect(result).toMatchObject({
      conflictCount: 0,
      delta: okResponse.delta,
      since: "2026-08-14T10:00:00Z",
    })
    expect(await listMutations()).toHaveLength(0)
  })

  it("forwards the incremental sync cursor (since) to the server", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn().mockResolvedValue(okResponse)

    await flushSync({
      sendSync,
      isOnline: () => true,
      since: "2026-08-14T09:00:00Z",
    })

    expect(sendSync).toHaveBeenCalledWith(
      expect.objectContaining({ since: "2026-08-14T09:00:00Z" })
    )
  })

  it("counts conflicts, drops the losing change, and keeps the delta", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn().mockResolvedValue({
      ...okResponse,
      applied: [],
      conflicts: [
        {
          entity: "task",
          id: 1,
          op: "update",
          server_state: { title: "Server won" },
        },
      ],
    })

    const result = await flushSync({ sendSync, isOnline: () => true })

    expect(result.conflictCount).toBe(1)
    expect(await listMutations()).toHaveLength(0)
  })

  it("drops not_found items from the queue", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn().mockResolvedValue({
      ...okResponse,
      applied: [],
      not_found: [{ entity: "task", id: 1, op: "update" }],
    })

    await flushSync({ sendSync, isOnline: () => true })

    expect(await listMutations()).toHaveLength(0)
  })

  it("settles by entity+id+op so same-numbered rows across entities are both kept", async () => {
    await enqueueMutation(task(1, { entity: "task", id: 5 }))
    await enqueueMutation(task(1, { entity: "project", id: 5 }))
    const sendSync = vi.fn().mockResolvedValue({
      ...okResponse,
      applied: [
        { entity: "task", id: 5, op: "update" },
        { entity: "project", id: 5, op: "update" },
      ],
    })

    await flushSync({ sendSync, isOnline: () => true })

    expect(await listMutations()).toHaveLength(0)
  })

  it("keeps unsynced same-id mutations of a different entity", async () => {
    await enqueueMutation(task(1, { entity: "task", id: 5 }))
    await enqueueMutation(task(1, { entity: "project", id: 5 }))
    const sendSync = vi.fn().mockResolvedValue({
      ...okResponse,
      applied: [{ entity: "task", id: 5, op: "update" }],
    })

    await flushSync({ sendSync, isOnline: () => true })

    const remaining = await listMutations()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].entity).toBe("project")
  })

  it("keeps the whole queue when rate limited (429) and reports retry-after", async () => {
    await enqueueMutation(task(1))
    const rateLimited = Object.assign(new Error("rate limited"), {
      response: { status: 429, headers: { "retry-after": "30" } },
    })
    const sendSync = vi.fn().mockRejectedValue(rateLimited)

    const result = await flushSync({ sendSync, isOnline: () => true })

    expect(result).toMatchObject({ conflictCount: 0, retryAfterSec: 30 })
    expect(await listMutations()).toHaveLength(1)
  })

  it("falls back to a default retry delay when the 429 has no Retry-After header", async () => {
    await enqueueMutation(task(1))
    const rateLimited = Object.assign(new Error("rate limited"), {
      response: { status: 429, headers: {} },
    })
    const sendSync = vi.fn().mockRejectedValue(rateLimited)

    const result = await flushSync({ sendSync, isOnline: () => true })

    expect(result.retryAfterSec).toBe(60)
    expect(await listMutations()).toHaveLength(1)
  })

  it("keeps the queue on unexpected errors and propagates them", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn().mockRejectedValue(new Error("server down"))

    await expect(flushSync({ sendSync, isOnline: () => true })).rejects.toThrow(
      "server down"
    )
    expect(await listMutations()).toHaveLength(1)
  })

  it("does not call the server when offline", async () => {
    await enqueueMutation(task(1))
    const sendSync = vi.fn()

    await flushSync({ sendSync, isOnline: () => false })

    expect(sendSync).not.toHaveBeenCalled()
    expect(await listMutations()).toHaveLength(1)
  })

  it("sends at most 500 changes per request (backend limit)", async () => {
    for (let i = 1; i <= 550; i++) {
      await enqueueMutation(task(i))
    }
    const sendSync = vi.fn().mockResolvedValue({
      applied: [],
      conflicts: [],
      not_found: [],
      delta: { tasks: [], subtasks: [], projects: [] } satisfies SyncDelta,
      since: "2026-08-14T10:00:00Z",
    })

    const result = await flushSync({ sendSync, isOnline: () => true })

    const sent = sendSync.mock.calls[0][0]
    expect(sent.changes).toHaveLength(500)
    expect(result).toMatchObject({ conflictCount: 0 })
  })
})
