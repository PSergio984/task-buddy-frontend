import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { BarChart3, CheckSquare2, LogOut } from "lucide-react"

export interface SidebarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export function Sidebar({ activeFilter, onFilterChange }: SidebarProps) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const categories = [
    { id: "all", label: "All" },
    { id: "work", label: "Work" },
    { id: "personal", label: "Personal" },
    { id: "school", label: "School" },
    { id: "health", label: "Health" },
  ]

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-brand-sidebar flex min-h-screen w-full max-w-[240px] flex-col border-r border-slate-200 px-4 py-6"
    >
      {/* Branding */}
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-brand-accent flex h-8 w-8 items-center justify-center rounded-lg text-white">
          <CheckSquare2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-widest text-white uppercase">
            Task-Buddy
          </span>
          <span className="text-xs text-slate-400">Good Evening</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mb-8 flex flex-col gap-2">
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700">
          <CheckSquare2 className="h-4 w-4" />
          Dashboard
        </button>
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white">
          <BarChart3 className="h-4 w-4" />
          Audit Logs
        </button>
      </nav>

      {/* Filters Section */}
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
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
              "rounded-lg px-3 py-2 text-sm font-medium transition-all",
              activeFilter === category.id
                ? "bg-brand-accent text-white"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="mt-auto flex flex-col gap-4 border-t border-slate-700 pt-4">
        <div className="text-xs">
          <p className="text-slate-400">Logged in as</p>
          <p className="font-medium text-white">{user?.email}</p>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </motion.button>
      </div>
    </motion.aside>
  )
}
