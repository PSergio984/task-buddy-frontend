import { motion } from "framer-motion"
import { CheckSquare2 } from "lucide-react"

export function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Immersive Background Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          {/* Outer Rotating Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute h-32 w-32 rounded-full border border-dashed border-primary/30"
          />
          
          {/* Inner Fast Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute h-24 w-24 rounded-full border-2 border-transparent border-t-primary border-l-accent"
          />
          
          {/* Center Logo Block */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-background"
          >
            <CheckSquare2 className="h-8 w-8" />
          </motion.div>
        </div>

        {/* Branding Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col items-center text-center space-y-2"
        >
          <h2 className="text-2xl font-heading font-black tracking-tighter text-foreground uppercase flex items-center gap-2">
            Task Buddy
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          </h2>
          <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
            Preparing your executive suite
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ height: ["4px", "16px", "4px"], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15, ease: "easeInOut" }}
              className="w-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
