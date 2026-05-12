import React, { useEffect, useState } from "react"
import { Download, Share, Smartphone, Laptop } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaInstallButtonProps {
  readonly isCollapsed: boolean
}

export function PwaInstallButton({ isCollapsed }: Readonly<PwaInstallButtonProps>) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Detect platform
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    
    setIsIOS(ios)
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!standalone) setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Show button for iOS if not already installed
    if (ios && !standalone) {
      setIsVisible(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setIsVisible(false)
    }
  }

  if (!isVisible || isStandalone) return null

  const label = isIOS ? "Add to Home" : (window.innerWidth > 768 ? "Desktop App" : "Install App")
  const Icon = isIOS ? Smartphone : (window.innerWidth > 768 ? Laptop : Download)

  const content = (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={handleInstallClick}
      className={cn(
        "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
        isCollapsed
          ? "mx-auto w-12 justify-center bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          : "w-full justify-start gap-4 bg-primary/5 text-primary hover:bg-primary/10",
        "border border-primary/20 hover:border-primary/40 shadow-lg shadow-primary/5"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
          "text-primary"
        )}
      />
      {!isCollapsed && <span>{label}</span>}
      {!isCollapsed && (
        <div className="absolute right-4 px-1.5 py-0.5 rounded-md bg-primary text-[8px] text-primary-foreground uppercase tracking-widest font-black">
          PWA
        </div>
      )}
    </motion.button>
  )

  return (
    <>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl">
            {label} for faster access & offline mode
          </TooltipContent>
        </Tooltip>
      ) : (
        content
      )}

      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-white/10 bg-background/95 backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install Task Buddy
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Install Task Buddy on your iPhone for the best experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Share className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-bold leading-tight">
                1. Tap the <span className="text-primary italic">Share</span> button in your browser's toolbar.
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <div className="flex h-5 w-5 items-center justify-center border-2 border-primary rounded-md text-[8px] font-black">＋</div>
              </div>
              <p className="text-sm font-bold leading-tight">
                2. Select <span className="text-primary italic">"Add to Home Screen"</span> from the menu.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
