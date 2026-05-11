import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/contexts/SettingsContext"
import { format, parse, isValid, startOfDay, addMinutes, setHours, setMinutes } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface TimePickerProps {
  readonly id?: string
  readonly value?: string // Always expected in "HH:mm" (24h) for parent compatibility
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ id, value, onChange, className }: TimePickerProps) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"
  
  // Format string for display/input
  const displayFormat = is12h ? "hh:mm a" : "HH:mm"
  
  const getDisplayValue = (val24h: string) => {
    if (!val24h) return ""
    try {
      const date = parse(val24h, "HH:mm", new Date())
      return isValid(date) ? format(date, displayFormat) : val24h
    } catch {
      return val24h
    }
  }

  const [inputValue, setInputValue] = React.useState(getDisplayValue(value || ""))
  const [prevValue, setPrevValue] = React.useState(value)
  const [isOpen, setIsOpen] = React.useState(false)

  if (value !== prevValue) {
    setInputValue(getDisplayValue(value || ""))
    setPrevValue(value)
  }

  // Generate suggestions based on input
  const suggestions = React.useMemo(() => {
    const times: string[] = []
    const baseDate = startOfDay(new Date())
    
    // If input is empty or just starting, show common intervals
    if (!inputValue) {
      for (let i = 0; i < 24 * 60; i += 30) {
        times.push(format(addMinutes(baseDate, i), displayFormat))
      }
      return times
    }

    // Try to parse partial input to narrow down suggestions
    let searchHours: number | null = null
    const match = inputValue.match(/^(\d{1,2})/)
    if (match) {
      searchHours = Number.parseInt(match[1])
    }

    if (searchHours !== null) {
      // If they typed a single digit or double digit hour
      const hoursToSuggest = is12h 
        ? [searchHours, searchHours + 12].filter(h => h >= 0 && h < 24)
        : [searchHours].filter(h => h >= 0 && h < 24)

      for (const h of hoursToSuggest) {
        for (const m of [0, 15, 30, 45]) {
          const d = setMinutes(setHours(baseDate, h), m)
          times.push(format(d, displayFormat))
        }
      }
    }

    return times.filter(t => t.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 8)
  }, [inputValue, displayFormat, is12h])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    setIsOpen(true)

    // Try to parse and notify parent if it's a valid time
    try {
      const date = parse(val, displayFormat, new Date())
      if (isValid(date)) {
        onChange(format(date, "HH:mm"))
      }
    } catch {
      // Ignore invalid partial inputs
    }
  }

  const handleBlur = () => {
    // Small delay to allow clicking suggestions
    setTimeout(() => {
      setIsOpen(false)
      if (inputValue) {
        try {
          const date = parse(inputValue, displayFormat, new Date())
          if (isValid(date)) {
            const formatted = format(date, displayFormat)
            setInputValue(formatted)
            onChange(format(date, "HH:mm"))
          } else {
            setInputValue(getDisplayValue(value || ""))
          }
        } catch {
          setInputValue(getDisplayValue(value || ""))
        }
      } else {
        onChange("")
      }
    }, 200)
  }

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion)
    try {
      const date = parse(suggestion, displayFormat, new Date())
      if (isValid(date)) {
        onChange(format(date, "HH:mm"))
      }
    } catch (err) {
      console.error("Failed to parse suggestion:", err)
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={isOpen && suggestions.length > 0} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
            <Input
              id={id}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onFocus={(e) => {
                e.target.select()
                setIsOpen(true)
              }}
              className="pl-9 pr-4 h-11 rounded-xl bg-white text-black border-none text-lg font-black tracking-tight focus:ring-4 focus:ring-primary/20 transition-all shadow-lg placeholder:text-black/20"
              placeholder={is12h ? "09:00 AM" : "09:00"}
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[8px] font-black uppercase tracking-tighter text-black/40 bg-black/5 px-1 py-0.5 rounded">
                {timeFormat}
              </span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[200px] p-1 bg-white border-none shadow-2xl rounded-xl" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[200px] overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-primary/10 hover:text-primary rounded-lg transition-colors flex items-center justify-between group"
              >
                {suggestion}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
