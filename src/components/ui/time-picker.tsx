import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TimePickerProps {
  readonly value?: string // "HH:mm"
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = (value || "09:00").split(":")
  
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minutes}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hours}:${newMinute}`)
  }

  return (
    <div className={cn("flex items-center gap-3 bg-muted/20 p-2 rounded-[1.5rem] border border-white/5", className)}>
      <div className="flex items-center gap-1.5 px-3">
        <Clock className="h-4 w-4 text-primary/50" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Set Time</span>
      </div>
      
      <div className="flex items-center gap-1.5 flex-1">
        <Select value={hours} onValueChange={handleHourChange}>
          <SelectTrigger className="h-10 w-20 rounded-xl border-none bg-background/50 backdrop-blur-md px-3 font-bold tracking-tight text-sm transition-all hover:bg-background/80 focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl max-h-[300px]">
            {hourOptions.map((h) => (
              <SelectItem key={h} value={h} className="rounded-xl focus:bg-primary/10 focus:text-primary font-bold text-xs">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-primary/20 font-bold">:</span>

        <Select value={minutes} onValueChange={handleMinuteChange}>
          <SelectTrigger className="h-10 w-20 rounded-xl border-none bg-background/50 backdrop-blur-md px-3 font-bold tracking-tight text-sm transition-all hover:bg-background/80 focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl max-h-[300px]">
            {minuteOptions.map((m) => (
              <SelectItem key={m} value={m} className="rounded-xl focus:bg-primary/10 focus:text-primary font-bold text-xs">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
