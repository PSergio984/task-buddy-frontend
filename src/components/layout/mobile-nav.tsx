import { Calendar, Inbox, Plus, ListChecks, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"
import { useStats } from "@/hooks/useStats"
import { useToast } from "@/hooks/use-toast"

interface MobileNavProps {
  readonly onNewTask: () => void
  readonly onOpenWorkspace: () => void
}

export function MobileNav({ onNewTask, onOpenWorkspace }: Readonly<MobileNavProps>) {
  const { activeSidebarFilter, setActiveSidebarFilter, setActiveTagId } = useFilters()
  const { data: stats } = useStats()
  const { toast } = useToast()

  const taskCount = stats?.task_stats?.total_tasks ?? 0
  const isTaskLimitReached = taskCount >= 1000

  const handleNewTaskClick = () => {
    if (isTaskLimitReached) {
      toast({
        title: "Task Limit Reached",
        description: "You have reached the maximum of 1000 tasks. Please complete or delete some tasks first.",
        variant: "destructive"
      })
      return
    }
    onNewTask()
  }

  const tabs = [
    { id: "today", label: "Today", icon: Calendar, filter: "today" },
    { id: "inbox", label: "Inbox", icon: Inbox, filter: "inbox" },
    { id: "tasks", label: "Tasks", icon: ListChecks, filter: "all" },
  ]

  const handleTabClick = (filter: string) => {
    setActiveSidebarFilter(filter)
    setActiveTagId(null)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/5 bg-background/80 px-6 pb-[calc(1rem+var(--safe-area-bottom))] pt-3 backdrop-blur-2xl md:hidden">
      {tabs.slice(0, 2).map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.filter)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeSidebarFilter === tab.filter ? "text-primary" : "text-foreground/40"
          )}
        >
          <tab.icon className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}

      {/* Center Create Button */}
      <button
        onClick={handleNewTaskClick}
        className={cn(
          "relative -top-8 flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl ring-4 ring-background transition-all active:scale-95",
          isTaskLimitReached 
            ? "bg-muted text-foreground/20 cursor-not-allowed grayscale" 
            : "bg-primary text-primary-foreground shadow-primary/40"
        )}
      >
        <Plus className="h-8 w-8" />
      </button>

      <button
        onClick={() => handleTabClick("all")}
        className={cn(
          "flex flex-col items-center gap-1 transition-all",
          activeSidebarFilter === "all" ? "text-primary" : "text-foreground/40"
        )}
      >
        <ListChecks className="h-6 w-6" />
        <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
      </button>

      <button
        onClick={onOpenWorkspace}
        className="flex flex-col items-center gap-1 text-foreground/40"
      >
        <Layers className="h-6 w-6" />
        <span className="text-[10px] font-black uppercase tracking-widest">More</span>
      </button>
    </nav>
  )
}
