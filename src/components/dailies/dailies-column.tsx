import { useState, type ReactNode } from "react"
import {
  Bell,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmationModal } from "@/components/confirmation-modal"
import type {
  Daily,
  DailyCheckInput,
  DailyInput,
  DailyPatch,
  Recurrence,
  SessionDifficulty,
} from "@/lib/api"
import {
  itemLines,
  itemsProgress,
  parseItemLines,
  recurrenceLabel,
  reminderLabel,
} from "@/lib/game-columns"
import { cn } from "@/lib/utils"

/** Mirrors the backend's field bound (DailyIn.title max_length). */
const TITLE_MAX = 200

const cardClass = "rounded-3xl border border-white/10 bg-white/5 p-5"
const fieldClass =
  "rounded-2xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"

interface DailiesColumnProps {
  readonly dailies: Daily[] | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  /** Offline — checks and edits can't reach the server. */
  readonly writesDisabled?: boolean
  /** Id of the daily whose check is in flight; its boxes stay disabled. */
  readonly checkingId?: number | null
  readonly busy?: boolean
  readonly onRetry: () => void
  /** May return a promise — the form closes only once it resolves. */
  readonly onCreate?: (input: DailyInput) => unknown
  readonly onUpdate?: (id: number, patch: DailyPatch) => unknown
  readonly onDelete?: (id: number) => void
  readonly onCheck?: (id: number, input: DailyCheckInput) => void
}

