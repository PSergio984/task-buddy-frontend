import { Bell, Moon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsOnline } from "@/hooks/useIsOnline"
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from "@/hooks/useNotificationPrefs"
import type {
  GameNotificationKind,
  NotificationChannelPrefs,
  NotificationPrefs,
} from "@/lib/api"

const CHANNELS = [
  { key: "in_app", label: "In-app" },
  { key: "push", label: "Push" },
  { key: "email", label: "Email" },
] as const satisfies ReadonlyArray<{
  key: keyof NotificationChannelPrefs
  label: string
}>

const KIND_GROUPS: ReadonlyArray<{
  label: string
  kinds: ReadonlyArray<{ kind: GameNotificationKind; label: string }>
}> = [
  {
    label: "Reminders",
    kinds: [
      { kind: "habit_reminder", label: "Habit reminder" },
      { kind: "daily_reminder", label: "Daily reminder" },
    ],
  },
  {
    label: "Warnings",
    kinds: [
      { kind: "streak_risk", label: "Streak at risk" },
      { kind: "low_hp", label: "Low HP" },
      { kind: "daily_missed", label: "Daily missed" },
    ],
  },
  {
    label: "Alerts",
    kinds: [
      { kind: "death", label: "Death" },
      { kind: "phase_end", label: "Phase end" },
    ],
  },
  {
    label: "Celebrations",
    kinds: [
      { kind: "level_up", label: "Level up" },
      { kind: "achievement", label: "Achievement" },
      { kind: "record", label: "New record" },
    ],
  },
]

/** Rendered for kinds the server hasn't stored yet — email stays opt-in. */
const DEFAULT_CHANNEL_PREFS: NotificationChannelPrefs = {
  in_app: true,
  push: true,
  email: false,
}

const DEFAULT_QUIET_START = "22:00"
const DEFAULT_QUIET_END = "08:00"

function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

function timeZoneOptions(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      const zones = Intl.supportedValuesOf("timeZone")
      if (zones.length > 0) return zones
    }
  } catch {
    // Fall through to the local zone only.
  }
  return [localTimeZone()]
}

const fieldClass =
  "rounded-2xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"

/**
 * Kind x channel matrix plus the global quiet-hours window — the web half of
 * the notification prefs contract (#68). Every edit PUTs the whole object;
 * writes stay online-only like the rest of the game surfaces.
 */
export function NotificationPrefsCard() {
  const isOnline = useIsOnline()
  const prefsQuery = useNotificationPrefs()
  const update = useUpdateNotificationPrefs()
  const writesDisabled = !isOnline

  const quietHours = prefsQuery.data?.quiet_hours
  const effectivePrefs: NotificationPrefs = {
    prefs: prefsQuery.data?.prefs ?? {},
    quiet_hours: {
      start: quietHours?.start || DEFAULT_QUIET_START,
      end: quietHours?.end || DEFAULT_QUIET_END,
      timezone: quietHours?.timezone || localTimeZone(),
    },
  }

  const channelPrefs = (kind: GameNotificationKind): NotificationChannelPrefs =>
    effectivePrefs.prefs[kind] ?? DEFAULT_CHANNEL_PREFS

  const toggleChannel = (
    kind: GameNotificationKind,
    channel: keyof NotificationChannelPrefs
  ) => {
    const current = channelPrefs(kind)
    update.mutate({
      ...effectivePrefs,
      prefs: {
        ...effectivePrefs.prefs,
        [kind]: { ...current, [channel]: !current[channel] },
      },
    })
  }

  const setQuietHours = (patch: Partial<NotificationPrefs["quiet_hours"]>) => {
    update.mutate({
      ...effectivePrefs,
      quiet_hours: { ...effectivePrefs.quiet_hours, ...patch },
    })
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Choose which alerts reach you, and where.
          </p>
        </div>
      </div>

      {writesDisabled && (
        <p
          role="status"
          className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          You're offline — notification preferences can't be changed.
        </p>
      )}

      {prefsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">
          Loading notification preferences…
        </p>
      ) : prefsQuery.isError ? (
        <div className="flex items-center gap-4">
          <p className="text-sm text-destructive">
            Couldn't load notification preferences.
          </p>
          <Button
            variant="ghost"
            onClick={() => void prefsQuery.refetch()}
            className="rounded-xl"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="ml-1 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Alert channels</Label>
            </div>

            <div>
              <div className="grid grid-cols-[1fr_repeat(3,3rem)] items-center px-2 pb-1">
                <span />
                {CHANNELS.map((channel) => (
                  <span
                    key={channel.key}
                    className="text-center text-[10px] font-black tracking-wider text-muted-foreground/60 uppercase"
                  >
                    {channel.label}
                  </span>
                ))}
              </div>
              {KIND_GROUPS.map((group) => (
                <div key={group.label} className="mt-3 first:mt-0">
                  <p className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground/40 uppercase">
                    {group.label}
                  </p>
                  {group.kinds.map(({ kind, label }) => (
                    <div
                      key={kind}
                      className="grid grid-cols-[1fr_repeat(3,3rem)] items-center rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                    >
                      <span className="text-sm font-semibold">{label}</span>
                      {CHANNELS.map((channel) => (
                        <span key={channel.key} className="flex justify-center">
                          <Checkbox
                            aria-label={`${label} ${channel.label}`}
                            checked={channelPrefs(kind)[channel.key]}
                            disabled={writesDisabled}
                            onCheckedChange={() =>
                              toggleChannel(kind, channel.key)
                            }
                            className="h-5 w-5 rounded-lg border-2"
                          />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="space-y-4">
            <div className="ml-1 flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Quiet Hours</Label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="quiet-hours-start"
                  className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                >
                  From
                </Label>
                <Input
                  id="quiet-hours-start"
                  type="time"
                  value={effectivePrefs.quiet_hours.start}
                  disabled={writesDisabled}
                  onChange={(e) => {
                    if (e.target.value) setQuietHours({ start: e.target.value })
                  }}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="quiet-hours-end"
                  className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                >
                  Until
                </Label>
                <Input
                  id="quiet-hours-end"
                  type="time"
                  value={effectivePrefs.quiet_hours.end}
                  disabled={writesDisabled}
                  onChange={(e) => {
                    if (e.target.value) setQuietHours({ end: e.target.value })
                  }}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="quiet-hours-timezone"
                className="text-[10px] font-black tracking-widest text-muted-foreground uppercase"
              >
                Timezone
              </Label>
              <Select
                value={effectivePrefs.quiet_hours.timezone}
                disabled={writesDisabled}
                onValueChange={(timezone) => setQuietHours({ timezone })}
              >
                <SelectTrigger id="quiet-hours-timezone" className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeZoneOptions().map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="ml-1 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
              Alerts are silenced between these times — focus-timer alerts still
              fire.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
