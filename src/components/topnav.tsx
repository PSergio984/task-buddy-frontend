import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, User, LogOut, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export interface TopNavProps {
  onNewTask: () => void
}

export function TopNav({ onNewTask }: TopNavProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "GOOD MORNING"
    if (hour < 18) return "GOOD AFTERNOON"
    return "GOOD EVENING"
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Successfully logged out",
      description: "You have been securely signed out of your session.",
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
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between border-b border-border bg-card px-6 py-4 relative z-50"
    >
      {/* Left: Branding + Greeting */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.35em] text-foreground uppercase">
            TASK-BUDDY
          </p>
          <p className="mt-0.5 text-sm font-semibold text-muted-foreground tracking-wider">
            {getGreeting()}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button
            id="new-task-btn"
            onClick={onNewTask}
            className="gap-2 border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide">NEW TASK</span>
          </Button>
        </motion.div>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-1 pr-3 transition-colors hover:bg-border"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg"
              >
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  )
}
