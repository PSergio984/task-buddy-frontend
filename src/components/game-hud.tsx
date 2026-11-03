import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useGear } from "@/hooks/useGameCharacter"
import { AvatarGearOverlay } from "@/components/avatar-gear-overlay"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { avatarConfigToUrl, DEFAULT_AVATAR_STYLE } from "@/lib/avatar"

interface GameHudProps {
  readonly isCollapsed?: boolean
}

function StatBar({
  label,
  current,
  max,
  barClass,
}: Readonly<{
  label: string
  current: number
  max: number
  barClass: string
}>) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        <span>{label}</span>
        <span>
          {Math.floor(current)} / {Math.floor(max)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all", barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function GameHud({ isCollapsed = false }: GameHudProps) {
  const { user } = useAuth()
  const { data: profile, isLoading, isError } = useGameProfile()
  // The gear overlay renders for pixel-art only — another resolved style
  // would discard the rows, so the catalog fetch waits for a profile that
  // uses them (absent style means the pixel-art default, same as below).
  const avatarStyle = profile?.avatar_config.style
  const { data: gear } = useGear(
    profile !== undefined &&
      (typeof avatarStyle === "string" ? avatarStyle : DEFAULT_AVATAR_STYLE) ===
        "pixel-art"
  )
  const { pendingEventCount } = useGame()
  // Remember which seed failed — a new avatar_config resets the fallback.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="px-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-white/10" />
          {!isCollapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-2 w-16 animate-pulse rounded bg-white/5" />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (profile === undefined) {
    // Failed fetch must not pin the HUD as a skeleton forever — render an
    // honest unavailable state (still navigable, just no game totals).
    const fallbackInitial = (
      user?.username?.[0] ||
      user?.email?.[0] ||
      "U"
    ).toUpperCase()
    return (
      <div className="px-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-black text-muted-foreground">
            {fallbackInitial}
          </div>
          {!isCollapsed && (
            <p className="text-xs font-bold text-muted-foreground">
              {isError ? "Game HUD offline" : "Game profile unavailable"}
            </p>
          )}
        </div>
      </div>
    )
  }

  // No seed in the config yet → the user's initial, same as the account
  // avatar elsewhere in the app.
  const url = avatarConfigToUrl(profile.avatar_config)
  const showImg = url !== null && url !== failedUrl
  const initial = (user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()
  const name = user?.username || user?.email?.split("@")[0] || "Friend"
  const levelLine = `Lv ${profile.level}${profile.game_class ? ` · ${profile.game_class}` : ""}`
  const statsLine = `STR ${profile.str_stat} · INT ${profile.int_stat} · CON ${profile.con_stat} · PER ${profile.per_stat}`

  const avatar = (
    <div className="relative shrink-0">
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-tr from-primary to-accent text-lg font-black text-primary-foreground shadow-lg">
        {showImg ? (
          <img
            src={url}
            alt={`${name}'s avatar`}
            onError={() => setFailedUrl(url)}
            className="h-full w-full [image-rendering:pixelated]"
          />
        ) : (
          initial
        )}
      </div>
      <AvatarGearOverlay items={gear ?? []} config={profile.avatar_config} />
    </div>
  )

  if (isCollapsed) {
    return (
      <div className="flex justify-center pb-4">
        <Tooltip delayDuration={0}>
          {/* A button keeps the collapsed trigger focusable + keyboard-open. */}
          <TooltipTrigger asChild>
            <button type="button" className="cursor-pointer">
              {avatar}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="rounded-xl border-none bg-primary px-4 py-2 font-bold text-primary-foreground"
          >
            {levelLine} · {Math.floor(profile.gold)}g · HP{" "}
            {Math.floor(profile.hp)}/{Math.floor(profile.max_hp)}
            {pendingEventCount > 0 && ` · ${pendingEventCount} pending`}
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-2 pb-6">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {name}
          </p>
          <p className="text-[10px] font-bold tracking-widest text-accent uppercase">
            {levelLine}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <StatBar
          label="HP"
          current={profile.hp}
          max={profile.max_hp}
          barClass="bg-destructive"
        />
        <StatBar
          label="XP"
          current={profile.xp}
          max={profile.xp_to_next_level}
          barClass="bg-sky-400"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        <span className="text-amber-400">🪙 {Math.floor(profile.gold)}</span>
        <span className="normal-case">{statsLine}</span>
      </div>

      {pendingEventCount > 0 && (
        <p className="text-[10px] font-bold tracking-widest text-amber-400/90 uppercase">
          {pendingEventCount} event{pendingEventCount === 1 ? "" : "s"} pending
          sync
        </p>
      )}
    </div>
  )
}
