import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SessionDifficulty } from "@/lib/api"
import type { FocusSettings } from "@/lib/focus-session"

interface SessionSettingsSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly settings: FocusSettings
  readonly onChange: (settings: FocusSettings) => void
}

const DIFFICULTIES: { value: SessionDifficulty; label: string }[] = [
  { value: "trivial", label: "Trivial (0.1×)" },
  { value: "easy", label: "Easy (1×)" },
  { value: "medium", label: "Medium (1.5×)" },
  { value: "hard", label: "Hard (2×)" },
]

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: Readonly<{
  id: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-bold">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="h-10 rounded-xl bg-white/5"
      />
    </div>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: Readonly<{
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}>) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </label>
  )
}

export function SessionSettingsSheet({
  open,
  onOpenChange,
  settings,
  onChange,
}: SessionSettingsSheetProps) {
  const set = <K extends keyof FocusSettings>(
    key: K,
    value: FocusSettings[K]
  ) => onChange({ ...settings, [key]: value })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-white/10 bg-background/95 px-6 pb-12 backdrop-blur-2xl sm:max-w-md"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase">
            Session settings
          </SheetTitle>
          <SheetDescription className="sr-only">
            Durations, cycles, auto-start and pause budget for the next focus
            session.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {settings.presetId === "custom" && settings.mode === "timer" && (
            <div className="space-y-3">
              <p className="text-[10px] font-black tracking-widest text-primary uppercase">
                Custom durations (minutes)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <NumberField
                  id="focus-custom-focus"
                  label="Focus"
                  min={1}
                  max={600}
                  value={settings.customFocus}
                  onChange={(v) => set("customFocus", v)}
                />
                <NumberField
                  id="focus-custom-break"
                  label="Break"
                  min={1}
                  max={600}
                  value={settings.customBreak}
                  onChange={(v) => set("customBreak", v)}
                />
                <NumberField
                  id="focus-custom-long"
                  label="Long break"
                  min={1}
                  max={600}
                  value={settings.customLongBreak}
                  onChange={(v) => set("customLongBreak", v)}
                />
              </div>
            </div>
          )}

          {settings.mode === "timer" && (
            <NumberField
              id="focus-cycles"
              label="Focus cycles per session"
              min={1}
              max={8}
              value={settings.cycles}
              onChange={(v) => set("cycles", v)}
            />
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-primary uppercase">
              Auto-start
            </p>
            <ToggleRow
              id="focus-auto-breaks"
              label="Auto-start breaks"
              hint="Breaks begin the moment a focus phase ends."
              checked={settings.autoBreaks}
              onChange={(v) => set("autoBreaks", v)}
            />
            <ToggleRow
              id="focus-auto-focus"
              label="Auto-start next focus"
              hint="Off: tap to begin each leg (5-min grace before the session ends)."
              checked={settings.autoFocus}
              onChange={(v) => set("autoFocus", v)}
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-primary uppercase">
              Pause budget (per phase)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="focus-pause-count"
                label="Pauses"
                min={0}
                max={20}
                value={settings.pauseCount}
                onChange={(v) => set("pauseCount", v)}
              />
              <NumberField
                id="focus-pause-seconds"
                label="Total seconds"
                min={60}
                max={3600}
                value={settings.pauseSeconds}
                onChange={(v) => set("pauseSeconds", v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="focus-difficulty"
              className="text-[10px] font-black tracking-widest text-primary uppercase"
            >
              Difficulty
            </Label>
            <Select
              value={settings.difficulty}
              onValueChange={(v) => set("difficulty", v as SessionDifficulty)}
            >
              <SelectTrigger
                id="focus-difficulty"
                className="h-10 rounded-xl bg-white/5"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scales XP/gold earned — and the HP lost if you abandon.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-primary uppercase">
              Experience
            </p>
            <ToggleRow
              id="focus-immersive"
              label="Immersive mode"
              hint="Enter the distraction-free view when the session starts."
              checked={settings.immersive}
              onChange={(v) => set("immersive", v)}
            />
            <ToggleRow
              id="focus-alerts"
              label="Phase-end alert sounds"
              hint="Distinct tones for work-end and break-end."
              checked={settings.alerts}
              onChange={(v) => set("alerts", v)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
