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
  ListChecks,
  Settings,
  CircleDot,
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
    { id: "dashboard", path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", path: "/tasks", label: "Task Studio", icon: ListChecks },
    { id: "history", path: "/audit-logs", label: "Activity", icon: Clock },
  ]

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 96 : 320 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden min-h-svh flex-col border-r border-white/5 bg-background/60 px-4 py-8 backdrop-blur-3xl md:flex shadow-[20px_0_50px_-20px_rgba(0,0,0,0.4)] group/sidebar z-50"
    >
      {/* Branding Section */}
      <div className="mb-12 flex items-center justify-between gap-4 px-2 relative">
        <div className="flex items-center gap-4 overflow-hidden">
          <motion.div 
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
          whileHover={{ scale: 1.1, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/50 backdrop-blur-sm shadow-xl transition-all duration-300 cursor-pointer",
            isCollapsed && "absolute -right-4 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground border-none scale-75"
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar pr-1">
        {/* Navigation Links */}
        <div className="space-y-4">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold tracking-[0.3em] text-foreground/40 uppercase">
              Control Center
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
                    "group relative flex items-center rounded-2xl px-4 py-4 text-sm font-black tracking-wide transition-all duration-500",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_15px_40px_-10px_rgba(var(--primary-rgb),0.5)] scale-[1.02]"
                      : "text-foreground/50 hover:bg-white/10 hover:text-foreground hover:scale-[1.01]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-500 group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground/40 group-hover:text-primary"
                    )}
                  />
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && isActive && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute right-4 h-2 w-2 rounded-full bg-primary-foreground shadow-[0_0_10px_white]" 
                    />
                  )}
                </button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={id} delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return content
            })}
          </nav>
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
              <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/40 uppercase">
                Workspaces
              </p>
            )}
            <Layers className={cn("text-foreground/20", isCollapsed ? "h-4 w-4" : "h-3 w-3")} />
          </div>

          <div className="flex flex-col gap-2">
            {groups.length === 0 && !isCollapsed && (
              <div className="px-4 py-6 rounded-2xl border border-dashed border-border/50 bg-white/5 text-center">
                <p className="text-[10px] font-bold text-foreground/40 uppercase">No Workspaces</p>
              </div>
            )}
            {groups.map((group) => {
              const filterId = `group:${group.id}`
              const isActive = activeSidebarFilter === filterId && activeTagId === null
              const content = (
                <motion.button
                  key={group.id}
                  onClick={() => {
                    if (location.pathname !== "/dashboard") navigate("/dashboard")
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
                      style={{ backgroundColor: group.color || "gray" }}
                    >
                      <Layers className="h-3.5 w-3.5 text-white" />
                    </div>
                    {!isCollapsed && <span>{group.name}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow shadow-primary/50" />
                  )}
                </motion.button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={group.id} delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
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
              <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/40 uppercase">
                Labels
              </p>
            )}
            <Tag className={cn("text-foreground/20", isCollapsed ? "h-4 w-4" : "h-3 w-3")} />
          </div>

          <div className="flex flex-col gap-2">
            {tags.map((tag) => {
              const isActive = activeTagId === tag.id
              const content = (
                <motion.button
                  key={tag.id}
                  onClick={() => {
                    if (location.pathname !== "/dashboard") navigate("/dashboard")
                    setActiveTagId(isActive ? null : tag.id)
                  }}
                  whileHover={{ x: isCollapsed ? 0 : 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group flex items-center rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-14 justify-center"
                      : "w-full justify-between",
                    isActive
                      ? "bg-accent/10 text-accent ring-1 ring-accent/20 shadow-xl"
                      : "text-foreground/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Tag
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "text-accent scale-110" : "text-foreground/20 group-hover:text-accent group-hover:scale-110"
                      )}
                    />
                    {!isCollapsed && <span>{tag.name}</span>}
                  </div>
                  {!isCollapsed && isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow shadow-accent/50" />
                  )}
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

      {/* User Section - NEW & PREMIUM */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <motion.div 
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          className={cn(
            "flex items-center gap-4 p-4 rounded-2xl cursor-pointer group/user",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          onClick={() => setIsLogoutDialogOpen(true)}
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-xl">
              {_user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-glow" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <p className="font-bold text-sm truncate text-foreground">{_user?.username || "Commander"}</p>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest truncate">Pro Account</p>
            </div>
          )}
          {!isCollapsed && (
            <Settings className="h-4 w-4 text-foreground/20 group-hover/user:text-foreground transition-colors" />
          )}
        </motion.div>
      </div>

      <LogoutDialog 
        open={isLogoutDialogOpen} 
        onOpenChange={setIsLogoutDialogOpen} 
        onConfirm={handleLogout} 
      />
    </motion.aside>
  )
}
