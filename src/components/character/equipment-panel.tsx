import { Check, Lock, RefreshCw, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GameProfile, GearItem } from "@/lib/api"
import { cardClass } from "@/lib/game-columns"
import { buyBlock, gearBySlot, type BuyBlock } from "@/lib/game-profile"
import { cn } from "@/lib/utils"

interface EquipmentPanelProps {
  readonly items: GearItem[] | undefined
  readonly profile: GameProfile | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  /** Offline — buys/equips are server-side arithmetic. */
  readonly writesDisabled?: boolean
  /** Item keys with a buy/equip in flight; their buttons stay disabled. */
  readonly pendingKeys?: ReadonlySet<string>
  readonly onRetry: () => void
  readonly onBuy?: (key: string) => void
  readonly onEquip?: (key: string, equipped: boolean) => void
}

const BLOCK_HINT: Record<BuyBlock, string> = {
  owned: "",
  class: "Class locked",
  tier: "Own the previous tier first",
  gold: "Not enough gold",
}

function statsLabel(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([key, n]) => `+${n} ${key.toUpperCase()}`)
    .join(" · ")
}

export function EquipmentPanel({
  items,
  profile,
  isPending,
  isError,
  isOnline,
  writesDisabled = false,
  pendingKeys,
  onRetry,
  onBuy,
  onEquip,
}: EquipmentPanelProps) {
  const canWrite = !writesDisabled

  // Same loading/offline contract as the habits column.
  if (isPending && isOnline) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
      </div>
    )
  }
  if ((isError || !isOnline) && items === undefined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? "Couldn't load the gear catalog."
            : "You're offline and the gear catalog isn't in the local cache."}
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
    <div className="space-y-8">
      {[...gearBySlot(items ?? []).entries()].map(([slot, slotItems]) => (
        <section
          key={slot}
          className={cardClass}
          aria-labelledby={`gear-slot-${slot}`}
        >
          <h2
            id={`gear-slot-${slot}`}
            className="mb-4 text-[10px] font-black tracking-[0.3em] text-primary capitalize uppercase"
          >
            {slot}
          </h2>
          <div className="space-y-2">
            {slotItems.map((item) => {
              // A missing profile is neutral, not a gold shortage — the
              // write buttons disable without claiming a reason.
              const block =
                profile !== undefined
                  ? buyBlock(item, items ?? [], profile)
                  : null
              // set_equipped enforces the same class lock as buy_gear:
              // an owned cross-class piece stays owned but can't be
              // re-worn. A missing profile disables the write too, but
              // only a known mismatch shows the lock indicator.
              const equipLocked =
                item.klass !== "all" && profile?.game_class !== item.klass
              const classLocked = profile !== undefined && equipLocked
              const hint =
                block !== null && block !== "owned"
                  ? BLOCK_HINT[block]
                  : classLocked
                    ? BLOCK_HINT.class
                    : null
              const pending = pendingKeys?.has(item.key) ?? false
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3",
                    item.equipped
                      ? "border-primary/30 bg-primary/5"
                      : "border-white/5 bg-white/5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground/90">
                        {item.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-full border-white/10 bg-white/5 px-2 py-0 text-[9px] font-black tracking-widest text-muted-foreground uppercase"
                      >
                        T{item.tier}
                      </Badge>
                      {item.klass !== "all" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0 text-[9px] font-black tracking-widest uppercase",
                            classLocked
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-accent/30 bg-accent/10 text-accent"
                          )}
                        >
                          {item.klass}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      {statsLabel(item.stats)}
                      {!item.owned && ` · ${item.cost}g`}
                      {hint !== null && (
                        <span className="text-amber-400"> · {hint}</span>
                      )}
                    </p>
                  </div>

                  {item.equipped ? (
                    <Button
                      variant="outline"
                      aria-label={`Unequip ${item.name}`}
                      onClick={() => onEquip?.(item.key, false)}
                      disabled={!canWrite || pending}
                      className="h-8 shrink-0 rounded-xl border-primary/20 px-3 text-xs font-bold"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" /> Equipped
                    </Button>
                  ) : item.owned ? (
                    <Button
                      variant="outline"
                      aria-label={`Equip ${item.name}`}
                      onClick={() => onEquip?.(item.key, true)}
                      disabled={!canWrite || pending || equipLocked}
                      title={classLocked ? BLOCK_HINT.class : undefined}
                      className="h-8 shrink-0 rounded-xl border-white/15 px-3 text-xs font-bold"
                    >
                      {classLocked && <Lock className="h-3.5 w-3.5" />}
                      Equip
                    </Button>
                  ) : (
                    <Button
                      aria-label={`Buy ${item.name}`}
                      onClick={() => onBuy?.(item.key)}
                      disabled={
                        !canWrite ||
                        pending ||
                        profile === undefined ||
                        block !== null
                      }
                      title={
                        block !== null && block !== "owned"
                          ? BLOCK_HINT[block]
                          : undefined
                      }
                      className="h-8 shrink-0 rounded-xl px-3 text-xs font-bold"
                    >
                      {(block === "class" || block === "tier") && (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      Buy
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {items !== undefined && items.length === 0 && (
        <p className="text-sm text-muted-foreground">The catalog is empty.</p>
      )}
    </div>
  )
}
