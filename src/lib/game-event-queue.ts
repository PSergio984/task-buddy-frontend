/**
 * Offline queue for client-claimable game events (POST /api/v1/game/events).
 *
 * Same idb-keyval pattern as sync-queue.ts, but keyed by the event's own
 * client_event_id — the backend dedupes on it, so enqueue is idempotent and a
 * re-emitted event can never double-count.
 *
 * Every mutation chains onto `tail`: read-modify-write ops fired concurrently
 * (a transition emitting several events, a flush interleaving an enqueue)
 * would otherwise clobber each other's snapshot and silently drop events.
 */
import axios from "axios"
import { get, set } from "idb-keyval"
import type { GameEventIn, GameSyncResponse } from "@/lib/api"
import type { UserId } from "@/lib/sync-queue"

/** GameEventBatch maxItems — a larger POST is rejected wholesale (422). */
const FLUSH_CHUNK = 500

function queueKey(userId: UserId): string {
  return `game-event-queue:${userId}`
}

let tail: Promise<unknown> = Promise.resolve()

// Residual: `tail` serializes ops within THIS tab only. A second tab's
// flush can interleave this tab's enqueue read-modify-write and lose one
// event — mitigated by the shared client_id + server dedupe making a
// re-emitted event safe to replay, not by cross-tab locking.
function serialized<T>(op: () => Promise<T>): Promise<T> {
  const run = tail.then(op)
  tail = run.catch(() => {})
  return run
}

async function readQueue(userId: UserId): Promise<GameEventIn[]> {
  const stored = await get<GameEventIn[]>(queueKey(userId))
  return Array.isArray(stored) ? stored : []
}

export function listGameEvents(userId: UserId): Promise<GameEventIn[]> {
  return serialized(() => readQueue(userId))
}

export function enqueueGameEvent(
  userId: UserId,
  event: GameEventIn
): Promise<void> {
  return serialized(async () => {
    const current = await readQueue(userId)
    if (current.some((e) => e.client_event_id === event.client_event_id)) return
    current.push(event)
    await set(queueKey(userId), current)
  })
}

export function removeGameEvents(
  userId: UserId,
  clientEventIds: string[]
): Promise<void> {
  return serialized(async () => {
    const toRemove = new Set(clientEventIds)
    const current = await readQueue(userId)
    await set(
      queueKey(userId),
      current.filter((e) => !toRemove.has(e.client_event_id))
    )
  })
}

/** Drop every queued event whose id carries the prefix (one local session). */
export function removeGameEventsByPrefix(
  userId: UserId,
  clientEventIdPrefix: string
): Promise<number> {
  return serialized(async () => {
    const current = await readQueue(userId)
    const kept = current.filter(
      (e) => !e.client_event_id.startsWith(clientEventIdPrefix)
    )
    if (kept.length !== current.length) await set(queueKey(userId), kept)
    return current.length - kept.length
  })
}

export function pendingGameEventCount(userId: UserId): Promise<number> {
  return serialized(async () => (await readQueue(userId)).length)
}

/**
 * Post the queue in ≤500-event chunks and drop every event the server settled
 * (applied or duplicate). Chunks send sequentially so a failure keeps the
 * unsent remainder queued; the merged result reports the last known profile.
 */
export function flushGameEventQueue(
  userId: UserId,
  sendBatch: (events: GameEventIn[]) => Promise<GameSyncResponse>
): Promise<GameSyncResponse | null> {
  // Holding the serial lock across chunk I/O is intentional: ordering-safe.
  return serialized(async () => {
    const pending = await readQueue(userId)
    if (pending.length === 0) return null
    let last: GameSyncResponse | null = null
    const mergedResults: GameSyncResponse["results"] = []
    for (let i = 0; i < pending.length; i += FLUSH_CHUNK) {
      const chunk = pending.slice(i, i + FLUSH_CHUNK)
      let res: GameSyncResponse
      try {
        res = await sendBatch(chunk)
      } catch (error) {
        // A 4xx rejects the batch permanently — retrying it wedges every
        // event behind it. Dead-letter the chunk (eids logged for
        // forensics) and continue; 5xx/network still retains + retries.
        if (
          axios.isAxiosError(error) &&
          error.response !== undefined &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          console.error(
            `Game-event chunk rejected (${error.response.status}) — dead-lettering:`,
            chunk.map((e) => e.client_event_id)
          )
          const drop = new Set(chunk.map((e) => e.client_event_id))
          const current = await readQueue(userId)
          await set(
            queueKey(userId),
            current.filter((e) => !drop.has(e.client_event_id))
          )
          continue
        }
        throw error
      }
      last = res
      mergedResults.push(...res.results)
      const settled = res.results.map((r) => r.client_event_id)
      const current = await readQueue(userId)
      const drop = new Set(settled)
      await set(
        queueKey(userId),
        current.filter((e) => !drop.has(e.client_event_id))
      )
    }
    if (last === null) return null
    return {
      ...last,
      results: mergedResults,
      applied: mergedResults.filter((r) => r.status === "applied").length,
      duplicates: mergedResults.filter((r) => r.status === "duplicate").length,
    }
  })
}
