import { motion } from "framer-motion"
import { CheckSquare2 } from "lucide-react"

export function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute h-12 w-12 rounded-full bg-primary/20" 
          />
          <CheckSquare2 className="h-10 w-10 text-primary animate-pulse" />
        </div>

        <motion.div 
          className="mt-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
            Synchronizing
          </h2>
        </motion.div>
      </motion.div>
    </div>
  )
}

