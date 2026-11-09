import {
  createIdempotencyKey,
  type ImportTaskProposal,
  type TaskCreateData,
  type TaskPriority,
} from "@/lib/api"
import {
  SUBTASK_TITLE_LIMIT,
  TASK_DESCRIPTION_LIMIT,
  TASK_TITLE_LIMIT,
} from "./proposal-cards"

/** Client-side cap mirroring the backend's 1..10_000-char body limit. */
export const IMPORT_TEXT_LIMIT = 10_000

const ACCEPTED_EXTENSIONS = [".md", ".txt"]

export function isAcceptedImportFile(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Returns a user-facing error string, or null when the text is submittable. */
export function validateImportText(text: string): string | null {
  if (!text.trim()) {
    return "There's nothing to import yet — paste or drop some notes first."
  }
  if (text.length > IMPORT_TEXT_LIMIT) {
    return `That's ${text.length.toLocaleString()} characters — the limit is ${IMPORT_TEXT_LIMIT.toLocaleString()}.`
  }
  return null
}

/** Reads a dropped/picked .md/.txt file to text, enforcing the char limit. */
export function readImportFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isAcceptedImportFile(file.name)) {
      reject(new Error("Only .md and .txt files can be imported."))
      return
    }
    // Bail before loading: a UTF-8 file uses at most 3 bytes per UTF-16 unit,
    // so anything over this bound can't fit the char limit anyway.
    if (file.size > IMPORT_TEXT_LIMIT * 3) {
      reject(
        new Error(
          `"${file.name}" is too large — the limit is ${IMPORT_TEXT_LIMIT.toLocaleString()} characters.`
        )
      )
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Couldn't read that file."))
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      if (text.length > IMPORT_TEXT_LIMIT) {
        reject(
          new Error(
            `"${file.name}" is ${text.length.toLocaleString()} characters — the limit is ${IMPORT_TEXT_LIMIT.toLocaleString()}.`
          )
        )
        return
      }
      resolve(text)
    }
    reader.readAsText(file)
  })
}

export type ImportCardStatus = "draft" | "creating" | "created" | "failed"

/** One editable draft card in the import proposal list. */
export interface ImportDraftCard {
  number: number
  included: boolean
  title: string
  description: string
  /** yyyy-mm-dd for the date input (null when no deadline). */
  deadline: string | null
  priority: TaskPriority
  projectId: number | null
  subtasks: { title: string; accepted: boolean }[]
  status: ImportCardStatus
  /**
   * Assigned on the card's first commit attempt and reused on retries — a
   * retry after a lost response replays the backend's cached result instead
   * of double-creating. Edits keep it (see `editImportCard`): a same-key
   * different-body retry 422s and resolves as already-created.
   */
  idempotencyKey?: string
}

/** Extracts the yyyy-mm-dd prefix a date input needs from an ISO string. */
export function isoToDateInput(iso: string | null): string | null {
  if (!iso) return null
  const match = /^\d{4}-\d{2}-\d{2}/.exec(iso.trim())
  return match ? match[0] : null
}

export function toImportDraftCard(
  proposal: ImportTaskProposal,
  number: number,
  fallbackProjectId?: number
): ImportDraftCard {
  return {
    number,
    included: true,
    // Clip at intake so the card shows exactly what `toTaskCreateData` will
    // send — the create-side clip must not silently diverge from the preview.
    title: proposal.title.trim().slice(0, TASK_TITLE_LIMIT),
    description:
      proposal.description?.trim().slice(0, TASK_DESCRIPTION_LIMIT) ?? "",
    deadline: isoToDateInput(proposal.proposed_deadline),
    priority: proposal.priority,
    projectId: proposal.suggested_project_id ?? fallbackProjectId ?? null,
    subtasks: proposal.subtasks.map((sub) => ({
      title: sub.title.trim().slice(0, SUBTASK_TITLE_LIMIT),
      accepted: true,
    })),
    status: "draft",
  }
}

/**
 * Applies an edit to a card. The persisted idempotency key is NEVER cleared:
 * keys only exist on failed cards, and a retry under the same key either
 * replays the cached create (same body) or — when the edit changed the
 * body — 422s, which `commitImportCards` resolves as already-created.
 * Minting a fresh key there would double-create the task.
 */
export function editImportCard(
  card: ImportDraftCard,
  updater: (card: ImportDraftCard) => ImportDraftCard
): ImportDraftCard {
  return updater(card)
}

/** Cards still eligible for creation: included, titled, not yet created. */
export function committableCards(cards: ImportDraftCard[]): ImportDraftCard[] {
  return cards.filter(
    (card) =>
      card.included && card.status !== "created" && card.title.trim() !== ""
  )
}

export function toTaskCreateData(card: ImportDraftCard): TaskCreateData {
  return {
    // Values are clipped to the backend limits — an oversized AI proposal
    // isn't fixable by typing (maxLength caps input, not initial values)
    // and would 422 the create.
    title: card.title.trim().slice(0, TASK_TITLE_LIMIT),
    ...(card.description.trim()
      ? {
          description: card.description.trim().slice(0, TASK_DESCRIPTION_LIMIT),
        }
      : {}),
    priority: card.priority,
    ...(card.projectId != null ? { project_id: card.projectId } : {}),
    // TaskCreate takes an ISO timestamp — midnight local like the pickers.
    ...(card.deadline
      ? { due_date: new Date(`${card.deadline}T00:00:00`).toISOString() }
      : {}),
    subtasks: card.subtasks
      .filter((sub) => sub.accepted && sub.title.trim())
      .map((sub) => ({
        title: sub.title.trim().slice(0, SUBTASK_TITLE_LIMIT),
      })),
  }
}

export interface ImportCommitResult {
  created: number
  failed: number
}

/**
 * Creates one task per committable card, sequentially (same cadence as the
 * breakdown commit). Each card gets its own uuid-v4 key on first attempt via
 * `onKeyAssigned`; the caller persists it on the card so a retried commit
 * reuses it — the backend then replays instead of double-creating.
 */
export async function commitImportCards(
  cards: ImportDraftCard[],
  createTask: (
    data: TaskCreateData,
    idempotencyKey: string
  ) => Promise<unknown>,
  onStatus?: (cardNumber: number, status: ImportCardStatus) => void,
  onKeyAssigned?: (cardNumber: number, key: string) => void
): Promise<ImportCommitResult> {
  const targets = committableCards(cards)
  let created = 0
  for (const card of targets) {
    const key = card.idempotencyKey ?? createIdempotencyKey()
    if (card.idempotencyKey === undefined) onKeyAssigned?.(card.number, key)
    onStatus?.(card.number, "creating")
    try {
      await createTask(toTaskCreateData(card), key)
      onStatus?.(card.number, "created")
      created += 1
    } catch (err) {
      // Same key + a different body means the first POST DID land — the
      // user edited the card after a create that succeeded server-side but
      // failed client-side (lost response). The task exists with its
      // earlier payload; mark it created instead of failing every retry.
      const status = (err as { response?: { status?: number } }).response
        ?.status
      const detail = (err as { response?: { data?: { detail?: unknown } } })
        .response?.data?.detail
      const message =
        typeof detail === "string"
          ? detail
          : err instanceof Error
            ? err.message
            : ""
      if (
        status === 422 &&
        /idempotency|different request body/i.test(message)
      ) {
        onStatus?.(card.number, "created")
        created += 1
      } else {
        onStatus?.(card.number, "failed")
      }
    }
  }
  return { created, failed: targets.length - created }
}
