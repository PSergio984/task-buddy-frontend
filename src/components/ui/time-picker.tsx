import * as React from "react"
import { Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/SettingsContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export interface TimePickerProps {
  readonly id?: string
  readonly value?: string // "HH:mm" (24h)
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  // Parse "HH:mm" into hours and minutes
  const { hour24, minute } = React.useMemo(() => {
    if (!value) return { hour24: 12, minute: 0 }
    const [h, m] = value.split(":").map(Number)
    return { hour24: h || 0, minute: m || 0 }
  }, [value])

  const { hour12, period } = React.useMemo(() => {
    let h12 = hour24 % 12
    if (h12 === 0) h12 = 12
    const p = hour24 >= 12 ? "PM" : "AM"
    return { hour12: h12, period: p }
  }, [hour24])

  const updateTime = (newHour24: number, newMinute: number) => {
    const h = newHour24.toString().padStart(2, "0")
    const m = newMinute.toString().padStart(2, "0")
    onChange(`${h}:${m}`)
  }

  const handleHourChange = (val: string) => {
    const h = parseInt(val, 10)
    if (is12h) {
      const h24 = period === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
      updateTime(h24, minute)
    } else {
      updateTime(h, minute)
    }
  }

  const handleMinuteChange = (val: string) => {
    updateTime(hour24, parseInt(val, 10))
  }

  const handlePeriodChange = (val: string) => {
    const h12 = hour24 % 12
    const h = h12 === 0 ? 12 : h12
    const h24 = val === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
    updateTime(h24, minute)
  }

  const hours = is12h 
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i)

  const displayTime = React.useMemo(() => {
    if (is12h) {
      const h = hour12.toString().padStart(2, "0")
      const m = minute.toString().padStart(2, "0")
      return `${h}:${m} ${period}`
    }
    return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }, [hour12, minute, period, hour24, is12h])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-14 w-full justify-start rounded-2xl bg-muted/50 border-border px-4 font-black text-lg hover:bg-muted transition-all shadow-xl",
              !value && "text-muted-foreground/30"
            )}
          >
            <Clock className="mr-3 h-5 w-5 text-primary" />
            {displayTime}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 rounded-[2rem] border-border bg-background/95 backdrop-blur-2xl shadow-2xl" align="start">
          <div className="flex items-center gap-3">
            {/* Hour Select */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Hour</span>
              <Select value={is12h ? hour12.toString() : hour24.toString()} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[70px] h-12 rounded-xl border-none bg-white/5 font-bold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border">
                  {hours.map((h) => (
                    <SelectItem key={h} value={h.toString()} className="rounded-lg font-bold">
                      {h.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="mt-5 text-2xl font-black text-muted-foreground/30">:</span>

            {/* Minute Select */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Min</span>
              <Select value={minute.toString()} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[70px] h-12 rounded-xl border-none bg-white/5 font-bold text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border">
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={m.toString()} className="rounded-lg font-bold">
                      {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {is12h && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">AM/PM</span>
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-[70px] h-12 rounded-xl border-none bg-white/5 font-bold text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border">
                    <SelectItem value="AM" className="rounded-lg font-bold">AM</SelectItem>
                    <SelectItem value="PM" className="rounded-lg font-bold">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
