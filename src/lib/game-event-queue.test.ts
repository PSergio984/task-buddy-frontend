import { describe, it, expect, beforeEach, vi } from "vitest"
import type { GameEventIn, GameSyncResponse } from "@/lib/api"
import {
  enqueueGameEvent,
  listGameEvents,
  removeGameEvents,
  removeGameEventsByPrefix,
  pendingGameEventCount,
  flushGameEventQueue,
} from "./game-event-queue"

const storage = new Map<string, string>()
let setShouldFail = false
vi.mock("idb-keyval", () => ({
  get: async (key: string) => {
    const raw = storage.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  set: async (key: string, value: unknown) => {
    if (setShouldFail) throw new Error("idb write failed")
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
  beforeEach(() => {
    storage.clear()
    setShouldFail = false
  })

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

  it("serialized writes: 20 concurrent enqueues all land", async () => {
    // Unsynchronized read-modify-write would lose most of these — the old
    // implementation collapsed to a handful under Promise.all.
    const ids = Array.from({ length: 20 }, (_, i) => `race-${i}`)
    await Promise.all(ids.map((id) => enqueueGameEvent(USER, ev(id))))
    const all = await listGameEvents(USER)
    expect(all.map((e) => e.client_event_id).sort()).toEqual(ids.sort())
  })

  it("a rejected op does not poison the serial tail", async () => {
    setShouldFail = true
    await expect(enqueueGameEvent(USER, ev("bad"))).rejects.toThrow(
      "idb write failed"
    )
    setShouldFail = false
    // tail.catch keeps the chain alive — the next write still lands.
    await enqueueGameEvent(USER, ev("good"))
    expect((await listGameEvents(USER)).map((e) => e.client_event_id)).toEqual([
      "good",
    ])
  })

  it("removeGameEventsByPrefix drops one local session's events only", async () => {
    await enqueueGameEvent(USER, ev("web:s1:focus_phase_completed:0"))
    await enqueueGameEvent(USER, ev("web:s1:damage:manual_stop"))
    await enqueueGameEvent(USER, ev("web:s2:focus_phase_completed:0"))
    await enqueueGameEvent(USER, ev("habit-1"))
    const dropped = await removeGameEventsByPrefix(USER, "web:s1:")
    expect(dropped).toBe(2)
    expect((await listGameEvents(USER)).map((e) => e.client_event_id)).toEqual([
      "web:s2:focus_phase_completed:0",
      "habit-1",
    ])
  })

  it("flush chunks at the 500-event batch cap", async () => {
    const events = Array.from({ length: 1200 }, (_, i) => ev(`bulk-${i}`))
    storage.set(
      `game-event-queue:${USER}`,
      JSON.stringify(events)
    )
    const sendBatch = vi
      .fn()
      .mockImplementation(async (batch: GameEventIn[]) =>
        syncResponse(batch.map((e) => e.client_event_id))
      )
    const res = await flushGameEventQueue(USER, sendBatch)
    expect(sendBatch).toHaveBeenCalledTimes(3)
    for (const call of sendBatch.mock.calls) {
      expect(call[0].length).toBeLessThanOrEqual(500)
    }
    expect(res?.applied).toBe(1200)
    expect(await pendingGameEventCount(USER)).toBe(0)
  })

  it("flush keeps the unsent remainder when a mid-chunk send fails", async () => {
    const events = Array.from({ length: 600 }, (_, i) => ev(`part-${i}`))
    storage.set(`game-event-queue:${USER}`, JSON.stringify(events))
    const sendBatch = vi
      .fn()
      .mockImplementationOnce(async (batch: GameEventIn[]) =>
        syncResponse(batch.map((e) => e.client_event_id))
      )
      .mockRejectedValueOnce(new Error("offline"))
    await expect(flushGameEventQueue(USER, sendBatch)).rejects.toThrow(
      "offline"
    )
    // First 500 settled and dropped; the failed chunk stays queued.
    expect(await pendingGameEventCount(USER)).toBe(100)
  })
})
