import { useState, type ReactNode } from "react"
import {
  Bell,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Timer,
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
import { ConfirmationModal } from "@/components/confirmation-modal"
import type {
  Habit,
  HabitClickDirection,
  HabitDirection,
  HabitInput,
  HabitPatch,
  SessionDifficulty,
} from "@/lib/api"
import { counterLabel, habitDrift, reminderLabel } from "@/lib/game-columns"
import { cn } from "@/lib/utils"

/** Mirrors the backend's field bound (HabitIn.title max_length). */
const TITLE_MAX = 200

const cardClass = "rounded-3xl border border-white/10 bg-white/5 p-5"
const fieldClass =
  "rounded-2xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"

interface HabitsColumnProps {
  readonly habits: Habit[] | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  /** Offline — clicks and edits are rejected server-side / unreachable. */
  readonly writesDisabled?: boolean
  /** Id of the habit whose click is in flight; its buttons stay disabled. */
  readonly clickingId?: number | null
  readonly busy?: boolean
  readonly onRetry: () => void
  /** May return a promise — the form closes only once it resolves. */
  readonly onCreate?: (input: HabitInput) => unknown
  readonly onUpdate?: (id: number, patch: HabitPatch) => unknown
  readonly onDelete?: (id: number) => void
  readonly onClick?: (id: number, direction: HabitClickDirection) => void
}

const DIRECTION_OPTIONS: ReadonlyArray<{
  value: HabitDirection
  label: string
}> = [
  { value: "both", label: "+ and −" },
  { value: "positive", label: "+ only" },
  { value: "negative", label: "− only" },
]

const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: SessionDifficulty
  label: string
}> = [
  { value: "trivial", label: "Trivial" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const DRIFT_STYLES = {
  fresh: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  steady: "border-white/10 bg-white/5 text-muted-foreground",
  farmed: "border-amber-400/30 bg-amber-400/10 text-amber-400",
} as const

function directionAllows(
  habit: Habit,
  direction: HabitClickDirection
): boolean {
  return habit.direction === "both" || habit.direction === direction
}

function HabitForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: Habit
  submitLabel: ReactNode
  busy: boolean
  onSubmit: (input: HabitInput) => void
  onCancel?: () => void
}>) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [direction, setDirection] = useState<HabitDirection>(
    initial?.direction ?? "both"
  )
  const [difficulty, setDifficulty] = useState<SessionDifficulty>(
    initial?.difficulty ?? "easy"
  )
  const [bindFocus, setBindFocus] = useState(initial?.bind_focus ?? false)
  // shortcut: the editor exposes one reminder slot — saving writes
  // reminder_times=[time] or [] and drops any extra stored times.
  const [reminder, setReminder] = useState(initial?.reminder_times[0] ?? "")
  const hasTitle = title.trim() !== ""
  // A negative-only habit accepts no +click, so binding it is a stored no-op
  // (the backend skips it) — the UI doesn't offer the flag there.
  const bindable = direction !== "negative"

  return (
    <div className="space-y-4" data-testid="habit-form">
      <div className="space-y-1.5">
        <Label
          htmlFor="habit-title"
          className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
        >
          Habit
        </Label>
        <Input
          id="habit-title"
          value={title}
          maxLength={TITLE_MAX}
          placeholder="e.g. Read 20 pages"
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="habit-direction"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Direction
          </Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as HabitDirection)}
          >
            <SelectTrigger id="habit-direction" className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="habit-difficulty"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Difficulty
          </Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as SessionDifficulty)}
          >
            <SelectTrigger id="habit-difficulty" className={fieldClass}>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="habit-reminder"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Reminder
          </Label>
          <Input
            id="habit-reminder"
            type="time"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="habit-notes"
            className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
          >
            Notes
          </Label>
          <Input
            id="habit-notes"
            value={notes}
            placeholder="Optional"
            onChange={(e) => setNotes(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="habit-bind-focus"
          checked={bindFocus && bindable}
          disabled={!bindable}
          onCheckedChange={(c) => setBindFocus(c === true)}
        />
        <Label
          htmlFor="habit-bind-focus"
          className="text-xs font-bold text-foreground/80"
        >
          Auto +click on each completed focus phase
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() =>
            hasTitle &&
            onSubmit({
              title: title.trim(),
              notes: notes.trim() === "" ? null : notes.trim(),
              direction,
              difficulty,
              bind_focus: bindFocus && bindable,
              reminder_times: reminder === "" ? [] : [reminder],
            })
          }
          disabled={busy || !hasTitle}
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

function ClickButton({
  habit,
  direction,
  disabled,
  onClick,
}: Readonly<{
  habit: Habit
  direction: HabitClickDirection
  disabled: boolean
  onClick: () => void
}>) {
  const positive = direction === "positive"
  return (
    <button
      aria-label={`${positive ? "+" : "−"}click ${habit.title}`}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-40",
        positive
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
          : "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
      )}
    >
      {positive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </button>
  )
}

