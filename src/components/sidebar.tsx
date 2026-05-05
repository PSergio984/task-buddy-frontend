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
import type { Task } from "@/hooks/useApi"

export interface SidebarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  tasks?: Task[]
}

export function Sidebar({ activeFilter, onFilterChange, tasks = [] }: SidebarProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const totalCount = tasks.length
  const completionPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

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

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen w-full max-w-[240px] flex-col border-r border-[#EDE9E6] bg-[#FFFFFF] px-4 py-6"
    >
      {/* Branding */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-white">
          <CheckSquare2 className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold tracking-widest text-[#0F172A] uppercase">
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
                  ? "bg-[#0F172A] text-white"
                  : "text-[#0F172A]/60 hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* System Overview Card */}
      <div className="mb-6 rounded-xl border border-[#EDE9E6] bg-[#F1F5F9] p-4">
        <p className="mb-1 text-xs font-semibold tracking-widest text-[#0F172A]/60 uppercase">
          System Overview
        </p>
        <p className="text-2xl font-bold text-[#0F172A]">{completionPct}%</p>
        <p className="mt-0.5 text-xs text-[#0F172A]/60">
          {completedCount} of {totalCount} tasks done
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EDE9E6]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: "#C2A388" }}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-[#0F172A]/40" />
        <p className="text-xs font-semibold tracking-widest text-[#0F172A]/50 uppercase">
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
                ? "bg-[#C2A388] text-white"
                : "text-[#0F172A]/60 hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            )}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="mt-auto flex flex-col gap-3 border-t border-[#EDE9E6] pt-4">
        <div className="text-xs">
          <p className="text-[#0F172A]/50">Logged in as</p>
          <p className="font-medium text-[#0F172A]">
            {user?.username ?? user?.email ?? "Active session"}
          </p>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#EDE9E6] bg-[#F1F5F9] px-3 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#EDE9E6]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </motion.button>
      </div>
    </motion.aside>
  )
}
