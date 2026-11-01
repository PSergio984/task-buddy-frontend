/**
 * Offline queue for client-claimable game events (POST /api/v1/game/events).
 *
 * Same idb-keyval pattern as sync-queue.ts, but keyed by the event's own
 * client_event_id — the backend dedupes on it, so enqueue is idempotent and a
 * re-emitted event can never double-count.
 */
import { del, get, set } from "idb-keyval"
import type { GameEventIn, GameSyncResponse } from "@/lib/api"
import type { UserId } from "@/lib/sync-queue"

function queueKey(userId: UserId): string {
  return `game-event-queue:${userId}`
}

export async function listGameEvents(userId: UserId): Promise<GameEventIn[]> {
  const stored = await get<GameEventIn[]>(queueKey(userId))
  return Array.isArray(stored) ? stored : []
}

export async function enqueueGameEvent(
  userId: UserId,
  event: GameEventIn
): Promise<void> {
  const current = await listGameEvents(userId)
  if (current.some((e) => e.client_event_id === event.client_event_id)) return
  current.push(event)
  await set(queueKey(userId), current)
}

export async function removeGameEvents(
  userId: UserId,
  clientEventIds: string[]
): Promise<void> {
  const toRemove = new Set(clientEventIds)
  const current = await listGameEvents(userId)
  await set(
    queueKey(userId),
    current.filter((e) => !toRemove.has(e.client_event_id))
  )
}

export async function pendingGameEventCount(userId: UserId): Promise<number> {
  return (await listGameEvents(userId)).length
}

export async function clearGameEvents(userId: UserId): Promise<void> {
  await del(queueKey(userId))
}

/**
 * Post the whole queue as one batch and drop every event the server settled
 * (applied or duplicate). A failed send keeps the queue intact for the next
 * trigger; events the response doesn't cover are kept too.
 */
export async function flushGameEventQueue(
  userId: UserId,
  sendBatch: (events: GameEventIn[]) => Promise<GameSyncResponse>
): Promise<GameSyncResponse | null> {
  const pending = await listGameEvents(userId)
  if (pending.length === 0) return null
  const response = await sendBatch(pending)
  const settled = response.results.map((r) => r.client_event_id)
  await removeGameEvents(userId, settled)
  return response
}