export function HabitsColumn({
  habits,
  isPending,
  isError,
  isOnline,
  writesDisabled = false,
  clickingId = null,
  busy = false,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  onClick,
}: HabitsColumnProps) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null)
  const canWrite = !writesDisabled

  const handleDelete = async () => {
    const target = pendingDelete
    setPendingDelete(null)
    if (target !== null) onDelete?.(target.id)
  }

  // Close create/edit only once the write lands — a failed save keeps the
  // draft open for retry (the mutation hook already toasted the error).
  const submitCreate = (input: HabitInput) => {
    void Promise.resolve(onCreate?.(input))
      .then(() => setCreating(false))
      .catch(() => {})
  }
  const submitUpdate = (id: number, patch: HabitPatch) => {
    void Promise.resolve(onUpdate?.(id, patch))
      .then(() => setEditingId(null))
      .catch(() => {})
  }

  return (
    <section className={cardClass} aria-labelledby="habits-column-heading">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2
          id="habits-column-heading"
          className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
        >
          Habits
        </h2>
        <div className="flex items-center gap-3">
          {habits !== undefined && habits.length > 0 && (
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {habits.length}
            </span>
          )}
          {canWrite && (
            <button
              aria-label="New habit"
              onClick={() => setCreating((c) => !c)}
              className="rounded-lg p-1.5 text-primary transition-all hover:bg-white/10"
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
              ? "Couldn't load your habits."
              : "You're offline and your habits aren't in the local cache."}
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
          {(habits ?? []).map((habit) => (
            <div
              key={habit.id}
              className="rounded-2xl border border-white/5 bg-white/5 p-3"
            >
              {editingId === habit.id && canWrite ? (
                <HabitForm
                  initial={habit}
                  submitLabel="Save habit"
                  busy={busy}
                  onSubmit={(input) =>
                    submitUpdate(habit.id, {
                      title: input.title,
                      notes: input.notes,
                      direction: input.direction,
                      difficulty: input.difficulty,
                      reminder_times: input.reminder_times,
                      bind_focus: input.bind_focus,
                    })
                  }
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 items-center gap-1">
                    {directionAllows(habit, "positive") && (
                      <ClickButton
                        habit={habit}
                        direction="positive"
                        disabled={!canWrite || clickingId === habit.id}
                        onClick={() => onClick?.(habit.id, "positive")}
                      />
                    )}
                    {directionAllows(habit, "negative") && (
                      <ClickButton
                        habit={habit}
                        direction="negative"
                        disabled={!canWrite || clickingId === habit.id}
                        onClick={() => onClick?.(habit.id, "negative")}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground/90">
                      {habit.title}
                    </p>
                    {habit.notes !== null && (
                      <p className="truncate text-xs text-muted-foreground">
                        {habit.notes}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase",
                      DRIFT_STYLES[habitDrift(habit.value)]
                    )}
                  >
                    {habitDrift(habit.value)}
                  </Badge>
                  {habit.bind_focus && habit.direction !== "negative" && (
                    <span
                      title="Auto +click per completed focus phase"
                      className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-widest text-violet-400 uppercase"
                    >
                      <Timer className="h-3.5 w-3.5" />
                      auto
                    </span>
                  )}
                  {habit.reminder_times.length > 0 && (
                    <span
                      title={`Reminders: ${habit.reminder_times.join(", ")}`}
                      className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-widest text-sky-400 uppercase"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      {reminderLabel(habit.reminder_times)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-8 shrink-0 text-right text-xs font-black",
                      habit.counter > 0
                        ? "text-emerald-400"
                        : habit.counter < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    )}
                  >
                    {counterLabel(habit.counter)}
                  </span>
                  {canWrite && editingId === null && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        aria-label={`Edit ${habit.title}`}
                        onClick={() => setEditingId(habit.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label={`Delete ${habit.title}`}
                        onClick={() => setPendingDelete(habit)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {(habits ?? []).length === 0 && !creating && (
            <p className="text-sm text-muted-foreground">
              {canWrite
                ? "No habits yet — tap + to track a good or bad pattern."
                : "No habits yet."}
            </p>
          )}

          {canWrite && creating && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <HabitForm
                submitLabel={
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add habit
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
        title="Delete habit?"
        description={
          pendingDelete !== null
            ? `"${pendingDelete.title}" and its counter history will be removed.`
            : ""
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={busy}
      />
    </section>
  )
}
