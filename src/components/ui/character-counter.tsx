import React from "react"
import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  current: number
  limit: number
  className?: string
  warningThreshold?: number
}

export function CharacterCounter({
  current,
  limit,
  className,
  warningThreshold = 0.9,
}: CharacterCounterProps) {
  const isOverLimit = current > limit
  const isNearLimit = current >= limit * warningThreshold

  return (
    <div
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider transition-colors",
        isOverLimit
          ? "text-destructive"
          : isNearLimit
          ? "text-amber-500"
          : "text-muted-foreground/40",
        className
      )}
    >
      {current} / {limit}
    </div>
  )
}
