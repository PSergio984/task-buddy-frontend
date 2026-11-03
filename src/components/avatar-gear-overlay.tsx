import type { CSSProperties } from "react"
import {
  Backpack,
  Crown,
  Gem,
  Glasses,
  Shell,
  Shield,
  Shirt,
  Sword,
  type LucideIcon,
} from "lucide-react"
import type { GearItem } from "@/lib/api"
import { DEFAULT_AVATAR_STYLE } from "@/lib/avatar"
import { cn } from "@/lib/utils"

/**
 * Worn-gear emblem layer over a DiceBear avatar (#65). GearItem has no
 * sprite assets, so each slot renders a lucide badge tinted by tier,
 * positioned on the avatar frame. Only pixel-art supports the layer —
 * other styles show the base avatar untouched.
 */

const SLOT_ICONS: Record<string, LucideIcon> = {
  weapon: Sword,
  shield: Shield,
  head: Crown,
  armor: Shell,
  body: Shirt,
  back: Backpack,
  eyewear: Glasses,
}

/** Badge anchor points around the frame edge (translated -50%,-50%). */
const SLOT_POSITION: Record<string, CSSProperties> = {
  head: { left: "50%", top: "0%" },
  eyewear: { left: "86%", top: "10%" },
  weapon: { left: "98%", top: "52%" },
  back: { left: "14%", top: "10%" },
  shield: { left: "2%", top: "52%" },
  armor: { left: "22%", top: "94%" },
  body: { left: "78%", top: "94%" },
}

/** A catalog slot the map doesn't know anchors bottom-center — a new slot
    still shows its badge instead of rendering at the origin. */
const FALLBACK_POSITION: CSSProperties = { left: "50%", top: "96%" }

/** Tier tint: iron → stone, steel+ → amber. */
const TIER_TINT: Record<number, string> = {
  1: "text-stone-400",
  2: "text-amber-400",
}

/**
 * Visually-worn item per slot: a costume flag wins its slot, else the
 * equipped piece shows. `costume` is absent on pre-#65 backends — the
 * `=== true` reads treat missing as false, so equipped still renders.
 */
function wornGear(items: readonly GearItem[]): Map<string, GearItem> {
  const worn = new Map<string, GearItem>()
  for (const item of items) {
    if (item.owned && item.costume === true && !worn.has(item.slot))
      worn.set(item.slot, item)
  }
  for (const item of items) {
    if (item.owned && item.equipped && !worn.has(item.slot))
      worn.set(item.slot, item)
  }
  return worn
}

export function AvatarGearOverlay({
  items,
  config,
}: Readonly<{
  items: readonly GearItem[]
  /** The avatar_config blob (or anything with a `style` member). */
  config?: { style?: unknown } | null
}>) {
  const style = typeof config?.style === "string" ? config.style : undefined
  if ((style ?? DEFAULT_AVATAR_STYLE) !== "pixel-art") return null
  const worn = wornGear(items)
  if (worn.size === 0) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {[...worn.values()].map((item) => {
        const Icon = SLOT_ICONS[item.slot] ?? Gem
        return (
          <span
            key={item.slot}
            role="img"
            aria-label={item.name}
            title={item.name}
            style={SLOT_POSITION[item.slot] ?? FALLBACK_POSITION}
            className={cn(
              "absolute flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/80 shadow",
              TIER_TINT[item.tier] ?? "text-amber-300"
            )}
          >
            <Icon className="h-[62%] w-[62%]" />
          </span>
        )
      })}
    </div>
  )
}
