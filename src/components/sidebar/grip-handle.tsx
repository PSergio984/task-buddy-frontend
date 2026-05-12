import React from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface GripHandleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly className?: string
}

export const GripHandle = React.forwardRef<HTMLButtonElement, Readonly<GripHandleProps>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label="Drag to reorder"
        className={cn(
          "flex cursor-grab items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing",
          className
        )}
        {...props}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    )
  }
)

GripHandle.displayName = "GripHandle"
