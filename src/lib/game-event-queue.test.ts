import { describe, it, expect, beforeEach, vi } from "vitest"
import type { GameEventIn, GameSyncResponse } from "@/lib/api"
import {
  enqueueGameEvent,
  listGameEvents,
  removeGameEvents,
  pendingGameEventCount,
  flushGameEventQueue,
} from "./game-event-queue"

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

const USER = "u1"
const ev = (id: string): GameEventIn => ({
  client_event_id: id,
  type: "focus_phase_completed",
  client_ts: "2026-11-01T10:00:00Z",
  payload: { minutes: 25 },
})

const syncResponse = (ids: string[]): GameSyncResponse =>
  ({
    profile: {},
    results: ids.map((client_event_id) => ({
      client_event_id,
      status: "applied" as const,
    })),
    applied: ids.length,
    duplicates: 0,
    server_time: "2026-11-01T10:05:00Z",
  }) as unknown as GameSyncResponse

describe("game-event-queue", () => {
  beforeEach(() => storage.clear())

  it("enqueues in order and dedupes by client_event_id", async () => {
    await enqueueGameEvent(USER, ev("a"))
    await enqueueGameEvent(USER, ev("b"))
    await enqueueGameEvent(USER, ev("a"))
    const all = await listGameEvents(USER)
    expect(all.map((e) => e.client_event_id)).toEqual(["a", "b"])
    expect(await pendingGameEventCount(USER)).toBe(2)
  })

  it("removes only settled events", async () => {
    await enqueueGameEvent(USER, ev("a"))
    await enqueueGameEvent(USER, ev("b"))
    await removeGameEvents(USER, ["a"])
    expect((await listGameEvents(USER))[0].client_event_id).toBe("b")
  })

  it("keeps queues of different users isolated", async () => {
    await enqueueGameEvent(USER, ev("a"))
    await enqueueGameEvent("u2", ev("b"))
    expect(await pendingGameEventCount(USER)).toBe(1)
    expect(await pendingGameEventCount("u2")).toBe(1)
  })

  it("flush posts the batch and drops settled events", async () => {
    await enqueueGameEvent(USER, ev("a"))
    await enqueueGameEvent(USER, ev("b"))
    const sendBatch = vi.fn().mockResolvedValue(syncResponse(["a", "b"]))
    const res = await flushGameEventQueue(USER, sendBatch)
    expect(sendBatch).toHaveBeenCalledTimes(1)
    expect(sendBatch.mock.calls[0][0]).toHaveLength(2)
    expect(res?.applied).toBe(2)
    expect(await pendingGameEventCount(USER)).toBe(0)
  })

  it("flush keeps the queue when the send fails", async () => {
    await enqueueGameEvent(USER, ev("a"))
    const sendBatch = vi.fn().mockRejectedValue(new Error("offline"))
    await expect(flushGameEventQueue(USER, sendBatch)).rejects.toThrow(
      "offline"
    )
    expect(await pendingGameEventCount(USER)).toBe(1)
  })

  it("flush is a no-op on an empty queue", async () => {
    const sendBatch = vi.fn()
    expect(await flushGameEventQueue(USER, sendBatch)).toBeNull()
    expect(sendBatch).not.toHaveBeenCalled()
  })
})
