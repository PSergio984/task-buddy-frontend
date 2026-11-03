import { Award, Lock, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Achievement } from "@/lib/api"
import { cardClass } from "@/lib/game-columns"
import { cn } from "@/lib/utils"

interface AchievementsPanelProps {
  readonly achievements: Achievement[] | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  readonly onRetry: () => void
}

function earnedLabel(earnedAt: string): string {
  const date = new Date(earnedAt)
  return Number.isNaN(date.getTime())
    ? "Earned"
    : `Earned ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
}

export function AchievementsPanel({
  achievements,
  isPending,
  isError,
  isOnline,
  onRetry,
}: AchievementsPanelProps) {
  // Same loading/offline contract as the habits column (read-only — no
  // writesDisabled, the persisted cache renders offline).
  if (isPending && isOnline) {
    return (
      <div className="space-y-3">
        <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-14 animate-pulse rounded-2xl bg-white/5" />
      </div>
    )
  }
  if ((isError || !isOnline) && achievements === undefined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? "Couldn't load achievements."
            : "You're offline and achievements aren't in the local cache."}
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

  return (
    <section className={cardClass} aria-labelledby="achievements-heading">
      <h2
        id="achievements-heading"
        className="mb-4 text-[10px] font-black tracking-[0.3em] text-primary uppercase"
      >
        Achievements
      </h2>
      <div className="space-y-2">
        {(achievements ?? []).map((a) => {
          const earned = a.earned_at !== null
          return (
            <div
              key={a.key}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3",
                earned
                  ? "border-amber-400/20 bg-amber-400/5"
                  : "border-white/5 bg-white/5 opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  earned
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                    : "border-white/10 bg-white/5 text-muted-foreground"
                )}
              >
                {earned ? (
                  <Award className="h-4.5 w-4.5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground/90">
                  {a.name}
                </p>
                {a.description !== null && (
                  <p className="truncate text-xs text-muted-foreground">
                    {a.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  +{a.gold_reward}g
                </p>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {earned ? earnedLabel(a.earned_at as string) : "Locked"}
                </p>
              </div>
            </div>
          )
        })}
        {(achievements ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No achievements registered yet.
          </p>
        )}
      </div>
    </section>
  )
}
