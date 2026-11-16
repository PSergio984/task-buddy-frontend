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

/**
 * Pure domain model for Game Profile & Character sheet.
 * Zero React/DOM hooks or JSX.
 */

export const GEAR_BUY_MUTATION_KEY = ["gear-buy"] as const
export const GEAR_EQUIP_MUTATION_KEY = ["gear-equip"] as const

export function computePendingGearKeys(
  buyKeys: readonly string[],
  equipKeys: readonly string[]
): Set<string> {
  return new Set([...buyKeys, ...equipKeys])
}

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
