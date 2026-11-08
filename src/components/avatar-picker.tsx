import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Palette, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGameProfile, useUpdateAvatarConfig } from "@/hooks/useGameProfile"
import { useGear, useToggleGearCostume } from "@/hooks/useGameCharacter"
import { AvatarGearOverlay } from "@/components/avatar-gear-overlay"
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  PIXEL_ART_COLORS,
  PIXEL_ART_VARIANTS,
  avatarConfigToUrl,
  traitLabel,
  type AvatarConfig,
} from "@/lib/avatar"
import { cn } from "@/lib/utils"

/** Radix SelectItem can't hold an empty value — 'auto' means "omit the trait". */
const AUTO = "auto"

const VARIANT_LABELS: Record<string, string> = {
  hair: "Hair",
  eyes: "Eyes",
  mouth: "Mouth",
  clothing: "Outfit",
  accessories: "Accessory",
}

const COLOR_LABELS: Record<string, string> = {
  skinColor: "Skin",
  hairColor: "Hair color",
  clothingColor: "Outfit color",
  accessoriesColor: "Accessory color",
  backgroundColor: "Background",
}

/** String-valued members of the traits blob — Record<string,string>;
    other member types couldn't be saved back anyway. */
function stringMembers(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (value !== null && typeof value === "object") {
    for (const [key, member] of Object.entries(value)) {
      if (typeof member === "string" && member.length > 0) out[key] = member
    }
  }
  return out
}

/**
 * Read the stored blob into a picker draft. Keys the picker doesn't manage —
 * costume gear flags, unrecognized trait keys, future top-level additions —
 * carry through untouched so a save never wipes them.
 */
function normalizeConfig(
  raw: Record<string, unknown> | undefined
): AvatarConfig {
  return {
    ...raw,
    style: typeof raw?.style === "string" ? raw.style : DEFAULT_AVATAR_STYLE,
    seed: typeof raw?.seed === "string" ? raw.seed : "",
    traits: stringMembers(raw?.traits),
    // costume is picker-unmanaged — the raw object passes through so
    // non-string members (ids, flags) survive a save unmangled.
    costume:
      raw?.costume !== null && typeof raw?.costume === "object"
        ? (raw.costume as Record<string, unknown>)
        : {},
  }
}

