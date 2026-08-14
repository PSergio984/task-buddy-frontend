import type { PendingMutation } from "./sync-queue"

export type PendingMutationInput = Omit<PendingMutation, "queueId">

interface EnqueueOrCallOptions<T> {
  isOnline: () => boolean
  call: (mutation: PendingMutationInput) => Promise<T>
  enqueue: (mutation: PendingMutationInput) => Promise<void>
  mutation: PendingMutationInput
}

export interface EnqueueOrCallResult<T> {
  queued: boolean
  data: T | null
  error: unknown
}

export async function enqueueOrCall<T>({
  isOnline,
  call,
  enqueue,
  mutation,
}: EnqueueOrCallOptions<T>): Promise<EnqueueOrCallResult<T>> {
  if (!isOnline()) {
    await enqueue(mutation)
    return { queued: true, data: null, error: null }
  }
  try {
    const data = await call(mutation)
    return { queued: false, data, error: null }
  } catch (error) {
    await enqueue(mutation)
    return { queued: true, data: null, error }
  }
}
