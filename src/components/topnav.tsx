import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Settings, Search } from "lucide-react"

export interface TopNavProps {
  onNewTask: () => void
}

export function TopNav({ onNewTask }: TopNavProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"
    >
      {/* Left side: Greeting + Search */}
      <div className="flex flex-1 items-center gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden sm:block"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {getGreeting()}
          </h2>
          <p className="text-sm text-slate-500">Welcome back to Task-Buddy</p>
        </motion.div>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Global search..."
            className="bg-brand-bg border-slate-200 pl-9 text-slate-900 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onNewTask}
            className="bg-brand-sidebar gap-2 text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New Task</span>
          </Button>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="hover:bg-brand-muted rounded-lg p-2 text-slate-600 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.header>
  )
}
