import { get, set } from "idb-keyval"
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

const QUEUE_KEY = "sync-pending-mutations"

export async function listMutations(): Promise<PendingMutation[]> {
  const stored = await get<PendingMutation[]>(QUEUE_KEY)
  return Array.isArray(stored) ? stored : []
}

export async function enqueueMutation(
  mutation: Omit<PendingMutation, "queueId">
): Promise<void> {
  const current = await listMutations()
  current.push({ ...mutation, queueId: createUuid() })
  await set(QUEUE_KEY, current)
}

export async function removeMutations(queueIds: string[]): Promise<void> {
  const toRemove = new Set(queueIds)
  const current = await listMutations()
  await set(
    QUEUE_KEY,
    current.filter((m) => !toRemove.has(m.queueId))
  )
}

export async function pendingMutationCount(): Promise<number> {
  return (await listMutations()).length
}
