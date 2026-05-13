import * as React from "react"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"
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
  // Fallback formats tried in order when parsing user input
  const alternateFormats = is12h
    ? ["hh:mm a", "h:mm a", "hh:mm", "h:mm"]
    : ["HH:mm", "H:mm"]
  
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
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync with prop value only when not focused or value changed externally
  if (value !== prevValue) {
    setPrevValue(value)
    if (!isFocused) {
      setInputValue(getDisplayValue(value || ""))
    }
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
    const match = /^(\d{1,2})/.exec(inputValue)
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
    let val = e.target.value
    
    // Strict filtering: only allow digits, colons, and AM/PM markers if 12h
    const allowedRegex = is12h ? /[^0-9:apm\s]/gi : /[^0-9:]/gi
    val = val.replace(allowedRegex, "")
    
    // Limit digits to 4
    const digitsOnly = val.replace(/\D/g, "")
    if (digitsOnly.length > 4) {
      let digitCount = 0
      val = Array.from(val)
        .filter((char) => (/\d/.test(char) ? digitCount++ < 4 : true))
        .join("")
    }

    // Handle auto-colon insertion
    const isAdding = val.length > (inputValue?.length || 0)
    if (isAdding && val.length === 2 && !val.includes(":")) {
      val = `${val}:`
    }

    // Prevent double colons
    val = val.replace(/:{2,}/g, ":")

    // Limit length
    const maxLength = is12h ? 8 : 5
    if (val.length > maxLength) {
      val = val.slice(0, maxLength)
    }

    setInputValue(val)
    setIsOpen(true)

    // Notify parent ONLY when it's a complete time format
    // This prevents "11:1" being parsed as "11:01" and resetting the user's input
    const isComplete = is12h 
      ? /[ap]m$/i.test(val) // In 12h, wait for AM/PM to be "certain"
      : /^\d{1,2}:\d{2}$/.test(val) // In 24h, wait for minutes

    if (isComplete) {
      for (const fmt of alternateFormats) {
        try {
          const date = parse(val, fmt, new Date())
          if (isValid(date)) {
            const val24h = format(date, "HH:mm")
            setPrevValue(val24h) // Mark as seen to avoid effect-sync loop
            onChange(val24h)
            break
          }
        } catch { /* ignore invalid formats */ }
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key
    const isControlKey = [
      "Backspace", "Delete", "Tab", "Enter", "Escape", 
      "ArrowLeft", "ArrowRight", "Home", "End"
    ].includes(key) || e.ctrlKey || e.metaKey

    const isDigit = /^[0-9]$/.test(key)
    const isColon = key === ":"
    const isMarker = is12h && (["a", "p", "m", " "].includes(key.toLowerCase()))

    if (!isDigit && !isColon && !isMarker && !isControlKey) {
      e.preventDefault()
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Small delay to allow clicking suggestions
    setTimeout(() => {
      setIsOpen(false)
      if (inputValue) {
        let validDate = null
        for (const fmt of alternateFormats) {
          const date = parse(inputValue, fmt, new Date())
          if (isValid(date)) {
            validDate = date
            break
          }
        }

        if (validDate) {
          const formatted = format(validDate, displayFormat)
          setInputValue(formatted)
          onChange(format(validDate, "HH:mm"))
        } else {
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
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10 transition-transform group-focus-within:scale-110" />
            <Input
              id={id}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={(e) => {
                e.target.select()
                setIsFocused(true)
                setIsOpen(true)
              }}
              className="pl-11 pr-12 h-12 rounded-2xl bg-white/5 text-foreground border border-white/10 text-lg font-black tracking-tight focus:ring-4 focus:ring-primary/20 transition-all shadow-2xl placeholder:text-foreground/20 hover:bg-white/10"
              placeholder={is12h ? "09:00 AM" : "09:00"}
              autoComplete="off"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                  {timeFormat}
                </span>
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[240px] p-2 bg-background/95 backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] z-[100]" 
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[280px] overflow-y-auto no-scrollbar space-y-1 pr-1">
            <div className="px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Suggested Times</p>
            </div>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 text-sm font-bold text-foreground/70 hover:bg-primary/10 hover:text-primary rounded-xl transition-all flex items-center justify-between group"
              >
                {suggestion}
                <motion.div 
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" 
                />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
