import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  addUtcDays,
  localDateToUtcDay,
  todayUtcDay,
  utcDayLabel,
  utcDayToLocalDate,
  type UtcDay,
} from "@/lib/diary"
import { cn } from "@/lib/utils"

interface DayNavigatorProps {
  readonly day: UtcDay
  readonly onChange: (day: UtcDay) => void
  readonly className?: string
}

/**
 * Prev / calendar-pick / next day stepper shared by the Diary and Timeline
 * pages. Days are UTC calendar labels — the same axis the backend buckets
 * sessions, markers and entries on.
 */
export function DayNavigator({ day, onChange, className }: DayNavigatorProps) {
  const [open, setOpen] = useState(false)
  const isToday = day === todayUtcDay()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => onChange(addUtcDays(day, -1))}
        className="h-10 w-10 rounded-2xl border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Pick a day"
            className="flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-foreground transition-all hover:bg-white/10"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {utcDayLabel(day)}
            <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              UTC
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-2xl border-white/10 bg-background/95 p-0 backdrop-blur-3xl">
          <Calendar
            mode="single"
            selected={utcDayToLocalDate(day)}
            onSelect={(date) => {
              if (date === undefined) return
              onChange(localDateToUtcDay(date))
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next day"
        onClick={() => onChange(addUtcDays(day, 1))}
        className="h-10 w-10 rounded-2xl border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <button
          onClick={() => onChange(todayUtcDay())}
          className="h-10 rounded-2xl px-4 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary/10"
        >
          Today
        </button>
      )}
    </div>
  )
}
