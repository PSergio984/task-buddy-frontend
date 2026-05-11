import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface TimePickerProps {
  readonly id?: string
  readonly value?: string // "HH:mm"
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ id, value, onChange, className }: TimePickerProps) {
  const [inputValue, setInputValue] = React.useState(value || "")
  const [prevValue, setPrevValue] = React.useState(value)

  if (value !== prevValue) {
    setInputValue(value || "")
    setPrevValue(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, "")
    
    if (val.length === 2 && !val.includes(":") && !inputValue.includes(":")) {
      val = val + ":"
    }
    
    if (val.length <= 5) {
      setInputValue(val)
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
        onChange(val)
      }
    }
  }

  const handleBlur = () => {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputValue)) {
      setInputValue(value || "")
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative group">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className="pl-9 pr-4 h-11 rounded-xl bg-white text-black border-none text-lg font-black tracking-tight focus:ring-4 focus:ring-primary/20 transition-all shadow-lg placeholder:text-black/20"
          placeholder="00:00"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <span className="text-[8px] font-black uppercase tracking-tighter text-black/40 bg-black/5 px-1 py-0.5 rounded">24h</span>
        </div>
      </div>
    </div>
  )
}
