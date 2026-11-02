/**
 * DiceBear avatar config — the {style, seed, traits, costume} blob persisted
 * on the game profile (#65). The picker owns the option vocabulary; the
 * backend stores the blob as given.
 *
 * traits maps DiceBear HTTP-API option names to a single picked value — the
 * picker writes only the pixel-art keys below. costume is the gear layer —
 * owned equipment flagged as costume (#64, Habitica-style); the picker
 * doesn't manage it but must carry it through saves untouched.
 */

export type AvatarConfig = {
  style: string
  seed: string
  traits: Record<string, string>
  costume: Record<string, string>
}

/** DiceBear pixel-art is the spec'd avatar style (#46). */
export const DEFAULT_AVATAR_STYLE = "pixel-art"

const DICEBEAR_STYLES = new Set([
  "pixel-art",
  "adventurer",
  "bottts",
  "thumbs",
  "micah",
  "miniavs",
  "personas",
  "fun-emoji",
])

const numbered = (prefix: string, count: number) =>
  Array.from(
    { length: count },
    (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`
  )

/** Variant (single-select) options, from the DiceBear 9.x pixel-art schema. */
export const PIXEL_ART_VARIANTS: Record<string, string[]> = {
  hair: [...numbered("long", 21), ...numbered("short", 24)],
  eyes: numbered("variant", 12),
  mouth: [...numbered("happy", 13), ...numbered("sad", 10)],
  clothing: numbered("variant", 23),
  accessories: numbered("variant", 4),
}

/** Color (swatch) options — the style's shipped palettes, no '#'. */
export const PIXEL_ART_COLORS: Record<string, string[]> = {
  skinColor: [
    "ffdbac",
    "f5cfa0",
    "eac393",
    "e0b687",
    "cb9e6e",
    "b68655",
    "a26d3d",
    "8d5524",
  ],
  hairColor: [
    "cab188",
    "603a14",
    "83623b",
    "a78961",
    "611c17",
    "603015",
    "612616",
    "28150a",
    "009bbd",
    "bd1700",
    "91cb15",
  ],
  clothingColor: [
    "5bc0de",
    "428bca",
    "03396c",
    "88d8b0",
    "44c585",
    "00b159",
    "ff6f69",
    "d11141",
    "ae0001",
    "ffeead",
    "ffd969",
    "ffc425",
  ],
  accessoriesColor: ["daa520", "ffd700", "fafad2", "d3d3d3", "a9a9a9"],
  backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
}

const PIXEL_ART_OPTION_KEYS = new Set([
  ...Object.keys(PIXEL_ART_VARIANTS),
  ...Object.keys(PIXEL_ART_COLORS),
])

/**
 * Config blob → DiceBear HTTP-API URL. Requires a seed; an absent style
 * defaults to pixel-art and a present-but-unknown style yields null so the
 * caller can fall back to initials (stored configs are user data — the
 * allowlist keeps arbitrary values out of the URL path).
 *
 * Trait params are emitted only for pixel-art — the option names above are
 * pixel-art's schema and other styles would 400 on unknown keys. Options
 * with a DiceBear `*Probability` gate (accessories) are pinned to 100 so a
 * picked variant always renders.
 */
export function avatarConfigToUrl(
  config: Record<string, unknown> | null | undefined
): string | null {
  const seed = config?.seed
  if (typeof seed !== "string" || seed.length === 0) return null
  const raw = config?.style ?? DEFAULT_AVATAR_STYLE
  if (typeof raw !== "string" || !DICEBEAR_STYLES.has(raw)) return null

  const params = new URLSearchParams({ seed })
  if (raw === "pixel-art") {
    const traits = config?.traits
    if (traits !== null && typeof traits === "object") {
      for (const [key, value] of Object.entries(traits)) {
        if (!PIXEL_ART_OPTION_KEYS.has(key)) continue
        if (typeof value !== "string" || value.length === 0) continue
        params.set(key, value)
        if (key === "accessories") params.set("accessoriesProbability", "100")
      }
    }
  }
  return `https://api.dicebear.com/9.x/${raw}/svg?${params.toString()}`
}

/** 'short01' → 'Short 01', 'happy13' → 'Happy 13' — picker labels. */
export function traitLabel(value: string): string {
  return value
    .replace(/^([a-z]+)(\d+)$/i, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
}
