import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Palette, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
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
import { useAuth } from "@/contexts/AuthContext"
import { useGameProfile, useUpdateAvatarConfig } from "@/hooks/useGameProfile"
import {
  AVATAR_COSTUMES,
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

/** Read the stored blob into a picker draft; unknown/mistyped keys drop out. */
function normalizeConfig(
  raw: Record<string, unknown> | undefined,
  fallbackSeed: string
): AvatarConfig {
  const traits: Record<string, string> = {}
  if (raw?.traits !== null && typeof raw?.traits === "object") {
    for (const [key, value] of Object.entries(raw.traits)) {
      if (typeof value === "string" && value.length > 0) traits[key] = value
    }
  }
  const costume: { name?: string } = {}
  const rawCostume = raw?.costume
  if (rawCostume !== null && typeof rawCostume === "object") {
    const name = (rawCostume as Record<string, unknown>).name
    if (typeof name === "string" && name.length > 0) costume.name = name
  }
  return {
    style: typeof raw?.style === "string" ? raw.style : DEFAULT_AVATAR_STYLE,
    seed: typeof raw?.seed === "string" ? raw.seed : fallbackSeed,
    traits,
    costume,
  }
}

export function AvatarCard() {
  const { user } = useAuth()
  const { data: profile, isLoading, isError } = useGameProfile()
  const updateAvatar = useUpdateAvatarConfig()
  // null draft = untouched; edits build a whole-config candidate so Save can
  // compare it against the saved blob and disable on revert.
  const [draft, setDraft] = useState<AvatarConfig | null>(null)

  const fallbackSeed =
    user?.username || user?.email?.split("@")[0] || "taskbuddy"
  const saved = normalizeConfig(profile?.avatar_config, fallbackSeed)
  const effective = draft ?? saved
  const hasChanged = JSON.stringify(effective) !== JSON.stringify(saved)
  const previewUrl = avatarConfigToUrl(effective)

  const edit = (patch: Partial<AvatarConfig>) =>
    setDraft({ ...effective, ...patch })
  const setTrait = (key: string, value: string) => {
    const traits = { ...effective.traits }
    if (value === AUTO) delete traits[key]
    else traits[key] = value
    edit({ traits })
  }
  const setCostume = (name: string | null) =>
    edit({ costume: name ? { name } : {} })

  const handleSave = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hasChanged) return
    updateAvatar.mutate(effective, {
      onSuccess: () => setDraft(null),
    })
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
            Your pixel-art character — traits are free-tier DiceBear options.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      ) : isError || profile === undefined ? (
        <p className="text-sm font-bold text-muted-foreground">
          Game profile unavailable — the avatar picker will return when the game
          API does.
        </p>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-tr from-primary to-accent text-4xl font-black text-primary-foreground">
              {previewUrl !== null ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-full w-full [image-rendering:pixelated]"
                />
              ) : (
                fallbackSeed[0]?.toUpperCase() || "U"
              )}
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
                maxLength={64}
                placeholder="Anything — e.g. your username"
                className="h-12 rounded-2xl border-border bg-background/50 px-4 focus-visible:ring-accent/30"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(PIXEL_ART_VARIANTS).map(([key, options]) => (
              <div key={key} className="space-y-2">
                <Label className="ml-1 text-sm font-semibold">
                  {VARIANT_LABELS[key] ?? traitLabel(key)}
                </Label>
                <Select
                  value={effective.traits[key] ?? AUTO}
                  onValueChange={(value) => setTrait(key, value)}
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

          <fieldset className="space-y-2">
            <legend className="ml-1 text-sm font-semibold">Costume</legend>
            <div className="flex flex-wrap gap-2">
              {[null, ...AVATAR_COSTUMES].map((name) => (
                <button
                  key={name ?? "none"}
                  type="button"
                  onClick={() => setCostume(name)}
                  className={cn(
                    "h-9 rounded-full border border-white/10 px-4 text-xs font-bold transition-colors",
                    effective.costume.name === (name ?? undefined)
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {name === null ? "None" : traitLabel(name)}
                </button>
              ))}
            </div>
            <p className="ml-1 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
              Stored separately from traits — the visual overlay lands with
              equipment (#64); it never touches stats.
            </p>
          </fieldset>

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
