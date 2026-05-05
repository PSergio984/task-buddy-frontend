import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  BarChart3,
  CheckSquare2,
  Filter,
  LayoutDashboard,
  LogOut,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"

export interface SidebarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export function Sidebar({ activeFilter, onFilterChange }: SidebarProps) {
  const { logout, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)



  const categories = [
    { id: "all", label: "All" },
    { id: "work", label: "Work" },
    { id: "personal", label: "Personal" },
    { id: "school", label: "School" },
    { id: "health", label: "Health" },
  ]

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/audit-logs", label: "Audit Logs", icon: BarChart3 },
  ]

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    await logout()
    toast({
      title: "Successfully logged out",
      description: "You have been securely signed out of your session.",
      variant: "default",
    })
    navigate("/login")
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen w-full max-w-[240px] flex-col border-r border-border bg-sidebar px-4 py-6"
    >
      {/* Branding */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CheckSquare2 className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold tracking-widest text-sidebar-foreground uppercase">
          task-buddy
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="mb-6 flex flex-col gap-1">
        {navLinks.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Filters Section */}
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-sidebar-foreground/40" />
        <p className="text-xs font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
          Filters
        </p>
      </div>

      {/* Category Buttons */}
      <div className="mb-8 flex flex-col gap-1">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => onFilterChange(category.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "rounded-lg px-3 py-2 text-left text-sm font-medium transition-all",
              activeFilter === category.id
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div className="text-xs">
          <p className="text-sidebar-foreground/50">Logged in as</p>
          <p className="font-medium text-sidebar-foreground">
            {user?.username ?? user?.email ?? "Active session"}
          </p>
        </div>
        <motion.button
          onClick={() => setIsLogoutDialogOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </motion.button>
      </div>

      <LogoutDialog 
        open={isLogoutDialogOpen} 
        onOpenChange={setIsLogoutDialogOpen} 
        onConfirm={handleLogout} 
      />
    </motion.aside>
  )
}
