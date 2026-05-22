import { Calendar, LayoutDashboard, Inbox, ListChecks, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"
import { useNavigate, useLocation } from "react-router-dom"

interface MobileNavProps {
  readonly onOpenWorkspace: () => void
  readonly isWorkspaceOpen: boolean
}

export function MobileNav({ onOpenWorkspace, isWorkspaceOpen }: Readonly<MobileNavProps>) {
  const { activeSidebarFilter, setActiveSidebarFilter, activeTagId, setActiveTagId, setActiveStatus } = useFilters()
  const navigate = useNavigate()
  const location = useLocation()

  const isDashboardActive = location.pathname === "/dashboard"
  const isTodayActive = location.pathname === "/tasks" && activeSidebarFilter === "today"
  const isInboxActive = location.pathname === "/tasks" && activeSidebarFilter === "inbox"
  const isTasksActive = location.pathname === "/tasks" && activeSidebarFilter === "all" && activeTagId === null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 items-center border-t border-white/5 bg-background/80 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-2xl md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
      {/* Overview Button */}
      <button
        onClick={() => {
          if (location.pathname !== "/dashboard") {
            navigate("/dashboard")
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-90",
          isDashboardActive ? "text-primary scale-105 font-bold" : "text-foreground/40 hover:text-foreground/60"
        )}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">Overview</span>
      </button>

      {/* Today Button */}
      <button
        onClick={() => {
          setActiveSidebarFilter("today")
          setActiveTagId(null)
          setActiveStatus("all")
          if (location.pathname !== "/tasks") {
            navigate("/tasks")
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-90",
          isTodayActive ? "text-primary scale-105 font-bold" : "text-foreground/40 hover:text-foreground/60"
        )}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">Today</span>
      </button>

      {/* Inbox Button */}
      <button
        onClick={() => {
          setActiveSidebarFilter("inbox")
          setActiveTagId(null)
          setActiveStatus("all")
          if (location.pathname !== "/tasks") {
            navigate("/tasks")
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-90",
          isInboxActive ? "text-primary scale-105 font-bold" : "text-foreground/40 hover:text-foreground/60"
        )}
      >
        <Inbox className="h-5 w-5" />
        <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">Inbox</span>
      </button>

      {/* Tasks Button */}
      <button
        onClick={() => {
          setActiveSidebarFilter("all")
          setActiveTagId(null)
          setActiveStatus("all")
          if (location.pathname !== "/tasks") {
            navigate("/tasks")
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-90",
          isTasksActive ? "text-primary scale-105 font-bold" : "text-foreground/40 hover:text-foreground/60"
        )}
      >
        <ListChecks className="h-5 w-5" />
        <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">Tasks</span>
      </button>

      {/* More Button */}
      <button
        onClick={onOpenWorkspace}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-90",
          isWorkspaceOpen ? "text-primary scale-105 font-bold" : "text-foreground/40 hover:text-foreground/60"
        )}
      >
        <Layers className="h-5 w-5" />
        <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">More</span>
      </button>
    </nav>
  )
}
