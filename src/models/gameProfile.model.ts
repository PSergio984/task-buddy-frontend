import type {
  GameClass,
  GameProfile,
  GearItem,
  GearListResponse,
  StatKey,
  Achievement,
  ActivityGrid,
  ActivityStats,
} from "@/lib/api"
import {
  GEAR_BUY_MUTATION_KEY,
  GEAR_EQUIP_MUTATION_KEY,
} from "@/hooks/useGameCharacter"

/**
 * Pure domain model for Game Profile & Character sheet.
 * Zero React/DOM hooks or JSX.
 */

export const TRIGGER_CLASS =
  "rounded-xl px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-primary/15 data-[state=active]:text-primary"

export function computePendingGearKeys(
  buyKeys: readonly string[],
  equipKeys: readonly string[]
): Set<string> {
  return new Set([...buyKeys, ...equipKeys])
}

export { GEAR_BUY_MUTATION_KEY, GEAR_EQUIP_MUTATION_KEY }

export type {
  GameClass,
  GameProfile,
  GearItem,
  GearListResponse,
  StatKey,
  Achievement,
  ActivityGrid,
  ActivityStats,
}
