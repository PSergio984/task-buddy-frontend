import { del, get, set } from "idb-keyval"
import { createUuid } from "@/lib/utils"

export type SyncEntity = "task" | "subtask" | "project"
export type SyncOp = "update" | "delete"

export interface PendingMutation {
  queueId: string
  entity: SyncEntity
  id: number
  op: SyncOp
  payload: Record<string, unknown>
  client_updated_at: string
}

export type UserId = number | string

function queueKey(userId: UserId): string {
  return `sync-pending-mutations:${userId}`
}

export async function listMutations(
  userId: UserId
): Promise<PendingMutation[]> {
  const stored = await get<PendingMutation[]>(queueKey(userId))
  return Array.isArray(stored) ? stored : []
}

export async function enqueueMutation(
  userId: UserId,
  mutation: Omit<PendingMutation, "queueId">
): Promise<void> {
  const current = await listMutations(userId)
  current.push({ ...mutation, queueId: createUuid() })
  await set(queueKey(userId), current)
}

export async function removeMutations(
  userId: UserId,
  queueIds: string[]
): Promise<void> {
  const toRemove = new Set(queueIds)
  const current = await listMutations(userId)
  await set(
    queueKey(userId),
    current.filter((m) => !toRemove.has(m.queueId))
  )
}

export async function pendingMutationCount(userId: UserId): Promise<number> {
  return (await listMutations(userId)).length
}

export async function clearMutations(userId: UserId): Promise<void> {
  await del(queueKey(userId))
}
