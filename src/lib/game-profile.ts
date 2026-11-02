/**
 * Character-sheet helpers (pure, no React).
 *
 * The buy guard mirrors the rules character_service.buy_gear enforces
 * server-side (class lock, ladder order, gold) so the UI can disable a
 * purchase it knows will fail; the activity helpers mirror tracking.py's
 * tier_for + filled-day window.
 */
import type {
  ActivityDay,
  GameClass,
  GameProfile,
  GearItem,
  StatKey,
} from "@/lib/api"

export const STAT_KEYS: readonly StatKey[] = ["str", "int", "con", "per"]

/** Maps a StatKey onto the GameProfile column it increments. */
export const STAT_COLUMN = {
  str: "str_stat",
  int: "int_stat",
  con: "con_stat",
  per: "per_stat",
} as const

export const STAT_META: ReadonlyArray<{ key: StatKey; label: string }> = [
  { key: "str", label: "Strength" },
  { key: "int", label: "Intelligence" },
  { key: "con", label: "Constitution" },
  { key: "per", label: "Perception" },
]

export const GAME_CLASSES: ReadonlyArray<{
  value: GameClass
  label: string
  /** The class's two affinity stats, for the pick-hint. */
  affinity: string
}> = [
  { value: "warrior", label: "Warrior", affinity: "STR · CON" },
  { value: "mage", label: "Mage", affinity: "INT · PER" },
  { value: "healer", label: "Healer", affinity: "CON · INT" },
  { value: "rogue", label: "Rogue", affinity: "PER · STR" },
]

/** engine.CLASS_MIN_LEVEL — classes open at level 10. */
export const CLASS_MIN_LEVEL = 10

/**
 * GameRates.respec_gold_cost default — display-only; the server enforces
 * the live value when the POST lands.
 */
export const RESPEC_GOLD_COST = 100

/**
 * A first pick needs level >= CLASS_MIN_LEVEL; class_unlocked is sticky
 * server-side so a classed-then-respeced user re-picks below 10.
 */
export function classChoiceOpen(profile: GameProfile): boolean {
  return profile.class_unlocked || profile.level >= CLASS_MIN_LEVEL
}

/** Catalog rows grouped by slot, preserving the server's ordering. */
export function gearBySlot(items: GearItem[]): Map<string, GearItem[]> {
  const groups = new Map<string, GearItem[]>()
  for (const item of items) {
    const group = groups.get(item.slot)
    if (group === undefined) groups.set(item.slot, [item])
    else group.push(item)
  }
  return groups
}

export type BuyBlock = "owned" | "class" | "tier" | "gold"

/**
 * Why a buy would be rejected, or null when it can proceed — the same
 * checks character_service.buy_gear runs (ladder = tier N needs the owned
 * N-1 piece of the same slot+klass).
 */
export function buyBlock(
  item: GearItem,
  items: GearItem[],
  profile: GameProfile
): BuyBlock | null {
  if (item.owned) return "owned"
  if (item.klass !== "all" && profile.game_class !== item.klass) return "class"
  if (item.tier > 1) {
    const prev = items.find(
      (other) =>
        other.slot === item.slot &&
        other.klass === item.klass &&
        other.tier === item.tier - 1
    )
    if (prev === undefined || !prev.owned) return "tier"
  }
  if (profile.gold < item.cost) return "gold"
  return null
}

/**
 * 0..thresholds.length: count of cutoffs the score reaches — mirrors
 * tracking.tier_for (tier n applies when score >= tier_thresholds[n-1]).
 */
export function activityTier(score: number, tierThresholds: number[]): number {
  return tierThresholds.reduce(
    (tier, cutoff) => (score >= cutoff ? tier + 1 : tier),
    0
  )
}

/** Mon=0..Sun=6 — the same weekday convention RecurrenceWeekdays uses. */
export function weekdayIndex(date: string): number {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
  return (dow + 6) % 7
}

/**
 * Contribution-grid columns: one column per week (Monday start), seven
 * slots each. The server emits every day in the window, so only the first
 * column can lead with nulls and the last can trail them.
 */
export function buildWeeks(days: ActivityDay[]): (ActivityDay | null)[][] {
  const weeks: (ActivityDay | null)[][] = []
  for (const day of days) {
    const wd = weekdayIndex(day.date)
    if (weeks.length === 0 || wd === 0) weeks.push(new Array(7).fill(null))
    weeks[weeks.length - 1][wd] = day
  }
  return weeks
}
