import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface SortableSidebarItemProps {
  readonly id: string | number
  readonly children: React.ReactNode
  readonly handle?: React.ReactNode
  readonly className?: string
}

export const SortableSidebarItem = ({
  id,
  children,
  handle,
  className,
}: Readonly<SortableSidebarItemProps>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2",
        isDragging && "z-50 opacity-50",
        className
      )}
    >
      {handle && (
        <div {...attributes} {...listeners}>
          {handle}
        </div>
      )}
      {!handle && (
        <div className="absolute -left-6 opacity-0 transition-opacity group-hover:opacity-100" {...attributes} {...listeners}>
          {/* Default invisible handle if none provided, but typically we want a visible one */}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
