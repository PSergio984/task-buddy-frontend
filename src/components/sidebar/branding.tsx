import { motion } from "framer-motion"
import { CheckSquare2, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarBrandingProps {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

export function SidebarBranding({
  isCollapsed,
  onToggle,
}: SidebarBrandingProps) {
  return (
    <div
      className={cn(
        "relative mb-12 flex min-h-[48px] items-center justify-between gap-4 px-2",
        isCollapsed && "flex-col items-center justify-center gap-6"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4 overflow-hidden",
          isCollapsed && "justify-center px-0"
        )}
      >
        <motion.div
          animate={{
            opacity: 1,
            scale: isCollapsed ? 0.9 : 1,
            x: 0,
          }}
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-2xl shadow-primary/30"
        >
          <CheckSquare2 className="h-7 w-7 text-primary-foreground" />
        </motion.div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col whitespace-nowrap"
          >
            <h1 className="font-heading text-2xl leading-none font-black tracking-tighter text-foreground uppercase">
              Task Buddy
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[0.4em] text-accent/80 uppercase">
              Elite Productivity
            </p>
          </motion.div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={cn(
          "z-50 flex cursor-pointer items-center justify-center rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-500",
          isCollapsed
            ? "relative mt-4 h-12 w-12 border-none bg-primary text-primary-foreground shadow-primary/40"
            : "absolute top-2 -right-4 h-10 w-10 border-primary/20 bg-background/95 text-primary hover:border-primary/50 hover:bg-primary/10 hover:shadow-primary/20"
        )}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-6 w-6" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </motion.button>
    </div>
  )
}