/** Key-order-insensitive stringify — reverting a pick must disable Save even
    when delete/re-add reordered the draft's keys. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  const entries = Object.keys(record)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
  return `{${entries.join(",")}}`
}

export function AvatarCard() {
  const { data: profile, isLoading, isError } = useGameProfile()
  const updateAvatar = useUpdateAvatarConfig()
  const toggleCostume = useToggleGearCostume()
  // null draft = untouched; edits build a whole-config candidate so Save can
  // compare it against the saved blob and disable on revert.
  const [draft, setDraft] = useState<AvatarConfig | null>(null)
  // Which preview URL failed to load — an invalid stored option degrades to
  // initials instead of a broken image; a changed URL resets the fallback.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  // The empty-seed fallback is the literal the mobile app persists — a
  // never-customized avatar must save "taskbuddy", not the username.
  const fallbackSeed = "taskbuddy"
  const saved = normalizeConfig(profile?.avatar_config)
  // No stored seed → preview and Save both use the fallback seed, so what the
  // preview shows is exactly what Save writes (and Save is enabled for it).
  const effective = draft ?? { ...saved, seed: saved.seed || fallbackSeed }
  // The catalog only feeds the pixel-art overlay/fieldset — other resolved
  // styles never show it, so don't pull it (same gate as the HUD).
  const { data: gear } = useGear(effective.style === "pixel-art")
  const hasChanged = stableStringify(effective) !== stableStringify(saved)

  // Debounce the seed so typing doesn't fire a DiceBear fetch per keystroke.
  const [debouncedSeed, setDebouncedSeed] = useState(effective.seed)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSeed(effective.seed), 300)
    return () => clearTimeout(timer)
  }, [effective.seed])
  const previewUrl = avatarConfigToUrl({
    ...effective,
    seed: debouncedSeed || fallbackSeed,
  })
  const showImg = previewUrl !== null && previewUrl !== failedUrl
  // Owned rows only — the worn-gear section toggles their costume flags.
  const ownedGear = (gear ?? []).filter((item) => item.owned)

  const edit = (patch: Partial<AvatarConfig>) =>
    setDraft({ ...effective, ...patch })
  const setTrait = (key: string, value: string) => {
    const traits = { ...effective.traits }
    if (value === AUTO) delete traits[key]
    else traits[key] = value
    edit({ traits })
  }

  const handleSave = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hasChanged) return
    // A cleared seed saves the same fallback the preview shows; trim like
    // mobile so a whitespace seed can't persist a meaningless seed.
    updateAvatar.mutate(
      { ...effective, seed: effective.seed.trim() || fallbackSeed },
      {
        onSuccess: () => setDraft(null),
      }
    )
  }

  // Loading/error resolve to `body`; `??` (not a nested ternary) leaves the
  // form as the default content.
  let body: React.ReactNode = null
  if (isLoading) {
    body = <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
  } else if (isError || profile === undefined) {
    body = (
      <p className="text-sm font-bold text-muted-foreground">
        Game profile unavailable — the avatar picker will return when the game
        API does.
      </p>
    )
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Game Avatar</h2>
          <p className="text-sm text-muted-foreground">
            Your game avatar — pixel-art adds free-tier DiceBear traits.
          </p>
        </div>
      </div>

      {body ?? (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-tr from-primary to-accent text-4xl font-black text-primary-foreground">
                {showImg ? (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    onError={() => setFailedUrl(previewUrl)}
                    className="h-full w-full [image-rendering:pixelated]"
                  />
                ) : (
                  (effective.seed || fallbackSeed)[0]?.toUpperCase() || "U"
                )}
              </div>
              <AvatarGearOverlay items={gear ?? []} config={effective} />
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Label
                htmlFor="avatar-seed"
                className="ml-1 text-sm font-semibold"
              >
                Seed
              </Label>
              <Input
                id="avatar-seed"
                value={effective.seed}
                onChange={(e) => edit({ seed: e.target.value })}
                disabled={updateAvatar.isPending}
                maxLength={64}
                placeholder="Anything — e.g. your username"
                className="h-12 rounded-2xl border-border bg-background/50 px-4 focus-visible:ring-accent/30"
              />
            </div>
          </div>

          {/* Style gates every section below — only pixel-art has the
              trait/color pickers and the worn-gear layer. */}
          <fieldset className="space-y-2">
            <legend className="ml-1 text-sm font-semibold">Style</legend>
            <div className="flex flex-wrap items-center gap-2">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  disabled={updateAvatar.isPending}
                  aria-pressed={effective.style === style}
                  onClick={() => edit({ style })}
                  className={cn(
                    "h-7 rounded-full border px-3 text-[10px] font-bold tracking-widest uppercase transition-colors",
                    effective.style === style
                      ? "border-primary/30 bg-primary/20 text-primary"
                      : "border-white/10 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Trait/color pickers only apply to pixel-art — avatarConfigToUrl
              ignores their option names for other stored styles. The seed
              above still applies to every style. */}
          {effective.style === "pixel-art" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(PIXEL_ART_VARIANTS).map(([key, options]) => (
                  <div key={key} className="space-y-2">
                    <Label className="ml-1 text-sm font-semibold">
                      {VARIANT_LABELS[key] ?? traitLabel(key)}
                    </Label>
                    <Select
                      value={effective.traits[key] ?? AUTO}
                      onValueChange={(value) => setTrait(key, value)}
                      disabled={updateAvatar.isPending}
                    >
                      <SelectTrigger
                        aria-label={VARIANT_LABELS[key] ?? key}
                        className="h-11 rounded-xl bg-background/50"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO}>Auto</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {traitLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                {Object.entries(PIXEL_ART_COLORS).map(([key, palette]) => {
                  const picked = effective.traits[key]
                  return (
                    <fieldset key={key} className="space-y-2">
                      <legend className="ml-1 text-sm font-semibold">
                        {COLOR_LABELS[key] ?? traitLabel(key)}
                      </legend>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={updateAvatar.isPending}
                          onClick={() => setTrait(key, AUTO)}
                          className={cn(
                            "h-7 rounded-full border border-white/10 px-3 text-[10px] font-bold tracking-widest uppercase transition-colors",
                            picked === undefined
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          Auto
                        </button>
                        {palette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            disabled={updateAvatar.isPending}
                            aria-label={`${COLOR_LABELS[key] ?? key} ${color}`}
                            onClick={() => setTrait(key, color)}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full border border-white/10 transition-transform hover:scale-110",
                              picked === color &&
                                "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                            style={{ backgroundColor: `#${color}` }}
                          >
                            {picked === color && (
                              <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                            )}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )
                })}
              </div>
            </>
          )}

          {/* Costume flags live on owned gear, not the config blob — toggles
              POST straight to /game/gear/costume (no Save needed) and the
              overlay on the preview reflects the response cache. Pixel-art
              gated like the pickers: other styles never show the overlay. */}
          {effective.style === "pixel-art" && ownedGear.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="ml-1 text-sm font-semibold">Worn gear</legend>
              <p className="ml-1 text-xs text-muted-foreground">
                Equipped gear shows on the avatar; a checked piece wears as a
                costume over its slot instead — the two flags are independent.
              </p>
              <ul className="space-y-1">
                {ownedGear.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl px-3 py-1.5"
                  >
                    <Checkbox
                      id={`costume-${item.key}`}
                      checked={item.costume === true}
                      disabled={toggleCostume.isPending}
                      onCheckedChange={(checked) =>
                        toggleCostume.mutate({
                          key: item.key,
                          costume: checked === true,
                        })
                      }
                      aria-label={`Use ${item.name} as costume`}
                    />
                    <Label
                      htmlFor={`costume-${item.key}`}
                      className="text-sm font-semibold"
                    >
                      {item.name}
                      <span className="ml-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        {item.slot}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={updateAvatar.isPending || !hasChanged}
              className={cn(
                "h-12 rounded-xl px-8 font-bold shadow-lg transition-all",
                hasChanged
                  ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]"
                  : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 shadow-none"
              )}
            >
              {updateAvatar.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
                />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {updateAvatar.isPending ? "Saving..." : "Save Avatar"}
            </Button>
            {hasChanged && (
              <Button
                type="button"
                variant="ghost"
                disabled={updateAvatar.isPending}
                onClick={() => setDraft(null)}
                className="h-12 rounded-xl px-6 font-bold text-muted-foreground transition-all hover:text-foreground"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  )
}
