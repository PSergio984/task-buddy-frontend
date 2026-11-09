import { createIdempotencyKey, type TaskCreateData } from "@/lib/api"

export interface SubtaskItem {
  title: string
  accepted: boolean
}

/** Backend field limits (app/schemas/task.py): TaskCreate.title,
 *  TaskCreate.description and SubtaskCreate.title — oversized values 422. */
export const TASK_TITLE_LIMIT = 100
export const TASK_DESCRIPTION_LIMIT = 2_000
export const SUBTASK_TITLE_LIMIT = 80

/** Card-updater factory: transform the subtask at `index` in a card's list. */
export function updateSubtaskAt<
  T extends { subtasks: { title: string; accepted: boolean }[] },
>(
  index: number,
  transform: (item: { title: string; accepted: boolean }) => {
    title: string
    accepted: boolean
  }
) {
  return (prev: T): T => ({
    ...prev,
    subtasks: prev.subtasks.map((item, itemIndex) =>
      itemIndex === index ? transform(item) : item
    ),
  })
}

/** The fields a proposal card must carry for `commitProposalCards`. */
interface CommittableCard {
  number: number
  status: "draft" | "creating" | "created" | "failed"
  /**
   * Assigned on the card's first commit attempt and reused on retries — a
   * retry after a lost response replays the backend's cached result instead
   * of double-creating.
   */
  idempotencyKey?: string
}

export interface ProposalCommitResult {
  created: number
  failed: number
}

/**
 * Maps a propose()/extract() failure to the sheet's banners. Two different
 * 429s: the daily AI budget (backend detail) dead-ends until tomorrow;
 * slowapi's per-minute rate limit is a retryable "slow down" — same status,
 * very different meaning.
 */
export function classifyProposeError(err: unknown): {
  budgetExhausted: boolean
  message: string | null
} {
  const status = (err as { response?: { status?: number } }).response?.status
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    .response?.data?.detail
  if (
    status === 429 &&
    typeof detail === "string" &&
    /daily ai usage limit/i.test(detail)
  ) {
    return { budgetExhausted: true, message: null }
  }
  if (status === 429) {
    return {
      budgetExhausted: false,
      message: "Too many attempts — wait a moment, then try again.",
    }
  }
  return {
    budgetExhausted: false,
    message:
      status === 503
        ? "The AI service isn't available right now. Try again later."
        : "Something went wrong. Please try again.",
  }
}

/**
 * A same-key/different-body 422 means the first POST DID land — the user
 * edited the card after a create that succeeded server-side but failed
 * client-side (lost response). The task exists with its earlier payload;
 * mark it created instead of failing every retry.
 */
function isAlreadyCreatedError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } }).response?.status
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    .response?.data?.detail
  let message = err instanceof Error ? err.message : ""
  if (typeof detail === "string") message = detail
  // The middleware's exact same-key/different-body 422 — a looser match
  // could mark a card created on an unrelated idempotency validation error.
  return status === 422 && /different request body/i.test(message)
}

/**
 * Creates one task per target card, sequentially — each response feeds the
 * next card's status UX and parallel posts would hammer the rate limit.
 * Each card gets its own uuid-v4 key on first attempt via `onKeyAssigned`;
 * the caller persists it on the card so a retried commit reuses it — the
 * backend then replays instead of double-creating.
 */
export async function commitProposalCards<T extends CommittableCard>(
  targets: T[],
  createTask: (
    data: TaskCreateData,
    idempotencyKey: string
  ) => Promise<unknown>,
  toCreateData: (card: T) => TaskCreateData,
  onStatus?: (cardNumber: number, status: CommittableCard["status"]) => void,
  onKeyAssigned?: (cardNumber: number, key: string) => void
): Promise<ProposalCommitResult> {
  let created = 0
  for (const card of targets) {
    const key = card.idempotencyKey ?? createIdempotencyKey()
    if (card.idempotencyKey === undefined) onKeyAssigned?.(card.number, key)
    onStatus?.(card.number, "creating")
    try {
      await createTask(toCreateData(card), key)
      onStatus?.(card.number, "created")
      created += 1
    } catch (err) {
      if (isAlreadyCreatedError(err)) {
        onStatus?.(card.number, "created")
        created += 1
      } else {
        onStatus?.(card.number, "failed")
      }
    }
  }
  return { created, failed: targets.length - created }
}
