import { Play, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTasks } from "@/hooks/useTasks"
import { useTags } from "@/hooks/useTags"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useActivityStats } from "@/hooks/useGameCharacter"
import { cn } from "@/lib/utils"
import {
  FOCUS_PRESETS,
  describePlan,
  formatClock,
  type FocusPresetId,
  type FocusSettings,
} from "@/lib/focus-session"
import type { SessionMode, SpeedrunKind } from "@/lib/api"

interface SessionSetupProps {
  readonly settings: FocusSettings
  readonly onChange: (settings: FocusSettings) => void
  readonly onStart: () => void
  readonly onOpenSettings: () => void
  readonly busy: boolean
}

const MODES: { value: SessionMode; label: string; hint: string }[] = [
  { value: "timer", label: "Timer", hint: "Scored sprints with breaks" },
  { value: "stopwatch", label: "Stopwatch", hint: "Open-ended · milestone XP" },
  { value: "speedrun", label: "Speedrun", hint: "Beat the clock or a record" },
]

const SPEEDRUN_KINDS: { value: SpeedrunKind; label: string; hint: string }[] = [
  {
    value: "time_boxed",
    label: "Time-boxed",
    hint: "Done before the clock hits zero",
  },
  {
    value: "beat_best",
    label: "Beat your best",
    hint: "Open clock vs your record",
  },
]

const PRESETS: { id: FocusPresetId; hint: string }[] = [
  { id: "classic", hint: "25 / 5 / 15 min" },
  { id: "quick", hint: "15 / 3 / 10 min" },
  { id: "deep", hint: "50 / 10 / 30 min" },
  { id: "custom", hint: "Your durations" },
]

