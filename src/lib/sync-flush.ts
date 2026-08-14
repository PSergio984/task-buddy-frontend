import {
  listMutations,
  removeMutations,
  type PendingMutation,
  type SyncEntity,
  type SyncOp,
} from "./sync-queue"
import type { SyncDelta } from "./sync-delta"
import type { PendingMutationInput } from "./sync-enqueue"

export interface SyncAppliedItem {
  entity: SyncEntity
  id: number
  op: SyncOp
  server_updated_at?: string
}

export interface SyncConflictItem {
  entity: SyncEntity
  id: number
  op: SyncOp
  server_state?: Record<string, unknown>
}

export interface SyncNotFoundItem {
  entity: SyncEntity
  id: number
  op: SyncOp
}

export interface SyncResponse {
  applied: SyncAppliedItem[]
  conflicts: SyncConflictItem[]
  not_found: SyncNotFoundItem[]
  delta: SyncDelta
  since: string
}

export interface FlushOptions {
  sendSync: (request: {
    changes: PendingMutationInput[]
  }) => Promise<SyncResponse>
  isOnline: () => boolean
}

export interface FlushResult {
  conflictCount: number
  conflicts: SyncConflictItem[]
  delta: SyncDelta
  retryAfterSec: number | null
}

const MAX_CHANGES_PER_REQUEST = 500
const DEFAULT_RETRY_AFTER_SEC = 60

function isRateLimited(error: unknown): {
  rateLimited: boolean
  retryAfterSec: number | null
} {
  const status = (error as { response?: { status?: number } })?.response?.status
  if (status !== 429) return { rateLimited: false, retryAfterSec: null }
  const headers = (error as { response?: { headers?: Record<string, string> } })
    ?.response?.headers
  const retryAfter = headers?.["retry-after"]
  const retryAfterSec = retryAfter ? Number(retryAfter) : NaN
  return {
    rateLimited: true,
    retryAfterSec: Number.isFinite(retryAfterSec)
      ? retryAfterSec
      : DEFAULT_RETRY_AFTER_SEC,
  }
}

export async function flushSync({
  sendSync,
  isOnline,
}: FlushOptions): Promise<FlushResult> {
  const emptyDelta: SyncDelta = { tasks: [], subtasks: [], projects: [] }
  if (!isOnline()) {
    return {
      conflictCount: 0,
      conflicts: [],
      delta: emptyDelta,
      retryAfterSec: null,
    }
  }

  const mutations = await listMutations()
  if (mutations.length === 0) {
    return {
      conflictCount: 0,
      conflicts: [],
      delta: emptyDelta,
      retryAfterSec: null,
    }
  }

  const batch = mutations.slice(0, MAX_CHANGES_PER_REQUEST)
  const changes: PendingMutationInput[] = batch.map((m: PendingMutation) => ({
    entity: m.entity,
    id: m.id,
    op: m.op,
    payload: m.payload,
    client_updated_at: m.client_updated_at,
  }))

  let response: SyncResponse
  try {
    response = await sendSync({ changes })
  } catch (error) {
    const { rateLimited, retryAfterSec } = isRateLimited(error)
    if (rateLimited) {
      return {
        conflictCount: 0,
        conflicts: [],
        delta: emptyDelta,
        retryAfterSec,
      }
    }
    throw error
  }

  const settledKeys = new Set([
    ...response.applied.map((item) => `${item.entity}:${item.id}:${item.op}`),
    ...response.conflicts.map((item) => `${item.entity}:${item.id}:${item.op}`),
    ...response.not_found.map((item) => `${item.entity}:${item.id}:${item.op}`),
  ])
  const settledQueueIds = batch
    .filter((m) => settledKeys.has(`${m.entity}:${m.id}:${m.op}`))
    .map((m) => m.queueId)
  await removeMutations(settledQueueIds)

  return {
    conflictCount: response.conflicts.length,
    conflicts: response.conflicts,
    delta: response.delta,
    retryAfterSec: null,
  }
}
