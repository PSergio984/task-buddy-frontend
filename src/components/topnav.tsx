import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, User, LogOut, ChevronDown, Bell, Clock } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export interface TopNavProps {
  readonly onNewTask: () => void
}

export function TopNav({ onNewTask }: Readonly<TopNavProps>) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    setIsDropdownOpen(false)
    await logout()
    toast({
      title: "Securely Logged Out",
      description: "Come back soon to stay on track.",
      variant: "default",
    })
    navigate("/login")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const userInitial = (user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between border-b bg-background/30 backdrop-blur-3xl px-8 py-6 relative z-50"
    >
      {/* Left: Branding + Greeting */}
      <div className="flex items-center gap-6">
        <div className="hidden sm:block">
          <h2 className="text-2xl font-heading font-black tracking-tighter text-foreground">
            Welcome back, <span className="text-primary">{user?.username || user?.email?.split('@')[0] || "Friend"}</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 mr-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 relative">
             <Bell className="h-5 w-5 text-muted-foreground" />
             <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border/50 mx-2" />

        <div className="flex items-center gap-4 ml-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:block">
            <Button
              id="new-task-btn"
              onClick={onNewTask}
              className="h-12 px-6 gap-2 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all font-bold tracking-tight"
            >
              <Plus className="h-5 w-5" />
              <span>Create Task</span>
            </Button>
          </motion.div>

          {/* User Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 pr-2 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-primary/10 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-black shadow-lg group-hover:shadow-primary/20 transition-all overflow-hidden border border-white/10">
                {userInitial}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isDropdownOpen && "rotate-180")} />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 rounded-[2rem] border bg-background/80 backdrop-blur-3xl p-3 shadow-2xl z-[100] border-primary/10"
                >
                  <div className="p-4 border-b border-border/50 mb-2 bg-primary/5 rounded-t-[1.5rem]">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Signed In As</p>
                    <p className="text-sm font-black text-foreground truncate">{user?.username || user?.email || "Guest User"}</p>
                  </div>
                  
                  <div className="space-y-1 p-1">
                    <button
                      onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group/item"
                    >
                      <User className="h-4 w-4 text-muted-foreground/40 group-hover/item:text-primary transition-colors" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => { navigate("/audit-logs"); setIsDropdownOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all group/item"
                    >
                      <Clock className="h-4 w-4 text-accent/40 group-hover/item:text-accent transition-colors" />
                      History
                    </button>
                    <div className="h-px bg-border/50 my-2 mx-4" />
                    <button
                      onClick={() => setIsLogoutDialogOpen(true)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-all"
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
