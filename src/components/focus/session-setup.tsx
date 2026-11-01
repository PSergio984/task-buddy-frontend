import { Play, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTasks } from "@/hooks/useTasks"
import { useTags } from "@/hooks/useTags"
import { cn } from "@/lib/utils"
import {
  FOCUS_PRESETS,
  describePlan,
  type FocusPresetId,
  type FocusSettings,
} from "@/lib/focus-session"
import type { SessionMode } from "@/lib/api"

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
  const set = <K extends keyof FocusSettings>(
    key: K,
    value: FocusSettings[K]
  ) => onChange({ ...settings, [key]: value })

  return (
    <div className="w-full max-w-xl space-y-8">
      {/* Mode picker */}
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-widest text-primary uppercase">
          Mode
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={settings.mode === m.value}
              onClick={() => set("mode", m.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                settings.mode === m.value
                  ? "border-primary/30 bg-primary/10"
                  : "border-white/5 bg-white/5 hover:bg-white/10"
              )}
            >
              <span className="block text-sm font-black tracking-tight text-foreground">
                {m.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {m.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

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
          disabled={busy}
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

      <p className="text-center text-xs font-bold tracking-wide text-muted-foreground">
        {describePlan(settings)}
      </p>
    </div>
  )
}
