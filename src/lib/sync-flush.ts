import {
  listMutations,
  removeMutations,
  type PendingMutation,
  type SyncEntity,
  type SyncOp,
} from "./sync-queue"
import type { SyncDelta } from "./sync-delta"
import type { PendingMutationInput } from "./sync-enqueue"
import { getHttpErrorStatus, getRetryAfterSec } from "@/lib/errors"

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
    since?: string
    changes: PendingMutationInput[]
  }) => Promise<SyncResponse>
  isOnline: () => boolean
  since?: string | null
}

export interface FlushResult {
  conflictCount: number
  conflicts: SyncConflictItem[]
  delta: SyncDelta
  since: string | null
  retryAfterSec: number | null
}

const MAX_CHANGES_PER_REQUEST = 500
const DEFAULT_RETRY_AFTER_SEC = 60

function isRateLimited(error: unknown): {
  rateLimited: boolean
  retryAfterSec: number | null
} {
  if (getHttpErrorStatus(error) !== 429) {
    return { rateLimited: false, retryAfterSec: null }
  }
  return {
    rateLimited: true,
    retryAfterSec: getRetryAfterSec(error) ?? DEFAULT_RETRY_AFTER_SEC,
  }
}

export async function flushSync({
  sendSync,
  isOnline,
  since,
}: FlushOptions): Promise<FlushResult> {
  const emptyDelta: SyncDelta = { tasks: [], subtasks: [], projects: [] }
  if (!isOnline()) {
    return {
      conflictCount: 0,
      conflicts: [],
      delta: emptyDelta,
      since: null,
      retryAfterSec: null,
    }
  }

  const mutations = await listMutations()
  if (mutations.length === 0) {
    return {
      conflictCount: 0,
      conflicts: [],
      delta: emptyDelta,
      since: null,
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
    response = await sendSync({ since: since ?? undefined, changes })
  } catch (error) {
    const { rateLimited, retryAfterSec } = isRateLimited(error)
    if (rateLimited) {
      return {
        conflictCount: 0,
        conflicts: [],
        delta: emptyDelta,
        since: null,
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
    since: response.since,
    retryAfterSec: null,
  }
}
