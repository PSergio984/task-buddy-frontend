import { motion } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useFilters } from "@/contexts/FilterContext"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"
import { useGroups } from "@/hooks/useGroups"
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
  LayoutGrid,
  Filter,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Tag,
} from "lucide-react"

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
  const { user: _user, logout } = useAuth()
  const { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId 
  } = useFilters()
  const { data: groups = [] } = useGroups()
  const { data: tags = [] } = useTags()
  const { toast } = useToast()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    await logout()
    toast({
      title: "Securely Logged Out",
      description: "Come back soon to stay on track.",
      variant: "default",
    })
    navigate("/login")
  }

  const navLinks = [
    { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "history", path: "/audit-logs", label: "History", icon: Clock },
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 96 : 320 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden min-h-svh flex-col border-r bg-background/60 px-4 py-8 backdrop-blur-2xl md:flex shadow-2xl shadow-primary/5 group/sidebar"
    >
      {/* Branding Section */}
      <div className="mb-12 flex items-center justify-between gap-4 px-2 relative">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-xl shadow-primary/20">
            <CheckSquare2 className="h-7 w-7 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col whitespace-nowrap"
            >
              <h1 className="font-heading text-xl font-bold tracking-tighter text-foreground uppercase leading-none">
                Task Buddy
              </h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase mt-1">
                Workspace
              </p>
            </motion.div>
          )}
        </div>

        {/* Improved Toggle Button - More Obvious & Following Reference */}
        <div className={cn(
          "transition-all duration-300",
          isCollapsed ? "absolute left-0 right-0 flex justify-center -bottom-10" : ""
        )}>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-background shadow-lg transition-all duration-300 cursor-pointer group/toggle",
              !isCollapsed && "hover:border-primary"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-muted-foreground group-hover/toggle:text-primary-foreground" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground group-hover/toggle:text-primary-foreground" />
            )}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar">
        {/* Navigation Links */}
        <div className="space-y-4">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 uppercase">
              Management
            </p>
          )}
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ path, label, icon: Icon, id }) => {
              const isActive = location.pathname === path
              const content = (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  className={cn(
                    "group relative flex items-center rounded-2xl px-4 py-4 text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground/40 group-hover:text-primary"
                    )}
                  />
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && isActive && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute right-4 h-1.5 w-1.5 rounded-full bg-primary-foreground" 
                    />
                  )}
                </button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold">{label}</TooltipContent>
                  </Tooltip>
                )
              }
              return content
            })}
          </nav>
        </div>

        {/* Overview Section */}
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-center justify-between px-4",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 uppercase">
                Focus
              </p>
            )}
            <Filter className={cn("text-muted-foreground/20", isCollapsed ? "h-4 w-4" : "h-3 w-3")} />
          </div>

          <div className="flex flex-col gap-2">
            <motion.button
              onClick={() => {
                if (location.pathname !== "/dashboard")
                  navigate("/dashboard")
                setActiveSidebarFilter("all")
                setActiveTagId(null)
              }}
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group flex items-center rounded-2xl px-4 py-4 text-left text-sm font-bold transition-all duration-300",
                isCollapsed
                  ? "mx-auto w-14 justify-center"
                  : "w-full justify-between",
                activeSidebarFilter === "all" && activeTagId === null
                  ? "bg-accent/10 text-accent ring-1 ring-accent/30 shadow-lg shadow-accent/5"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-4">
                <LayoutGrid
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    activeSidebarFilter === "all" && activeTagId === null ? "text-accent" : "text-muted-foreground/20 group-hover:text-foreground"
                  )}
                />
                {!isCollapsed && <span>Overview</span>}
              </div>
              {!isCollapsed && activeSidebarFilter === "all" && activeTagId === null && (
                <div className="h-2 w-2 rounded-full bg-accent shadow-glow shadow-accent/50" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-center justify-between px-4",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 uppercase">
                Custom Groups
              </p>
            )}
            <Layers className={cn("text-muted-foreground/20", isCollapsed ? "h-4 w-4" : "h-3 w-3")} />
          </div>

          <div className="flex flex-col gap-2">
            {groups.map((group) => {
              const filterId = `group:${group.id}`
              const isActive = activeSidebarFilter === filterId && activeTagId === null
              const content = (
                <motion.button
                  key={group.id}
                  onClick={() => {
                    if (location.pathname !== "/dashboard")
                      navigate("/dashboard")
                    setActiveSidebarFilter(filterId)
                    setActiveTagId(null)
                  }}
                  whileHover={{ x: isCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group flex items-center rounded-2xl px-4 py-4 text-left text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-between",
                    isActive
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-lg shadow-primary/5"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={cn(
                        "h-5 w-5 rounded-lg flex items-center justify-center transition-colors duration-300",
                        isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                      )}
                      style={{ backgroundColor: group.color || "gray" }}
                    >
                      <Layers className="h-3 w-3 text-white" />
                    </div>
                    {!isCollapsed && <span>{group.name}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary shadow-glow shadow-primary/50" />
                  )}
                </motion.button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={group.id}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold">
                      {group.name}
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
          <div
            className={cn(
              "flex items-center justify-between px-4",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 uppercase">
                Browse Tags
              </p>
            )}
            <Tag className={cn("text-muted-foreground/20", isCollapsed ? "h-4 w-4" : "h-3 w-3")} />
          </div>

          <div className="flex flex-col gap-2">
            {tags.map((tag) => {
              const isActive = activeTagId === tag.id
              const content = (
                <motion.button
                  key={tag.id}
                  onClick={() => {
                    if (location.pathname !== "/dashboard")
                      navigate("/dashboard")
                    setActiveTagId(isActive ? null : tag.id)
                  }}
                  whileHover={{ x: isCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group flex items-center rounded-2xl px-4 py-4 text-left text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-between",
                    isActive
                      ? "bg-accent/10 text-accent ring-1 ring-accent/30 shadow-lg shadow-accent/5"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Tag
                      className={cn(
                        "h-5 w-5 transition-colors duration-300",
                        isActive ? "text-accent" : "text-muted-foreground/20 group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && <span>{tag.name}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <div className="h-2 w-2 rounded-full bg-accent shadow-glow shadow-accent/50" />
                  )}
                </motion.button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={tag.id}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold">
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

      <LogoutDialog 
        open={isLogoutDialogOpen} 
        onOpenChange={setIsLogoutDialogOpen} 
        onConfirm={handleLogout} 
      />
    </motion.aside>
  )
}
