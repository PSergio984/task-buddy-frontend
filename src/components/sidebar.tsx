import { motion } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"
import { CreateProjectModal } from "@/components/create-project-modal"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CheckSquare2,
  LayoutDashboard,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Tag,
  ListChecks,
  Plus,
  Calendar,
  Inbox,
  CalendarRange,
} from "lucide-react"
import { useState } from "react"

export interface SidebarProps {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

export function Sidebar({
  isCollapsed,
  onToggle,
}: Readonly<SidebarProps>) {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId 
  } = useFilters()
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)

  const navLinks = [
    { id: "dashboard", path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", path: "/tasks", label: "Tasks", icon: ListChecks },
    { id: "history", path: "/audit-logs", label: "Activity", icon: Clock },
  ]

  const smartLinks = [
    { id: "inbox", label: "Inbox", icon: Inbox, filter: "inbox" },
    { id: "today", label: "Today", icon: Calendar, filter: "today" },
    { id: "upcoming", label: "Next 7 Days", icon: CalendarRange, filter: "upcoming" },
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 96 : 320 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden min-h-svh flex-col border-r border-white/5 bg-background/60 px-4 py-8 backdrop-blur-3xl md:flex shadow-[20px_0_50px_-20px_rgba(0,0,0,0.4)] group/sidebar z-50"
    >
      {/* Branding Section */}
      <div className="mb-12 flex items-center justify-between gap-4 px-2 relative min-h-[48px]">
        <div className="flex items-center gap-4 overflow-hidden">
          <motion.div 
            animate={{ 
              opacity: isCollapsed ? 0 : 1,
              scale: isCollapsed ? 0.8 : 1
            }}
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-2xl shadow-primary/30"
          >
            <CheckSquare2 className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col whitespace-nowrap"
            >
              <h1 className="font-heading text-2xl font-black tracking-tighter text-foreground uppercase leading-none">
                Task Buddy
              </h1>
              <p className="text-[10px] font-black tracking-[0.4em] text-accent/80 uppercase mt-1">
                Elite Productivity
              </p>
            </motion.div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary-rgb), 0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-2 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/80 backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/30 hover:text-primary",
            isCollapsed && "bg-primary text-primary-foreground border-none shadow-primary/20"
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar pr-1">
        {/* Smart Lists */}
        <div className="space-y-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4">
              <ListChecks className="h-3 w-3 text-foreground/60" />
              <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/80 uppercase">
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
                  onClick={() => {
                    setActiveSidebarFilter(filter)
                    if (location.pathname !== "/tasks") navigate("/tasks")
                  }}
                  className={cn(
                    "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-12 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary" : "text-foreground/50"
                    )}
                  />
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && isActive && (
                    <motion.div 
                      layoutId="smart-active-indicator"
                      className="absolute right-4 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" 
                    />
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

        {/* Workspaces */}
        <div className="space-y-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4">
              <LayoutDashboard className="h-3 w-3 text-foreground/60" />
              <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/60 uppercase">
                Workspaces
              </p>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ path, label, icon: Icon, id }) => {
              const isActive = location.pathname === path
              const content = (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  className={cn(
                    "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-12 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary-rgb),0.4)]"
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-foreground/50"
                    )}
                  />
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

        {/* Projects Section */}
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-center justify-between px-4",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Layers className="h-3 w-3 text-foreground/60" />
                <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/60 uppercase">
                  Projects
                </p>
              </div>
            )}
            {isCollapsed ? (
              <Layers className="h-4 w-4 text-foreground/20" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="p-1 rounded-md hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {projects.length === 0 && !isCollapsed && (
              <div className="px-4 py-6 rounded-2xl border border-dashed border-border/50 bg-white/5 text-center">
                <p className="text-[10px] font-bold text-foreground/40 uppercase">No Projects</p>
              </div>
            )}
            {projects.map((project) => {
              const filterId = `project:${project.id}`
              const isActive = activeSidebarFilter === filterId && activeTagId === null
              const content = (
                <motion.button
                  key={project.id}
                  onClick={() => {
                    setActiveSidebarFilter(filterId)
                    setActiveTagId(null)
                  }}
                  whileHover={{ x: isCollapsed ? 0 : 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group flex items-center rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-between",
                    isActive
                      ? "bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xl"
                      : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={cn(
                        "h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg",
                        isActive ? "scale-110" : "opacity-40 group-hover:opacity-100 group-hover:scale-110"
                      )}
                      style={{ backgroundColor: project.color || "gray" }}
                    >
                      <Layers className="h-3.5 w-3.5 text-white" />
                    </div>
                    {!isCollapsed && <span>{project.name}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow shadow-primary/50" />
                  )}
                </motion.button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={project.id} delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
                      {project.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return content
            })}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
          <div className={cn("flex items-center justify-between px-4", isCollapsed && "justify-center")}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-foreground/60" />
                <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/60 uppercase">
                  Focus Tags
                </p>
              </div>
            )}
            {isCollapsed && <Tag className="h-4 w-4 text-foreground/20" />}
          </div>

          <div className="flex flex-col gap-1 px-2">
            {tags.length === 0 && !isCollapsed && (
              <div className="px-4 py-4 rounded-xl border border-dashed border-border/30 bg-white/5 text-center">
                <p className="text-[10px] font-bold text-foreground/20 uppercase">No Tags</p>
              </div>
            )}
            <div className={cn("flex flex-wrap gap-2", isCollapsed && "flex-col items-center")}>
              {tags.map((tag) => {
                const isActive = activeTagId === tag.id
                const content = (
                  <motion.button
                    key={tag.id}
                    onClick={() => {
                      setActiveTagId(isActive ? null : tag.id)
                      setActiveSidebarFilter("all")
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <div 
                      className="h-2 w-2 rounded-full shadow-[0_0_5px_currentColor]" 
                      style={{ backgroundColor: tag.color || "gray", color: tag.color || "gray" }} 
                    />
                    {!isCollapsed && <span>{tag.name}</span>}
                  </motion.button>
                )

                if (isCollapsed) {
                  return (
                    <Tooltip key={tag.id} delayDuration={0}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
                        {tag.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                }
                return content
              })}
            </div>
          </div>
        </div>
      </div>

      <CreateProjectModal 
        open={isCreateProjectModalOpen} 
        onOpenChange={setIsCreateProjectModalOpen} 
      />
    </motion.aside>
  )
}
