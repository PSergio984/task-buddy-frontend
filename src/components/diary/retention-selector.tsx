import { RETENTION_OPTIONS } from "@/lib/diary"
import type { RetentionPreference } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RetentionSelectorProps {
  readonly value: RetentionPreference
  readonly onChange: (value: RetentionPreference) => void
  readonly disabled?: boolean
}

/**
 * Diary/timeline read horizon — how far back entries and timeline days stay
 * visible. Segmented control, same pattern as the Profile page's toggles.
 */
export function RetentionSelector({
  value,
  onChange,
  disabled = false,
}: RetentionSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Diary retention"
      className="flex w-fit rounded-2xl bg-muted/30 p-1.5"
    >
      {RETENTION_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-300",
            value === option.value
              ? "scale-100 bg-background text-foreground shadow-lg"
              : "scale-95 text-muted-foreground hover:bg-white/5 hover:text-foreground",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
