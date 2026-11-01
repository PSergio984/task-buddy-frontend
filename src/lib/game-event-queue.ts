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

/** Statuses that mean "this batch can never succeed" — dead-letter it. 401
 * and 429 are deliberately absent: a refresh may mint a new token and a
 * rate limit clears, so those retain + retry like 5xx/network. */
const DEAD_LETTER_STATUSES = new Set([400, 403, 404, 409, 422])

/**
 * Stored shape: the event plus the owning user's id. The stamp makes the
 * auth binding explicit — a mis-keyed enqueue can then be caught (and
 * re-filed) at flush instead of scoring under the wrong account. The marker
 * is client-side only; it is stripped before POST.
 */
export interface QueuedGameEvent extends GameEventIn {
  user_id?: UserId
}

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

async function readQueue(userId: UserId): Promise<QueuedGameEvent[]> {
  const stored = await get<QueuedGameEvent[]>(queueKey(userId))
  return Array.isArray(stored) ? stored : []
}

export function listGameEvents(userId: UserId): Promise<QueuedGameEvent[]> {
  return serialized(() => readQueue(userId))
}

export function enqueueGameEvent(
  userId: UserId,
  event: GameEventIn
): Promise<void> {
  return serialized(async () => {
    const current = await readQueue(userId)
    if (current.some((e) => e.client_event_id === event.client_event_id)) return
    current.push({ ...event, user_id: userId })
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
    // Events stamped for another user must not POST under this auth —
    // re-file them under their owner's queue key (that user may return)
    // and drop them from this queue. Unstamped (pre-migration) events are
    // trusted to the key they live under.
    const foreign = pending.filter(
      (e) => e.user_id !== undefined && e.user_id !== userId
    )
    if (foreign.length > 0) {
      for (const e of foreign) {
        const ownerQueue = await readQueue(e.user_id as UserId)
        if (!ownerQueue.some((x) => x.client_event_id === e.client_event_id)) {
          ownerQueue.push(e)
          await set(queueKey(e.user_id as UserId), ownerQueue)
        }
      }
      const drop = new Set(foreign.map((e) => e.client_event_id))
      const current = await readQueue(userId)
      await set(
        queueKey(userId),
        current.filter((e) => !drop.has(e.client_event_id))
      )
    }
    const sendable = pending.filter(
      (e) => e.user_id === undefined || e.user_id === userId
    )
    if (sendable.length === 0) return null
    let last: GameSyncResponse | null = null
    const mergedResults: GameSyncResponse["results"] = []
    for (let i = 0; i < sendable.length; i += FLUSH_CHUNK) {
      const chunk = sendable.slice(i, i + FLUSH_CHUNK)
      let res: GameSyncResponse
      try {
        // Strip the client-side user marker before POST (backend ignores
        // extras, but the wire stays contract-clean).
        res = await sendBatch(chunk.map(({ user_id: _u, ...event }) => event))
      } catch (error) {
        // Definitive rejections dead-letter — anything else (401/429/5xx/
        // network) retains the chunk and retries, or the whole queue
        // wedges behind a batch that may succeed later.
        if (
          axios.isAxiosError(error) &&
          error.response !== undefined &&
          DEAD_LETTER_STATUSES.has(error.response.status)
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