const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: SessionDifficulty
  label: string
}> = [
  { value: "trivial", label: "Trivial" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const RECURRENCE_OPTIONS: ReadonlyArray<{
  value: Recurrence["kind"]
  label: string
}> = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Specific weekdays" },
  { value: "every_n_days", label: "Every N days" },
  { value: "times_per_week", label: "Times per week" },
]

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type RecurrenceKind = Recurrence["kind"]

function DailyForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: Daily
  submitLabel: ReactNode
  busy: boolean
  onSubmit: (input: DailyInput) => void
  onCancel?: () => void
}>) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [difficulty, setDifficulty] = useState<SessionDifficulty>(
    initial?.difficulty ?? "easy"
  )
  const [kind, setKind] = useState<RecurrenceKind>(
    initial?.recurrence?.kind ?? "daily"
  )
  const [days, setDays] = useState<number[]>(
    initial?.recurrence?.kind === "weekdays"
      ? initial.recurrence.days
      : [0, 1, 2, 3, 4]
  )
  const [interval, setIntervalDays] = useState(
    initial?.recurrence?.kind === "every_n_days"
      ? initial.recurrence.interval
      : 2
  )
  const [count, setCount] = useState(
    initial?.recurrence?.kind === "times_per_week"
      ? initial.recurrence.count
      : 3
  )
  const [itemsText, setItemsText] = useState(
    initial !== undefined ? itemLines(initial.items) : ""
  )
  // shortcut: one reminder slot, same as the habit editor.
  const [reminder, setReminder] = useState(initial?.reminder_times[0] ?? "")
  const [active, setActive] = useState(initial?.active ?? true)
  const hasTitle = title.trim() !== ""
  const recurrenceValid = kind !== "weekdays" || days.length > 0
  const canSubmit = hasTitle && recurrenceValid

  const toggleDay = (day: number) =>
    setDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day]
    )

  const recurrence: Recurrence =
    kind === "weekdays"
      ? { kind, days: [...days].sort((a, b) => a - b) }
      : kind === "every_n_days"
        ? {
            kind,
            interval,
            // The backend re-anchors an anchorless update to the PATCH day —
            // send the stored anchor back so an edit can't silently shift
            // the schedule phase.
            anchor:
              initial?.recurrence?.kind === "every_n_days"
                ? initial.recurrence.anchor
                : undefined,
          }
        : kind === "times_per_week"
          ? { kind, count }
          : { kind: "daily" }

  return (
    <div className="space-y-4" data-testid="daily-form">
      <div className="space-y-1.5">
        <Label
          htmlFor="daily-title"
          className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
        >
          Daily
        </Label>
        <Input
          id="daily-title"
          value={title}
          maxLength={TITLE_MAX}
          placeholder="e.g. Morning workout"
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-recurrence"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Repeats
          </Label>
          <Select
            value={kind}
            onValueChange={(v) => setKind(v as RecurrenceKind)}
          >
            <SelectTrigger id="daily-recurrence" className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-difficulty"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Difficulty
          </Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as SessionDifficulty)}
          >
            <SelectTrigger id="daily-difficulty" className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {kind === "weekdays" && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            On days
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_NAMES.map((name, day) => (
              <button
                key={name}
                type="button"
                aria-pressed={days.includes(day)}
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all",
                  days.includes(day)
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
      {kind === "every_n_days" && (
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-interval"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Every N days
          </Label>
          <Input
            id="daily-interval"
            type="number"
            min={1}
            max={365}
            value={interval}
            onChange={(e) =>
              setIntervalDays(
                Math.max(1, Math.min(365, Number(e.target.value) || 1))
              )
            }
            className={fieldClass}
          />
        </div>
      )}
      {kind === "times_per_week" && (
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-count"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Completions per week
          </Label>
          <Input
            id="daily-count"
            type="number"
            min={1}
            max={7}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(7, Number(e.target.value) || 1)))
            }
            className={fieldClass}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="daily-items"
          className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
        >
          Checklist — one item per line
        </Label>
        <Textarea
          id="daily-items"
          value={itemsText}
          placeholder={"e.g.\nWarm up\n30-min session"}
          onChange={(e) => setItemsText(e.target.value)}
          className={cn(fieldClass, "min-h-[64px]")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-reminder"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Reminder
          </Label>
          <Input
            id="daily-reminder"
            type="time"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="daily-notes"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Notes
          </Label>
          <Input
            id="daily-notes"
            value={notes}
            placeholder="Optional"
            onChange={(e) => setNotes(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      {initial !== undefined && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="daily-active"
            checked={active}
            onCheckedChange={(c) => setActive(c === true)}
          />
          <Label
            htmlFor="daily-active"
            className="text-xs font-bold text-foreground/80"
          >
            Active (unchecked days are scored as misses)
          </Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          onClick={() =>
            canSubmit &&
            onSubmit({
              title: title.trim(),
              notes: notes.trim() === "" ? null : notes.trim(),
              difficulty,
              recurrence,
              items: parseItemLines(itemsText),
              reminder_times: reminder === "" ? [] : [reminder],
              ...(initial !== undefined ? { active } : {}),
            })
          }
          disabled={busy || !canSubmit}
          className="h-10 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
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

function DailyRow({
  daily,
  canWrite,
  checking,
  onCheck,
  onEdit,
  onDelete,
  showActions,
}: Readonly<{
  daily: Daily
  canWrite: boolean
  checking: boolean
  onCheck: (input: DailyCheckInput) => void
  onEdit: () => void
  onDelete: () => void
  showActions: boolean
}>) {
  const progress = itemsProgress(daily)
  const checkDisabled = !canWrite || !daily.active || checking
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-white/5 p-3",
        !daily.active && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          aria-label={`Check ${daily.title}`}
          checked={daily.completed_today}
          disabled={checkDisabled}
          onCheckedChange={(c) => onCheck({ done: c === true })}
          className="h-5 w-5 rounded-md"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-bold",
              daily.completed_today
                ? "text-muted-foreground line-through"
                : "text-foreground/90"
            )}
          >
            {daily.title}
          </p>
          {daily.notes !== null && (
            <p className="truncate text-xs text-muted-foreground">
              {daily.notes}
            </p>
          )}
        </div>
        {!daily.active && (
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Paused
          </Badge>
        )}
        {daily.streak > 0 && (
          <span
            title={`${daily.streak}-day streak`}
            className="flex shrink-0 items-center gap-1 text-[10px] font-black tracking-widest text-amber-400 uppercase"
          >
            <Flame className="h-3.5 w-3.5" />
            {daily.streak}
          </span>
        )}
        {daily.reminder_times.length > 0 && (
          <span
            title={`Reminders: ${daily.reminder_times.join(", ")}`}
            className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-widest text-sky-400 uppercase"
          >
            <Bell className="h-3.5 w-3.5" />
            {reminderLabel(daily.reminder_times)}
          </span>
        )}
        {progress.total > 0 && (
          <span className="shrink-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {progress.done}/{progress.total} done
          </span>
        )}
        <span className="shrink-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {recurrenceLabel(daily.recurrence)}
        </span>
        {showActions && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label={`Edit ${daily.title}`}
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label={`Delete ${daily.title}`}
              onClick={onDelete}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {daily.items.length > 0 && (
        <ul className="mt-2 space-y-1 pl-8">
          {daily.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5">
              <Checkbox
                aria-label={`Check ${item.title}`}
                checked={item.done_today}
                // Once the day is complete, a still-open item can't check
                // (server: already_checked) — only un-checking stays live.
                disabled={
                  checkDisabled || (daily.completed_today && !item.done_today)
                }
                onCheckedChange={(c) =>
                  onCheck({ daily_item_id: item.id, done: c === true })
                }
                className="h-4 w-4 rounded"
              />
              <span
                className={cn(
                  "truncate text-xs",
                  item.done_today
                    ? "text-muted-foreground line-through"
                    : "text-foreground/80"
                )}
              >
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DailiesColumn({
  dailies,
  isPending,
  isError,
  isOnline,
  writesDisabled = false,
  checkingId = null,
  busy = false,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  onCheck,
}: DailiesColumnProps) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Daily | null>(null)
  const canWrite = !writesDisabled

  const handleDelete = async () => {
    const target = pendingDelete
    setPendingDelete(null)
    if (target !== null) onDelete?.(target.id)
  }

  const submitCreate = (input: DailyInput) => {
    void Promise.resolve(onCreate?.(input))
      .then(() => setCreating(false))
      .catch(() => {})
  }
  const submitUpdate = (id: number, patch: DailyPatch) => {
    void Promise.resolve(onUpdate?.(id, patch))
      .then(() => setEditingId(null))
      .catch(() => {})
  }

  return (
    <section className={cardClass} aria-labelledby="dailies-column-heading">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2
          id="dailies-column-heading"
          className="text-[10px] font-black tracking-[0.3em] text-accent uppercase"
        >
          Dailies
        </h2>
        <div className="flex items-center gap-3">
          {dailies !== undefined && dailies.length > 0 && (
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {dailies.length}
            </span>
          )}
          {canWrite && (
            <button
              aria-label="New daily"
              onClick={() => setCreating((c) => !c)}
              className="rounded-lg p-1.5 text-accent transition-all hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? "Couldn't load your dailies."
              : "You're offline and your dailies aren't in the local cache."}
          </p>
          <Button
            variant="outline"
            onClick={onRetry}
            className="h-9 gap-2 rounded-2xl border-white/15 px-4 text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(dailies ?? []).map((daily) => (
            <div key={daily.id}>
              {editingId === daily.id && canWrite ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <DailyForm
                    initial={daily}
                    submitLabel="Save daily"
                    busy={busy}
                    onSubmit={(input) =>
                      submitUpdate(daily.id, {
                        title: input.title,
                        notes: input.notes,
                        difficulty: input.difficulty,
                        recurrence: input.recurrence,
                        items: input.items,
                        reminder_times: input.reminder_times,
                        active: input.active,
                      })
                    }
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <DailyRow
                  daily={daily}
                  canWrite={canWrite}
                  checking={checkingId === daily.id}
                  onCheck={(input) => onCheck?.(daily.id, input)}
                  onEdit={() => setEditingId(daily.id)}
                  onDelete={() => setPendingDelete(daily)}
                  showActions={canWrite && editingId === null}
                />
              )}
            </div>
          ))}

          {(dailies ?? []).length === 0 && !creating && (
            <p className="text-sm text-muted-foreground">
              {canWrite
                ? "No dailies yet — tap + to build a recurring routine."
                : "No dailies yet."}
            </p>
          )}

          <p className="text-xs text-muted-foreground/70">
            Unchecked scheduled days cost HP after the ~3am UTC grace — one miss
            per 7 scheduled days is absorbed.
          </p>

          {canWrite && creating && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <DailyForm
                submitLabel={
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add daily
                  </span>
                }
                busy={busy}
                onSubmit={submitCreate}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete daily?"
        description={
          pendingDelete !== null
            ? `"${pendingDelete.title}" and its checklist will be removed — its streak is lost.`
            : ""
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={busy}
      />
    </section>
  )
}
