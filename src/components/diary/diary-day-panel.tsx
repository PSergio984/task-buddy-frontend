import { useState, type ReactNode } from "react"
import { Check, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmationModal } from "@/components/confirmation-modal"
import type { DiaryEntry, DiaryEntryPatch } from "@/lib/api"
import { utcTimeLabel } from "@/lib/diary"
import { ms } from "@/lib/focus-session"

/** Mirrors the backend's _TEXT_MAX_LEN on diary fields. */
const FIELD_MAX = 10_000

export interface StandupFields {
  good: string
  bad: string
  next: string
}

interface DiaryDayPanelProps {
  readonly entries: DiaryEntry[]
  /** Merged timeline view: no forms, no row actions. */
  readonly readOnly?: boolean
  /** Offline or beyond the retention horizon — writes are rejected server-side. */
  readonly writesDisabled?: boolean
  readonly disabledReason?: string | null
  readonly busy?: boolean
  readonly onCreateStandup?: (fields: StandupFields) => void
  readonly onCreateFreeform?: (freeform: string) => void
  /** May return a promise — the editor closes only once it resolves. */
  readonly onUpdateEntry?: (id: number, patch: DiaryEntryPatch) => unknown
  readonly onDeleteEntry?: (id: number) => void
}

const FIELD_LABELS: ReadonlyArray<{ key: keyof StandupFields; label: string }> =
  [
    { key: "good", label: "Went well" },
    { key: "bad", label: "Didn't go well" },
    { key: "next", label: "Up next" },
  ]

const fieldClass =
  "min-h-[64px] rounded-2xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"

const cardClass = "rounded-3xl border border-white/10 bg-white/5 p-5"

function entryTimeLabel(entry: DiaryEntry): string {
  const created = ms(entry.created_at)
  // ms() yields NaN on a malformed ISO — never print "NaN:NaN".
  return created !== null && Number.isFinite(created)
    ? `${utcTimeLabel(created)} UTC`
    : "time unknown"
}

function StandupForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: StandupFields
  submitLabel: ReactNode
  busy: boolean
  onSubmit: (fields: StandupFields) => void
  onCancel?: () => void
}>) {
  const [fields, setFields] = useState<StandupFields>(
    initial ?? { good: "", bad: "", next: "" }
  )
  // Backend requires at least one of good/bad/next — an all-blank stand-up
  // is an empty diary row and the POST would 422.
  const hasContent = FIELD_LABELS.some(({ key }) => fields[key].trim() !== "")

  return (
    <div className="space-y-4" data-testid="standup-form">
      <div className="grid gap-4 md:grid-cols-3">
        {FIELD_LABELS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label
              htmlFor={`standup-${key}`}
              className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
            >
              {label}
            </Label>
            <Textarea
              id={`standup-${key}`}
              value={fields[key]}
              maxLength={FIELD_MAX}
              onChange={(e) =>
                setFields((f) => ({ ...f, [key]: e.target.value }))
              }
              className={fieldClass}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => hasContent && onSubmit(fields)}
          disabled={busy || !hasContent}
          className="h-10 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          <Check className="mr-1.5 h-4 w-4" />
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-10 rounded-2xl px-4 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function StandupCard({ entry }: Readonly<{ entry: DiaryEntry }>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {FIELD_LABELS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90">
            {entry[key] ?? "—"}
          </p>
        </div>
      ))}
    </div>
  )
}

