import * as React from "react"
import { Clock } from "lucide-react"
import TP from "react-time-picker"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/SettingsContext"

import "react-time-picker/dist/TimePicker.css"
import "react-clock/dist/Clock.css"

export interface TimePickerProps {
  readonly id?: string
  readonly value?: string // "HH:mm" (24h)
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  const handleTimeChange = (val: string | null) => {
    if (val) {
      onChange(val)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative group flex items-center h-14 rounded-2xl bg-white/5 border border-white/10 px-4 transition-all focus-within:ring-4 focus-within:ring-primary/20 hover:bg-white/10 shadow-2xl">
        <Clock className="h-5 w-5 text-primary shrink-0 mr-3" />
        
        <div className="flex flex-1 items-center overflow-hidden">
          <TP
            onChange={handleTimeChange}
            value={value || "09:00"}
            disableClock={true}
            clearIcon={null}
            clockIcon={null}
            format={is12h ? "hh:mm a" : "HH:mm"}
            className="premium-time-picker"
          />
        </div>

        {!is12h && (
          <div className="ml-auto px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              24H
            </span>
          </div>
        )}
      </div>

      <style>{`
        .premium-time-picker {
          border: none !important;
          background: transparent !important;
          color: white !important;
          font-family: inherit !important;
          width: 100% !important;
          font-size: 1.125rem !important; /* text-lg */
          font-weight: 900 !important; /* font-black */
        }
        .premium-time-picker .react-time-picker__wrapper {
          border: none !important;
        }
        .premium-time-picker .react-time-picker__inputGroup {
          color: white !important;
          outline: none !important;
        }
        .premium-time-picker .react-time-picker__inputGroup__input {
          color: white !important;
          outline: none !important;
          border: none !important;
          font-weight: 900 !important;
          padding: 0 !important;
          background: transparent !important;
        }
        .premium-time-picker .react-time-picker__inputGroup__input::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .premium-time-picker .react-time-picker__inputGroup__divider {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .premium-time-picker .react-time-picker__inputGroup__input--hasLeadingZero {
          padding-left: 0 !important;
        }
        .react-time-picker__button {
          padding: 4px !important;
        }
        .react-time-picker__button:hover .react-time-picker__button__icon {
          stroke: var(--primary) !important;
        }
        /* Style the actual time inputs */
        .react-time-picker__inputGroup__input {
          min-width: 0.54em !important;
        }
        .react-time-picker__inputGroup__amPm {
          font-size: 0.8em !important;
          margin-left: 4px !important;
          color: var(--primary) !important;
          background: transparent !important;
          border: none !important;
          appearance: none !important;
        }
      `}</style>
    </div>
  )
}

