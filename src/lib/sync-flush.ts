import {
  listMutations,
  removeMutations,
  type PendingMutation,
  type SyncEntity,
  type SyncOp,
  type UserId,
} from "./sync-queue"
import type { SyncConflict, SyncDelta } from "./sync-delta"
import type { PendingMutationInput } from "./sync-enqueue"
import { getHttpErrorStatus, getRetryAfterSec } from "@/lib/errors"

export type SyncConflictItem = SyncConflict

export interface SyncAppliedItem {
  entity: SyncEntity
  id: number
  op: SyncOp
  server_updated_at?: string
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
  userId: UserId
}

export interface FlushResult {
  conflictCount: number
  conflicts: SyncConflictItem[]
  notFound: SyncNotFoundItem[]
  delta: SyncDelta
  since: string | null
  retryAfterSec: number | null
}

const MAX_CHANGES_PER_REQUEST = 500
const DEFAULT_RETRY_AFTER_SEC = 60

const EMPTY_RESULT: Omit<FlushResult, "retryAfterSec"> = {
  conflictCount: 0,
  conflicts: [],
  notFound: [],
  delta: { tasks: [], subtasks: [], projects: [] },
  since: null,
}

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
  userId,
}: FlushOptions): Promise<FlushResult> {
  if (!isOnline()) {
    return { ...EMPTY_RESULT, retryAfterSec: null }
  }

  const mutations = await listMutations(userId)
  if (mutations.length === 0) {
    return { ...EMPTY_RESULT, retryAfterSec: null }
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
      return { ...EMPTY_RESULT, retryAfterSec }
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
  await removeMutations(userId, settledQueueIds)

  return {
    conflictCount: response.conflicts.length,
    conflicts: response.conflicts,
    notFound: response.not_found,
    delta: response.delta,
    since: response.since,
    retryAfterSec: null,
  }
}