export function SessionSetup({
  settings,
  onChange,
  onStart,
  onOpenSettings,
  busy,
}: SessionSetupProps) {
  const { data: tasks = [] } = useTasks()
  const { data: tags = [] } = useTags()
  // Speedruns are server-only (#69): the record table and the win/miss
  // verdict live there, so the card can't work offline. The PB table only
  // feeds the beat-best sub-panel (record lookup + label datalist) — don't
  // fetch it for time-boxed, timer or stopwatch.
  const isOnline = useIsOnline()
  const {
    data: activityStats,
    isPending: statsPending,
    isError: statsError,
  } = useActivityStats(
    settings.mode === "speedrun" && settings.speedrunKind === "beat_best"
  )
  const set = <K extends keyof FocusSettings>(
    key: K,
    value: FocusSettings[K]
  ) => onChange({ ...settings, [key]: value })

  const speedrunLabel = settings.activityLabel.trim()
  const pbs = activityStats?.speedrun_pbs ?? []
  const recordToBeat = pbs.find((pb) => pb.activity_label === speedrunLabel)
  // The label is the exact-match PB key — offer the known labels so a typo
  // can't silently start a new board.
  const pbLabels = [...new Set(pbs.map((pb) => pb.activity_label))]
  const speedrunReady =
    settings.speedrunKind === "time_boxed"
      ? Number.isFinite(settings.speedrunBudgetMin) &&
        settings.speedrunBudgetMin >= 1
      : speedrunLabel !== ""
  const startDisabled =
    busy || (settings.mode === "speedrun" && (!isOnline || !speedrunReady))

  return (
    <div className="w-full max-w-xl space-y-8">
      {/* Mode picker */}
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-widest text-primary uppercase">
          Mode
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const offline = m.value === "speedrun" && !isOnline
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={settings.mode === m.value}
                disabled={offline}
                onClick={() => set("mode", m.value)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  // 3 cards in a 2-col grid — the odd one out spans the row.
                  m.value === "speedrun" && "col-span-2 sm:col-span-1",
                  settings.mode === m.value
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/5 bg-white/5 hover:bg-white/10",
                  offline && "cursor-not-allowed opacity-50 hover:bg-white/5"
                )}
              >
                <span className="block text-sm font-black tracking-tight text-foreground">
                  {m.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {offline
                    ? "Needs a connection — records live on the server"
                    : m.hint}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Speedrun sub-panel */}
      {settings.mode === "speedrun" && (
        <div className="space-y-3">
          <p className="text-[10px] font-black tracking-widest text-primary uppercase">
            Speedrun
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SPEEDRUN_KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                aria-pressed={settings.speedrunKind === k.value}
                onClick={() => set("speedrunKind", k.value)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  settings.speedrunKind === k.value
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                )}
              >
                <span className="block text-sm font-black tracking-tight text-foreground">
                  {k.label}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {k.hint}
                </span>
              </button>
            ))}
          </div>
          {settings.speedrunKind === "time_boxed" ? (
            <div className="space-y-1.5">
              <p
                id="speedrun-budget-label"
                className="text-[10px] font-black tracking-widest text-primary uppercase"
              >
                Budget <span className="text-muted-foreground">(minutes)</span>
              </p>
              <Input
                aria-labelledby="speedrun-budget-label"
                type="number"
                min={1}
                max={600}
                value={
                  Number.isFinite(settings.speedrunBudgetMin)
                    ? settings.speedrunBudgetMin
                    : ""
                }
                onChange={(e) =>
                  set("speedrunBudgetMin", e.target.valueAsNumber)
                }
                onBlur={(e) => {
                  // NumberField precedent: HTML min/max don't enforce — a
                  // blurred out-of-range value writes back clamped; an
                  // empty/NaN blur keeps the last value ("" field).
                  const v = e.target.valueAsNumber
                  if (Number.isFinite(v)) {
                    set(
                      "speedrunBudgetMin",
                      Math.min(600, Math.max(1, Math.round(v)))
                    )
                  }
                }}
                className="h-11 rounded-xl bg-white/5"
              />
              <p className="text-xs text-muted-foreground">
                Done before zero wins — running out costs HP.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p
                id="speedrun-label-label"
                className="text-[10px] font-black tracking-widest text-primary uppercase"
              >
                Activity label
              </p>
              <Input
                aria-labelledby="speedrun-label-label"
                type="text"
                list="speedrun-label-options"
                value={settings.activityLabel}
                onChange={(e) => set("activityLabel", e.target.value)}
                maxLength={200}
                placeholder='e.g. "Deep work"'
                className="h-11 rounded-xl bg-white/5"
              />
              <datalist id="speedrun-label-options">
                {pbLabels.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
              <p role="status" className="text-xs text-muted-foreground">
                {speedrunLabel === "" ? (
                  "Names the record this run attacks."
                ) : statsPending ? (
                  "Checking your record…"
                ) : statsError ? (
                  "Couldn't load your record — the run still counts."
                ) : recordToBeat !== undefined ? (
                  <>
                    Record to beat:{" "}
                    <span className="font-mono tabular-nums">
                      {formatClock(recordToBeat.best_seconds)}
                    </span>{" "}
                    · {recordToBeat.attempts}{" "}
                    {recordToBeat.attempts === 1 ? "attempt" : "attempts"}
                  </>
                ) : (
                  "First run sets the record."
                )}
              </p>
            </div>
          )}
          {!isOnline && (
            <p
              role="status"
              className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
            >
              You're offline — speedruns need a connection.
            </p>
          )}
        </div>
      )}

      {/* Preset picker (timer only) */}
      {settings.mode === "timer" && (
        <div className="space-y-3">
          <p className="text-[10px] font-black tracking-widest text-primary uppercase">
            Preset · focus / break / long break
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={settings.presetId === p.id}
                onClick={() => set("presetId", p.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  settings.presetId === p.id
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                )}
              >
                <span className="block text-sm font-black tracking-tight text-foreground">
                  {p.id === "custom" ? "Custom" : FOCUS_PRESETS[p.id].label}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {p.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional task / tag link */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p
            id="focus-task-label"
            className="text-[10px] font-black tracking-widest text-primary uppercase"
          >
            Task <span className="text-muted-foreground">(optional)</span>
          </p>
          <Select
            value={settings.taskId === null ? "none" : String(settings.taskId)}
            onValueChange={(v) =>
              set("taskId", v === "none" ? null : Number(v))
            }
          >
            <SelectTrigger
              aria-labelledby="focus-task-label"
              className="h-11 rounded-xl bg-white/5"
            >
              <SelectValue placeholder="Free focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Free focus</SelectItem>
              {tasks
                .filter((t) => !t.completed)
                .map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p
            id="focus-tag-label"
            className="text-[10px] font-black tracking-widest text-primary uppercase"
          >
            Tag <span className="text-muted-foreground">(optional)</span>
          </p>
          <Select
            value={settings.tagId === null ? "none" : String(settings.tagId)}
            onValueChange={(v) => set("tagId", v === "none" ? null : Number(v))}
          >
            <SelectTrigger
              aria-labelledby="focus-tag-label"
              className="h-11 rounded-xl bg-white/5"
            >
              <SelectValue placeholder="No tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No tag</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start + settings */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onStart}
          disabled={startDisabled}
          className="h-14 flex-1 gap-2 rounded-2xl bg-primary text-base font-black tracking-tight text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <Play className="h-5 w-5" />
          {busy ? "Starting…" : "Start session"}
        </Button>
        <Button
          variant="outline"
          onClick={onOpenSettings}
          aria-label="Session settings"
          className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      {/* A blank/invalid time-boxed budget parses to NaN — describePlan
          would clamp it to 1 and describe a plan the field doesn't hold,
          so the summary stays hidden until the value is real. */}
      {(settings.mode !== "speedrun" ||
        settings.speedrunKind !== "time_boxed" ||
        (Number.isFinite(settings.speedrunBudgetMin) &&
          settings.speedrunBudgetMin >= 1)) && (
        <p className="text-center text-xs font-bold tracking-wide text-muted-foreground">
          {describePlan(settings)}
        </p>
      )}
    </div>
  )
}
