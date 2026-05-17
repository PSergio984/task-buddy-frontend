import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/SettingsContext"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface TimePickerProps {
  readonly id?: string
  readonly value?: string // "HH:mm" (24h)
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ id, value, onChange, className }: TimePickerProps) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  // Internal state for segments
  const [hour, setHour] = React.useState(() => {
    if (!value) return is12h ? "12" : "12" // Or "00" if 24h, but keeping "12"
    const h24 = Number(value.split(":")[0])
    if (is12h) {
      let h12 = h24 % 12
      if (h12 === 0) h12 = 12
      return h12.toString().padStart(2, "0")
    }
    return h24.toString().padStart(2, "0")
  })
  
  const [min, setMin] = React.useState(() => {
    if (!value) return "00"
    return value.split(":")[1].padStart(2, "0")
  })
  
  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    if (!value) return "AM"
    const h24 = Number(value.split(":")[0])
    return h24 >= 12 ? "PM" : "AM"
  })

  // Sync internal state when prop changes (during render pattern)
  const [prevValue, setPrevValue] = React.useState(value)
  const [prev12h, setPrev12h] = React.useState(is12h)

  if (value !== prevValue || is12h !== prev12h) {
    setPrevValue(value)
    setPrev12h(is12h)

    if (value) {
      const [h24, m] = value.split(":").map(Number)
      const mm = m.toString().padStart(2, "0")
      
      if (is12h) {
        let h12 = h24 % 12
        if (h12 === 0) h12 = 12
        setHour(h12.toString().padStart(2, "0"))
        setMin(mm)
        setPeriod(h24 >= 12 ? "PM" : "AM")
      } else {
        setHour(h24.toString().padStart(2, "0"))
        setMin(mm)
      }
    }
  }

  const updateParent = (h: string, m: string, p: "AM" | "PM") => {
    let hh = Number.parseInt(h, 10) || 0
    const mm = Number.parseInt(m, 10) || 0

    if (is12h) {
      if (p === "PM") hh = hh === 12 ? 12 : hh + 12
      else hh = hh === 12 ? 0 : hh
    }

    const hStr = hh.toString().padStart(2, "0")
    const mStr = mm.toString().padStart(2, "0")
    onChange(`${hStr}:${mStr}`)
  }

  // Rolling Digit Logic for Hour
  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      setHour("00")
      updateParent("00", min, period)
      return
    }

    if (!/\d/.test(e.key)) return
    e.preventDefault()

    const digit = e.key
    setHour((prevHour) => {
      let newVal = (prevHour.slice(-1) + digit).padStart(2, "0")
      
      // Validate for 12h/24h
      const num = Number.parseInt(newVal, 10)
      if (is12h) {
        if (num > 12) newVal = "0" + digit // Start over if invalid
        if (num === 0) newVal = "12" 
      } else {
        if (num > 23) newVal = "0" + digit
      }

      updateParent(newVal, min, period)
      return newVal
    })
  }

  // Rolling Digit Logic for Minute
  const handleMinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      setMin("00")
      updateParent(hour, "00", period)
      return
    }

    if (!/\d/.test(e.key)) return
    e.preventDefault()

    const digit = e.key
    setMin((prevMin) => {
      let newVal = (prevMin.slice(-1) + digit).padStart(2, "0")
      
      const num = Number.parseInt(newVal, 10)
      if (num > 59) newVal = "0" + digit

      updateParent(hour, newVal, period)
      return newVal
    })
  }

  const togglePeriod = () => {
    const newPeriod = period === "AM" ? "PM" : "AM"
    setPeriod(newPeriod)
    updateParent(hour, min, newPeriod)
  }

  const displayTime = React.useMemo(() => {
    if (!value) return is12h ? "12:00 AM" : "12:00"
    const [h24, m] = value.split(":").map(Number)
    const mm = m.toString().padStart(2, "0")
    if (is12h) {
      let h12 = h24 % 12
      if (h12 === 0) h12 = 12
      return `${h12.toString().padStart(2, "0")}:${mm} ${h24 >= 12 ? "PM" : "AM"}`
    }
    return `${h24.toString().padStart(2, "0")}:${mm}`
  }, [value, is12h])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="ghost"
            className={cn(
              "h-14 w-full justify-start rounded-2xl bg-muted/50 border-2 border-transparent px-6 font-black text-lg hover:bg-muted focus:bg-background focus:border-primary/30 focus:outline-none transition-all shadow-xl",
              !value && "text-muted-foreground/30"
            )}
          >
            <Clock className="mr-4 h-5 w-5 text-primary" />
            {displayTime}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-6 rounded-[2rem] border-border bg-background/95 backdrop-blur-2xl shadow-2xl" align="start">
          <div className="flex flex-col gap-6 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-start px-2">Set Time</span>
            
            <div className="flex items-center gap-3">
              {/* Hour Segment */}
              <div className="flex flex-col items-center gap-2">
                <Input
                  id={`${id}-hour`}
                  value={hour}
                  onKeyDown={handleHourKeyDown}
                  readOnly // We handle input via onKeyDown for the "rolling" effect
                  className="w-16 h-16 text-center text-3xl font-black rounded-2xl border-none bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all cursor-text"
                  placeholder="12"
                />
                <span className="text-[10px] font-bold uppercase text-muted-foreground/50">Hour</span>
              </div>

              <span className="text-3xl font-black text-muted-foreground/20 -mt-6">:</span>

              {/* Minute Segment */}
              <div className="flex flex-col items-center gap-2">
                <Input
                  id={`${id}-min`}
                  value={min}
                  onKeyDown={handleMinKeyDown}
                  readOnly
                  className="w-16 h-16 text-center text-3xl font-black rounded-2xl border-none bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all cursor-text"
                  placeholder="00"
                />
                <span className="text-[10px] font-bold uppercase text-muted-foreground/50">Min</span>
              </div>

              {is12h && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={togglePeriod}
                    className="w-16 h-16 rounded-2xl bg-primary/5 text-primary text-xl font-black hover:bg-primary/10 transition-all"
                  >
                    {period}
                  </Button>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground/50">AM/PM</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              {[
                { label: "Morning", time: "09:00" },
                { label: "Noon", time: "12:00" },
                { label: "Evening", time: "18:00" },
                { label: "Night", time: "21:00" }
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(preset.time)}
                  className="flex-1 text-[10px] font-bold uppercase tracking-tighter rounded-lg bg-white/5 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
