import type { BreakdownTaskProposal } from "@/lib/api"
import { SUBTASK_TITLE_LIMIT, TASK_TITLE_LIMIT } from "./proposal-cards"

/** One editable draft card in the proposal list. */
export interface DraftCard {
  number: number
  accepted: boolean
  title: string
  effortMinutes: number | null
  subtasks: { title: string; accepted: boolean }[]
  status: "draft" | "creating" | "created" | "failed"
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

/** Replace the card at `targetNumber` (stable chip id), regardless of title. */
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
