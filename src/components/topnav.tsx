import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Settings } from "lucide-react"

export interface TopNavProps {
  onNewTask: () => void
}

export function TopNav({ onNewTask }: TopNavProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "GOOD MORNING"
    if (hour < 18) return "GOOD AFTERNOON"
    return "GOOD EVENING"
  }

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between border-b border-[#EDE9E6] bg-[#FFFFFF] px-6 py-4"
    >
      {/* Left: Branding + Greeting */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.35em] text-[#0F172A] uppercase">
            TASK-BUDDY
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#0F172A]/60 tracking-wider">
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
            className="gap-2 border border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0F172A]/90"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide">NEW TASK</span>
          </Button>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 20 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Settings"
          className="rounded-lg p-2 text-[#0F172A]/50 transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.header>
  )
}
