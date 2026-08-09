import { useEffect, useState } from "react"
import { Download, Share, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface Window {
    MSStream?: unknown
  }
  interface Navigator {
    standalone?: boolean
  }
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface PwaInstallButtonProps {
  readonly isCollapsed?: boolean
  readonly variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  readonly size?: "default" | "sm" | "lg" | "icon"
  readonly className?: string
}

export function PwaInstallButton({
  isCollapsed,
  variant = "ghost",
  size = "default",
  className,
}: Readonly<PwaInstallButtonProps>) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (globalThis.window === undefined || globalThis.document === undefined)
      return

    // iOS detection
    const ua = globalThis.navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

    const isStandaloneMode =
      globalThis.matchMedia?.("(display-mode: standalone)").matches ?? false
    const isSafariStandalone = globalThis.navigator.standalone ?? false
    const isAndroidApp =
      globalThis.document?.referrer?.includes("android-app://")

    const timer = setTimeout(() => {
      setIsIOS(isIOSDevice)
      if (isStandaloneMode || isSafariStandalone || isAndroidApp) {
        setIsStandalone(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [])
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    const handler = ((e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }) as EventListener

    globalThis.addEventListener("beforeinstallprompt", handler)

    return () => {
      globalThis.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
      }
      return
    }
    setShowInstructions(true)
  }

  if (isStandalone) return null

  const steps = isIOS
    ? [
        {
          number: "1",
          title: "Tap Share",
          description: "Tap the share button in Safari (square with an arrow).",
          icon: <Share className="h-5 w-5 text-primary" />,
        },
        {
          number: "2",
          title: "Add to Home Screen",
          description: "Scroll down and select 'Add to Home Screen'.",
          icon: (
            <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-primary text-[8px] font-black">
              ＋
            </div>
          ),
        },
        {
          number: "3",
          title: "Confirm Add",
          description: "Tap 'Add' in the top right corner to finish.",
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
        },
      ]
    : [
        {
          number: "1",
          title: "Open Menu",
          description:
            "Click the browser menu (three dots ⋮) in the top right.",
          icon: (
            <div className="flex flex-col gap-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
          ),
        },
        {
          number: "2",
          title: "Select Install",
          description:
            "Find 'Install Task Buddy' or 'Save and Share > Install App'.",
          icon: <Download className="h-5 w-5 text-primary" />,
        },
        {
          number: "3",
          title: "Confirm",
          description: "Accept the browser prompt to add it to your device.",
          icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
        },
      ]

  const content = (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstallClick}
      className={cn(
        "gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <Download className="h-4 w-4" />
      {!isCollapsed && <span>Install App</span>}
    </Button>
  )

  return (
    <>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="rounded-xl border-none bg-primary px-4 py-2 font-bold text-primary-foreground"
          >
            Install Task Buddy
          </TooltipContent>
        </Tooltip>
      ) : (
        content
      )}

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="overflow-hidden rounded-[2.5rem] border-none bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[420px]">
          <div className="relative p-8">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary shadow-2xl shadow-primary/30">
                <Download className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight">
                Install Task Buddy
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                Get the best experience with our desktop and mobile app.
              </p>
            </div>

            <div className="relative space-y-8 before:absolute before:top-4 before:bottom-4 before:left-7 before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="group relative flex items-start gap-5"
                >
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/10 bg-background shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-md">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="mb-1 text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase">
                      Step {step.number}
                    </p>
                    <h3 className="mb-1 text-base leading-none font-bold">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed font-medium text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Button
                onClick={() => setShowInstructions(false)}
                className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
