import type { BreakdownTaskProposal, TaskCreateData } from "@/lib/api"
import {
  SUBTASK_TITLE_LIMIT,
  TASK_TITLE_LIMIT,
  commitProposalCards,
} from "./proposal-cards"

/** One editable draft card in the proposal list. */
export interface DraftCard {
  number: number
  accepted: boolean
  title: string
  effortMinutes: number | null
  subtasks: { title: string; accepted: boolean }[]
  status: "draft" | "creating" | "created" | "failed"
  /**
   * Assigned on the card's first commit attempt and reused on retries — a
   * retry after a lost response replays the backend's cached result instead
   * of double-creating. Edits keep it (spread updaters preserve the field):
   * a same-key different-body retry 422s and resolves as already-created.
   */
  idempotencyKey?: string
}

export function toDraftCard(
  task: BreakdownTaskProposal,
  number: number
): DraftCard {
  return {
    number,
    accepted: true,
    // maxLength only caps typed input — clip model output at intake so an
    // over-limit proposal can't 422 the create.
    title: task.title.trim().slice(0, TASK_TITLE_LIMIT),
    effortMinutes: task.estimated_effort_minutes ?? null,
    subtasks: task.subtasks.map((sub) => ({
      title: sub.title.trim().slice(0, SUBTASK_TITLE_LIMIT),
      accepted: true,
    })),
    status: "draft",
  }
}

/** Replace the card at `targetNumber` (stable chip id), regardless of title.
 *  Note: replacements arrive keyless — refining a FAILED card whose create
 *  actually landed server-side (lost response) orphans that task; a retry of
 *  the same card is the safe recovery, refine is a new proposal. */
export function replaceCard(
  prev: DraftCard[],
  targetNumber: number,
  replacements: DraftCard[]
): DraftCard[] {
  if (!prev.some((card) => card.number === targetNumber)) {
    return [...prev, ...replacements]
  }
  // The first replacement inherits the target number so existing references
  // stay valid; siblings get their own numbers.
  return prev.flatMap((card) => {
    if (card.number !== targetNumber) return [card]
    return replacements.length > 0
      ? replacements.map((replacement, index) =>
          index === 0 ? { ...replacement, number: targetNumber } : replacement
        )
      : []
  })
}

export function toBreakdownTaskCreateData(
  card: DraftCard,
  projectId?: number
): TaskCreateData {
  return {
    // Values are clipped to the backend limits — the title input has no
    // maxLength, so an edit can exceed what intake clipped and 422 the create.
    title: card.title.trim().slice(0, TASK_TITLE_LIMIT),
    estimated_effort_minutes: card.effortMinutes ?? undefined,
    project_id: projectId,
    subtasks: card.subtasks
      .filter((sub) => sub.accepted && sub.title.trim())
      .map((sub) => ({
        title: sub.title.trim().slice(0, SUBTASK_TITLE_LIMIT),
      })),
  }
}

/** Cards still eligible for creation: accepted, titled, not yet created. */
export function committableCards(cards: DraftCard[]): DraftCard[] {
  return cards.filter(
    (card) =>
      card.accepted && card.status !== "created" && card.title.trim() !== ""
  )
}

export interface BreakdownCommitResult {
  created: number
  failed: number
}

/**
 * Creates one task per committable card via the shared `commitProposalCards`
 * loop: each card gets its own uuid-v4 key on first attempt via
 * `onKeyAssigned`; the caller persists it on the card so a retried commit
 * reuses it — the backend then replays instead of double-creating.
 */
export function commitBreakdownCards(
  cards: DraftCard[],
  createTask: (
    data: TaskCreateData,
    idempotencyKey: string
  ) => Promise<unknown>,
  onStatus?: (cardNumber: number, status: DraftCard["status"]) => void,
  onKeyAssigned?: (cardNumber: number, key: string) => void,
  projectId?: number
): Promise<BreakdownCommitResult> {
  return commitProposalCards(
    committableCards(cards),
    createTask,
    (card) => toBreakdownTaskCreateData(card, projectId),
    onStatus,
    onKeyAssigned
  )
}
