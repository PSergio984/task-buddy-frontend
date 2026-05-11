import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

// eslint-disable-next-line react-refresh/only-export-components
export const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#64748b", // Slate
]

// eslint-disable-next-line react-refresh/only-export-components
export const PRESET_ICONS = [
  "Tag", "Bookmark", "Flag", "Zap", "Star", "Heart", 
  "Briefcase", "Home", "User", "Settings", "Calendar", 
  "ShoppingBag", "Code", "Book", "Music", "Coffee"
]

interface ColorIconPickerProps {
  color?: string
  icon?: string
  onSelect: (color: string, icon: string) => void
  trigger?: React.ReactNode
}

export function ColorIconPicker({ color = "#6366f1", icon = "Tag", onSelect, trigger }: ColorIconPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {icon && (() => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[icon]
              return Icon ? <Icon className="h-3 w-3" style={{ color }} /> : null
            })()}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl space-y-4" align="start">
        <fieldset className="space-y-2">
          <legend className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Color</legend>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onSelect(c, icon)}
                className={cn(
                  "h-5 w-5 rounded-full transition-transform hover:scale-125 flex items-center justify-center",
                  color === c && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="h-3 w-3 text-white" />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Icon</legend>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_ICONS.map((i) => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[i]
              return (
                <button
                  key={i}
                  onClick={() => onSelect(color, i)}
                  className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10",
                    icon === i ? "bg-primary/20 text-primary" : "text-foreground/40"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </fieldset>
      </PopoverContent>
    </Popover>
  )
}
