import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  enqueueMutation,
  listMutations,
  removeMutations,
  pendingMutationCount,
} from "./sync-queue"

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

const base = {
  entity: "task" as const,
  id: 5,
  op: "update" as const,
  payload: { title: "Write handoff" },
  client_updated_at: "2026-08-14T10:00:00Z",
}

describe("sync-queue", () => {
  beforeEach(() => {
    storage.clear()
  })

  it("enqueues a mutation and lists it in insertion order", async () => {
    await enqueueMutation({
      ...base,
      id: 1,
      client_updated_at: "2026-08-14T10:00:00Z",
    })
    await enqueueMutation({
      ...base,
      id: 2,
      client_updated_at: "2026-08-14T10:00:01Z",
    })

    const all = await listMutations()
    expect(all).toHaveLength(2)
    expect(all[0].id).toBe(1)
    expect(all[1].id).toBe(2)
    expect(all[0]).toHaveProperty("queueId")
  })

  it("removes only the named mutations", async () => {
    await enqueueMutation({ ...base, id: 1 })
    await enqueueMutation({ ...base, id: 2 })
    const all = await listMutations()

    await removeMutations([all[0].queueId])
    const remaining = await listMutations()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(2)
  })

  it("clears the whole queue", async () => {
    await enqueueMutation({ ...base, id: 1 })
    await enqueueMutation({ ...base, id: 2 })

    await removeMutations((await listMutations()).map((m) => m.queueId))
    expect(await listMutations()).toHaveLength(0)
  })

  it("counts pending mutations", async () => {
    expect(await pendingMutationCount()).toBe(0)
    await enqueueMutation({ ...base, id: 1 })
    await enqueueMutation({ ...base, id: 2 })
    expect(await pendingMutationCount()).toBe(2)
  })

  it("survives a reload by persisting to storage", async () => {
    await enqueueMutation({ ...base, id: 7 })
    const reloaded = await listMutations()
    expect(reloaded).toHaveLength(1)
    expect(reloaded[0].id).toBe(7)
  })
})
