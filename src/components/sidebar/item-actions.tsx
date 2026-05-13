import React from "react"
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface SidebarItemActionsProps {
  readonly onEdit: () => void
  readonly onDelete: () => void
}

/**
 * Reusable action menu for sidebar items (projects/tags).
 * Visible on hover of the parent container (which should have the 'group' class).
 */
export function SidebarItemActions({ onEdit, onDelete }: Readonly<SidebarItemActionsProps>) {
  const stopAndPrevent = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    // We don't necessarily want to preventDefault on all events (like Tab)
    // but for click-like events on the trigger, we do.
    if ("preventDefault" in e) {
      e.preventDefault()
    }
  }

  return (
    <div 
      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-auto" 
      data-testid="sidebar-item-actions"
      onClick={(e) => e.stopPropagation()} // Prevent click on container from bubbling
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 focus-visible:ring-1 focus-visible:ring-ring"
            onClick={stopAndPrevent}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                stopAndPrevent(e)
              }
            }}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-32"
          onCloseAutoFocus={(e) => e.preventDefault()} // Avoid focus jumping back in some contexts if undesired
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-white"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
