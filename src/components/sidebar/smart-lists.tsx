import { motion } from "framer-motion"
import { ListChecks, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SmartLink {
  id: string
  label: string
  icon: LucideIcon
  filter: string
}

interface SmartListsSectionProps {
  readonly isCollapsed: boolean
  readonly activeSidebarFilter: string
  readonly onFilterClick: (filter: string) => void
  readonly smartLinks: SmartLink[]
}

export function SmartListsSection({ 
  isCollapsed, 
  activeSidebarFilter, 
  onFilterClick,
  smartLinks 
}: SmartListsSectionProps) {
  return (
    <div className="space-y-4">
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-4">
          <ListChecks className="h-3 w-3 text-accent/60" />
          <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
            Smart Lists
          </p>
        </div>
      )}
      <nav className="flex flex-col gap-1">
        {smartLinks.map(({ label, icon: Icon, id, filter }) => {
          const isActive = activeSidebarFilter === filter
          const content = (
            <button
              key={id}
              onClick={() => onFilterClick(filter)}
              className={cn(
                "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                isCollapsed ? "mx-auto w-12 justify-center" : "w-full justify-start gap-4",
                isActive ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "text-foreground/50")} />
              {!isCollapsed && <span>{label}</span>}
              {!isCollapsed && isActive && (
                <motion.div layoutId="smart-active-indicator" className="absolute right-4 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
              )}
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
