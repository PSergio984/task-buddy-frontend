
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface SidebarItemActionsProps {
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly className?: string
}

export function SidebarItemActions({
  onEdit,
  onDelete,
  className,
}: Readonly<SidebarItemActionsProps>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More actions"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:bg-white/10 hover:text-foreground transition-all duration-300 focus-visible:ring-1 focus-visible:ring-primary outline-none",
            className
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-background/95 backdrop-blur-xl border-white/10 rounded-xl p-1 shadow-2xl"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
