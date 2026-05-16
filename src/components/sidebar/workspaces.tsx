import { LayoutDashboard, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavLink {
  id: string
  path: string
  label: string
  icon: LucideIcon
}

interface WorkspacesSectionProps {
  readonly isCollapsed: boolean
  readonly currentPath: string
  readonly onNavigate: (path: string) => void
  readonly navLinks: NavLink[]
}

export function WorkspacesSection({ 
  isCollapsed, 
  currentPath, 
  onNavigate,
  navLinks 
}: WorkspacesSectionProps) {
  return (
    <div className="space-y-4">
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-4">
          <LayoutDashboard className="h-3 w-3 text-accent/60" />
          <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
            Workspaces
          </p>
        </div>
      )}
      <nav className="flex flex-col gap-1">
        {navLinks.map(({ path, label, icon: Icon, id }) => {
          const isActive = currentPath === path
          const content = (
            <button
              key={id}
              onClick={() => onNavigate(path)}
              className={cn(
                "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                isCollapsed ? "mx-auto w-12 justify-center" : "w-full justify-start gap-4",
                isActive ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary-rgb),0.4)]" : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-foreground/50")} />
              {!isCollapsed && <span>{label}</span>}
            </button>
          )

          if (isCollapsed) {
            return (
              <Tooltip key={id} delayDuration={0}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl">
                  {label}
                </TooltipContent>
              </Tooltip>
            )
          }
          return content
        })}
      </nav>
    </div>
  )
}
