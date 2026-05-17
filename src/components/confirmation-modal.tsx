import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { animations } from "@/lib/animations"

interface ConfirmationModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (dontShowAgain?: boolean) => Promise<void>
  readonly title: string
  readonly description: string
  readonly confirmText?: string
  readonly cancelText?: string
  readonly isLoading?: boolean
  readonly variant?: "default" | "destructive" | "success"
  readonly showDontShowAgain?: boolean
  readonly dontShowAgainLabel?: string
  readonly requiredConfirmationText?: string
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "default",
  showDontShowAgain = false,
  dontShowAgainLabel = "Don't ask me again",
  requiredConfirmationText,
}: Readonly<ConfirmationModalProps>) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState("")
  const [shake, setShake] = useState(false)

  const isMatch = !requiredConfirmationText || confirmationInput === requiredConfirmationText

  const getVariantStyles = (): "default" | "destructive" => {
    if (variant === "destructive") {
      return "destructive"
    }
    return "default"
  }

  const getIcon = () => {
    if (variant === "destructive") {
      return <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    }
    if (variant === "success") {
      return <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
    }
    return null
  }

  const isConfirmDisabled = isLoading

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-8 max-w-[400px] shadow-2xl overflow-hidden">
        <AlertDialogHeader className="items-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={animations.spring.snappy}
          >
            {getIcon()}
          </motion.div>
          <AlertDialogTitle className="text-2xl font-black tracking-tight uppercase mb-2">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/60 font-medium italic">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requiredConfirmationText && (
          <div className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">
              Type <span className="text-destructive">"{requiredConfirmationText}"</span> to confirm
            </p>
            <motion.div
              animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={requiredConfirmationText}
                className={`w-full h-12 bg-white/5 border rounded-2xl px-4 text-center font-bold focus:outline-none focus:ring-2 transition-all ${
                  confirmationInput && !isMatch 
                    ? "border-destructive/50 text-destructive focus:ring-destructive/20" 
                    : isMatch && confirmationInput 
                    ? "border-primary/50 text-primary focus:ring-primary/20" 
                    : "border-white/10 text-foreground focus:ring-white/20"
                }`}
              />
            </motion.div>
          </div>
        )}

        {showDontShowAgain && (
          <div className="mt-6 flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
            <Checkbox 
              id="dont-show-again" 
              checked={dontShowAgain} 
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-[10px] font-black uppercase tracking-widest text-foreground/40 cursor-pointer select-none hover:text-foreground/60 transition-colors"
            >
              {dontShowAgainLabel}
            </label>
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
          <AlertDialogAction asChild>
            <Button
              onClick={async (e) => {
                e.preventDefault()
                if (!isMatch) {
                  setShake(true)
                  setTimeout(() => setShake(false), 500)
                  return
                }
                await onConfirm(dontShowAgain)
              }}
              disabled={isConfirmDisabled}
              loading={isLoading}
              variant={getVariantStyles()}
              className={`w-full h-12 rounded-2xl font-bold tracking-tight shadow-xl transition-all ${!isMatch ? "opacity-50 cursor-not-allowed hover:bg-destructive/80" : ""}`}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
            <Button 
              variant="ghost"
              onClick={() => {
                setConfirmationInput("")
                setDontShowAgain(false)
              }}
              className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-white/10 font-bold text-foreground/80 transition-all"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

