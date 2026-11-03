import { Plus, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { GameClass, GameProfile, StatKey } from "@/lib/api"
import { cardClass } from "@/lib/game-columns"
import {
  allocatedPoints,
  CLASS_MIN_LEVEL,
  classChoiceOpen,
  GAME_CLASSES,
  RESPEC_GOLD_COST,
  STAT_COLUMN,
  STAT_META,
  STAT_POINT_CAP,
} from "@/lib/game-profile"
import { cn } from "@/lib/utils"

interface StatsPanelProps {
  readonly profile: GameProfile | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  /** Offline — allocates/class writes are server-side arithmetic. */
  readonly writesDisabled?: boolean
  /** Any character write in flight — buttons stay disabled meanwhile. */
  readonly busy?: boolean
  readonly onRetry: () => void
  readonly onAllocate?: (stat: StatKey) => void
  readonly onAutoAllocateChange?: (enabled: boolean) => void
  readonly onSelectClass?: (gameClass: GameClass) => void
  readonly onRespec?: () => void
}

export function StatsPanel({
  profile,
  isPending,
  isError,
  isOnline,
  writesDisabled = false,
  busy = false,
  onRetry,
  onAllocate,
  onAutoAllocateChange,
  onSelectClass,
  onRespec,
}: StatsPanelProps) {
  const canWrite = !writesDisabled
  const unspent = profile?.unspent_stat_points ?? 0
  const respecBlocked = profile !== undefined && profile.gold < RESPEC_GOLD_COST
  // allocate_points rejects once the allocated pool hits the cap.
  const capReached =
    profile !== undefined && allocatedPoints(profile) >= STAT_POINT_CAP

  // Same loading/offline contract as the habits column: a paused query
  // stays isPending, so the uncached-offline case joins the error branch.
  if (isPending && isOnline) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
      </div>
    )
  }
  if ((isError || !isOnline) && profile === undefined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? "Couldn't load your character."
            : "You're offline and your character sheet isn't in the local cache."}
        </p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="h-9 gap-2 rounded-2xl border-white/15 px-4 text-xs font-bold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    )
  }
  if (profile === undefined) return null

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section className={cardClass} aria-labelledby="stats-panel-attributes">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="stats-panel-attributes"
            className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
          >
            Attributes
          </h2>
          <span
            className={cn(
              "text-[10px] font-bold tracking-widest uppercase",
              unspent > 0 ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {unspent} point{unspent === 1 ? "" : "s"} unspent
          </span>
        </div>

        <div className="space-y-2">
          {STAT_META.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground/90">{label}</p>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {key}
                </p>
              </div>
              <span className="w-8 text-right text-lg font-black text-foreground">
                {profile[STAT_COLUMN[key]]}
              </span>
              {canWrite && (
                <button
                  aria-label={`Add ${label} point`}
                  onClick={() => onAllocate?.(key)}
                  disabled={busy || unspent <= 0 || capReached}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-400 transition-all hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="auto-allocate"
            checked={profile.auto_allocate}
            disabled={!canWrite || busy}
            onCheckedChange={(c) => onAutoAllocateChange?.(c === true)}
          />
          <Label
            htmlFor="auto-allocate"
            className="text-xs font-bold text-foreground/80"
          >
            Auto-assign level-up points
          </Label>
        </div>
      </section>

      <section className={cardClass} aria-labelledby="stats-panel-class">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="stats-panel-class"
            className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
          >
            Class
          </h2>
          {profile.game_class !== null && (
            <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
              Lv {profile.level}
            </span>
          )}
        </div>

        {profile.game_class !== null ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-lg font-black tracking-tight text-foreground capitalize">
                {profile.game_class}
              </p>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Current class
              </p>
            </div>
            {canWrite && (
              <Button
                variant="outline"
                onClick={onRespec}
                disabled={busy || respecBlocked}
                title={
                  respecBlocked ? "Not enough gold" : "Refunds allocated points"
                }
                className="h-10 gap-2 rounded-2xl border-white/15 px-5 text-sm font-bold"
              >
                Respec · {RESPEC_GOLD_COST}g
              </Button>
            )}
          </div>
        ) : classChoiceOpen(profile) ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Pick a class to unlock its gear ladders and affinity stats.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GAME_CLASSES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onSelectClass?.(c.value)}
                  disabled={!canWrite || busy}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <p className="text-sm font-black text-foreground">
                    {c.label}
                  </p>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {c.affinity}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Classes unlock at level {CLASS_MIN_LEVEL} — you're level{" "}
            {profile.level}.
          </p>
        )}
      </section>
    </div>
  )
}
