import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, User, LogOut, ChevronDown, Sparkles, Bell } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"
import { ThemeToggle } from "@/components/theme-toggle"

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Rise and Shine"
    if (hour < 18) return "Productive Afternoon"
    return "Evening Reflection"
  }

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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between border-b bg-background/30 backdrop-blur-3xl px-8 py-6 relative z-50"
    >
      {/* Left: Branding + Greeting */}
      <div className="flex items-center gap-8">
        <div className="hidden sm:block">
           <div className="flex items-center gap-2 mb-1">
             <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
             <p className="text-[10px] font-black tracking-[0.25em] text-foreground/40 uppercase">
              Operational Status: Optimal
            </p>
           </div>
          <h2 className="text-2xl font-heading font-black tracking-tighter text-foreground">
            {getGreeting()}, <span className="text-primary">{user?.username || "Explorer"}</span>
          </h2>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 mr-2">
           <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10">
              <Bell className="h-5 w-5 text-muted-foreground" />
           </Button>
           <ThemeToggle />
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            id="new-task-btn"
            onClick={onNewTask}
            className="h-12 px-6 gap-2 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all font-bold tracking-tight"
          >
            <Plus className="h-5 w-5" />
            <span>Forge Task</span>
          </Button>
        </motion.div>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 rounded-2xl border bg-background/50 p-1.5 pr-4 transition-all hover:bg-muted/50 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-black text-primary-foreground shadow-inner">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
             <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-foreground leading-none mb-1">{user?.username || "Account"}</p>
                <p className="text-[10px] font-medium text-muted-foreground leading-none">Premium Plan</p>
             </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 8, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-[2rem] border bg-background/95 backdrop-blur-xl p-2 shadow-2xl shadow-primary/10"
              >
                <div className="px-4 py-3 mb-2 border-b border-border/50">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Authenticated as</p>
                   <p className="text-xs font-bold text-foreground truncate">{user?.email}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent/10 hover:text-accent"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/5">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Profile Settings</span>
                </Link>
                
                <button
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/5">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>End Session</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
