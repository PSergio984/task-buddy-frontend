import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, User, LogOut, ChevronDown, CheckSquare2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { PwaInstallButton } from "./pwa-install-button"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { SyncStatusPill } from "@/components/sync-status-pill"
import { useSync } from "@/contexts/SyncContext"
import { useStats } from "@/hooks/useStats"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface TopNavProps {
  readonly onNewTask: () => void
}

export function TopNav({ onNewTask }: Readonly<TopNavProps>) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const { data: stats } = useStats()
  const { isOnline, isSyncing, pendingCount, conflictCount } = useSync()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const taskCount = stats?.task_stats?.total_tasks ?? 0
  const isTaskLimitReached = taskCount >= 1000

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    setIsDropdownOpen(false)
    await logout()
    toast({
      title: "Securely Logged Out",
      description: "Come back soon to stay on track.",
      variant: "info",
    })
    navigate("/login")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    globalThis.document.addEventListener("mousedown", handleClickOutside)
    return () =>
      globalThis.document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const userInitial = (
    user?.username?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-50 flex items-center justify-between border-b bg-background/30 px-8 py-6 backdrop-blur-3xl"
    >
      {/* Left: Branding + Greeting */}
      <div className="flex items-center gap-6">
        {/* Mobile branding */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <CheckSquare2 className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-black tracking-tighter text-foreground uppercase">
            Task Buddy
          </span>
        </div>

        {/* Desktop greeting */}
        <div className="hidden md:block">
          <h2 className="font-heading text-2xl font-black tracking-tighter text-foreground">
            Welcome back,{" "}
            <span className="text-primary">
              {user?.username || user?.email?.split("@")[0] || "Friend"}
            </span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="mr-4 flex items-center gap-3">
          <SyncStatusPill
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            conflictCount={conflictCount}
          />
          <ThemeToggle />
          <NotificationBell />
        </div>

        <div className="mx-2 h-8 w-px bg-border/50" />

        <div className="ml-4 flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden md:block"
          >
            {isTaskLimitReached ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-primary/10 px-6 font-bold tracking-tight text-primary/40 grayscale">
                    <Plus className="h-5 w-5" />
                    <span>Create Task</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="border-none bg-destructive font-bold text-destructive-foreground">
                  Task limit reached (1000)
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                id="new-task-btn"
                onClick={onNewTask}
                className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold tracking-tight text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                <Plus className="h-5 w-5" />
                <span>Create Task</span>
              </Button>
            )}
          </motion.div>

          {/* User Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group flex items-center gap-2 rounded-2xl border border-transparent bg-muted/30 p-1 pr-2 transition-all hover:border-primary/10 hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-tr from-primary to-accent font-black text-primary-foreground shadow-lg transition-all group-hover:shadow-primary/20">
                {userInitial}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-300",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 z-[100] mt-3 w-64 rounded-[2rem] border border-primary/10 bg-background/98 p-3 shadow-2xl backdrop-blur-3xl"
                >
                  <div className="mb-2 rounded-t-[1.5rem] border-b border-border/50 bg-primary/5 p-4">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                      Signed In As
                    </p>
                    <p className="truncate text-sm font-black text-foreground">
                      {user?.username || user?.email || "Guest User"}
                    </p>
                  </div>

                  <div className="space-y-1 p-1">
                    <button
                      onClick={() => {
                        navigate("/profile")
                        setIsDropdownOpen(false)
                      }}
                      className="group/item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    >
                      <User className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover/item:text-primary" />
                      Profile Settings
                    </button>
                    <div className="px-1 py-1">
                      <PwaInstallButton isCollapsed={false} />
                    </div>
                    <div className="mx-4 my-2 h-px bg-border/50" />
                    <button
                      onClick={() => setIsLogoutDialogOpen(true)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive/60 transition-all hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <LogoutDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onConfirm={handleLogout}
      />
    </motion.header>
  )
}