function FreeformEditor({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: string
  submitLabel: ReactNode
  busy: boolean
  onSubmit: (freeform: string) => void
  onCancel?: () => void
}>) {
  const [text, setText] = useState(initial ?? "")
  const hasContent = text.trim() !== ""
  return (
    <div className="space-y-2" data-testid="freeform-form">
      <Textarea
        aria-label={
          initial === undefined ? "New diary entry" : "Edit diary entry"
        }
        value={text}
        maxLength={FIELD_MAX}
        placeholder="What else happened today?"
        onChange={(e) => setText(e.target.value)}
        className={fieldClass}
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={() => hasContent && onSubmit(text)}
          disabled={busy || !hasContent}
          className="h-9 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-9 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function RowActions({
  onEdit,
  onDelete,
}: Readonly<{ onEdit: () => void; onDelete: () => void }>) {
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label="Edit entry"
        onClick={onEdit}
        className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        aria-label="Delete entry"
        onClick={onDelete}
        className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function DiaryDayPanel({
  entries,
  readOnly = false,
  writesDisabled = false,
  disabledReason = null,
  busy = false,
  onCreateStandup,
  onCreateFreeform,
  onUpdateEntry,
  onDeleteEntry,
}: DiaryDayPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DiaryEntry | null>(null)

  // The backend enforces one stand-up per (user, UTC day) with a partial
  // unique index; the UI mirrors it — the create form only renders while
  // the day holds no stand-up row.
  const standup = entries.find((e) => e.kind === "standup")
  const freeforms = entries.filter((e) => e.kind === "freeform")
  const canWrite = !readOnly && !writesDisabled

  const handleDelete = async () => {
    const target = pendingDelete
    setPendingDelete(null)
    if (target !== null) onDeleteEntry?.(target.id)
  }

  // Close the editor only once the PATCH lands — a failed save keeps the
  // draft open for retry (the mutation hook already toasted the error).
  const submitUpdate = (id: number, patch: DiaryEntryPatch) => {
    void Promise.resolve(onUpdateEntry?.(id, patch))
      .then(() => setEditingId(null))
      .catch(() => {})
  }

  return (
    <div className="space-y-6">
      {disabledReason !== null && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          {disabledReason}
        </p>
      )}

      <section className={cardClass} aria-labelledby="diary-standup-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3
            id="diary-standup-heading"
            className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
          >
            Stand-up
          </h3>
          {standup !== undefined && canWrite && editingId !== standup.id && (
            <RowActions
              onEdit={() => setEditingId(standup.id)}
              onDelete={() => setPendingDelete(standup)}
            />
          )}
        </div>

        {standup === undefined ? (
          canWrite ? (
            <StandupForm
              submitLabel="Save stand-up"
              busy={busy}
              onSubmit={(fields) => onCreateStandup?.(fields)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No stand-up for this day.
            </p>
          )
        ) : editingId === standup.id && canWrite ? (
          <StandupForm
            initial={{
              good: standup.good ?? "",
              bad: standup.bad ?? "",
              next: standup.next ?? "",
            }}
            submitLabel="Save stand-up"
            busy={busy}
            onSubmit={(fields) => submitUpdate(standup.id, fields)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <StandupCard entry={standup} />
        )}
      </section>

      <section className={cardClass} aria-labelledby="diary-entries-heading">
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="diary-entries-heading"
            className="text-[10px] font-black tracking-[0.3em] text-accent uppercase"
          >
            Entries
          </h3>
          {freeforms.length > 0 && (
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {freeforms.length}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {freeforms.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/5 bg-white/5 p-4"
            >
              {editingId === entry.id && canWrite ? (
                <FreeformEditor
                  initial={entry.freeform ?? ""}
                  submitLabel="Save"
                  busy={busy}
                  onSubmit={(freeform) => submitUpdate(entry.id, { freeform })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-wrap text-foreground/90">
                      {entry.freeform}
                    </p>
                    <p className="mt-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      {entryTimeLabel(entry)}
                    </p>
                  </div>
                  {canWrite && editingId === null && (
                    <RowActions
                      onEdit={() => setEditingId(entry.id)}
                      onDelete={() => setPendingDelete(entry)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {freeforms.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {canWrite
                ? "Nothing logged yet — add as many entries as you like."
                : "No entries for this day."}
            </p>
          )}

          {canWrite && (
            // Keyed on the entry count: a successful add remounts the editor
            // empty, while a failed add keeps the draft for retry.
            <FreeformEditor
              key={`add-${freeforms.length}`}
              submitLabel={
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add entry
                </span>
              }
              busy={busy}
              onSubmit={(freeform) => onCreateFreeform?.(freeform)}
            />
          )}
        </div>
      </section>

      <ConfirmationModal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete entry?"
        description={
          pendingDelete?.kind === "standup"
            ? "This removes the day's stand-up — you can write a new one after."
            : "This diary entry will be permanently removed."
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={busy}
      />
    </div>
  )
}
