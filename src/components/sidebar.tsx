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
  Hash,
  ArrowRight,
  ShieldCheck,
  User
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LogoutDialog } from "@/components/logout-dialog"

export interface SidebarProps {
  readonly activeFilter: string
  readonly onFilterChange: (filter: string) => void
}

export function Sidebar({ activeFilter, onFilterChange }: Readonly<SidebarProps>) {
  const { logout, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const categories = [
    { id: "all", label: "Overview", icon: LayoutDashboard },
    { id: "work", label: "Work", icon: Hash },
    { id: "personal", label: "Personal", icon: User },
    { id: "school", label: "School", icon: Hash },
    { id: "health", label: "Wellness", icon: Hash },
  ]

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/audit-logs", label: "Security", icon: ShieldCheck },
    { path: "/profile", label: "Account", icon: User },
  ]

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    await logout()
    toast({
      title: "Securely Disconnected",
      description: "Your session has been terminated successfully.",
      variant: "default",
    })
    navigate("/login")
  }

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden md:flex min-h-svh w-[280px] flex-col border-r bg-background/50 backdrop-blur-3xl px-6 py-10"
    >
      {/* Branding */}
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <CheckSquare2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-black tracking-tight text-foreground uppercase">
            Task Buddy
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">v2.0 Premium</p>
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-10">
        {/* Navigation Links */}
        <div className="space-y-4">
           <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Management</p>
          <nav className="flex flex-col gap-1.5">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                    {label}
                  </div>
                  {isActive && (
                    <motion.div layoutId="active-pill">
                      <ArrowRight className="h-3 w-3 opacity-50" />
                    </motion.div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Categories</p>
            <Filter className="h-3 w-3 text-muted-foreground/30" />
          </div>

          <div className="flex flex-col gap-1.5">
            {categories.map((category) => {
               const isActive = activeFilter === category.id
               return (
                <motion.button
                  key={category.id}
                  onClick={() => onFilterChange(category.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all",
                    isActive
                      ? "bg-accent/10 text-accent ring-1 ring-inset ring-accent/20"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <category.icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-muted-foreground/40")} />
                    {category.label}
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="mt-auto space-y-6 pt-10">
        <div className="rounded-3xl border bg-muted/20 p-5 backdrop-blur-sm">
           <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background border shadow-sm">
                 <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {user?.username ?? user?.email ?? "User Session"}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  {user?.email ?? "active_account"}
                </p>
              </div>
           </div>
        </div>

        <motion.button
          onClick={() => setIsLogoutDialogOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-border bg-background py-3 text-sm font-bold text-muted-foreground shadow-sm transition-all hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
        >
          <LogOut className="h-4 w-4" />
          Disconnect Session
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
