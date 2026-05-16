import { motion } from "framer-motion"
import { CheckSquare2, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarBrandingProps {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

export function SidebarBranding({ isCollapsed, onToggle }: SidebarBrandingProps) {
  return (
    <div className={cn(
      "mb-12 flex items-center justify-between gap-4 px-2 relative min-h-[48px]",
      isCollapsed && "flex-col justify-center items-center gap-6"
    )}>
      <div className={cn("flex items-center gap-4 overflow-hidden", isCollapsed && "justify-center px-0")}>
        <motion.div 
          animate={{ 
            opacity: 1,
            scale: isCollapsed ? 0.9 : 1,
            x: 0
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
            <h1 className="font-heading text-2xl font-black tracking-tighter text-foreground uppercase leading-none">
              Task Buddy
            </h1>
            <p className="text-[10px] font-black tracking-[0.4em] text-accent/80 uppercase mt-1">
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
          "z-50 flex items-center justify-center rounded-xl border transition-all duration-500 cursor-pointer shadow-2xl backdrop-blur-xl",
          isCollapsed 
            ? "relative bg-primary text-primary-foreground border-none shadow-primary/40 mt-4 h-12 w-12" 
            : "absolute -right-4 top-2 h-10 w-10 bg-background/95 border-primary/20 text-primary hover:border-primary/50 hover:bg-primary/10 hover:shadow-primary/20"
        )}
      >
        {isCollapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-5 w-5" />}
      </motion.button>
    </div>
  )
}
