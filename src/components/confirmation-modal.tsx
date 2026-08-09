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

  const isMatch =
    !requiredConfirmationText || confirmationInput === requiredConfirmationText

  const getVariantStyles = (): "default" | "destructive" => {
    if (variant === "destructive") {
      return "destructive"
    }
    return "default"
  }

  const getIcon = () => {
    if (variant === "destructive") {
      return <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
    }
    if (variant === "success") {
      return <CheckCircle2 className="mb-4 h-12 w-12 text-primary" />
    }
    return null
  }

  const isConfirmDisabled = isLoading

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] overflow-hidden rounded-[2.5rem] border-white/10 bg-background/95 p-8 shadow-2xl backdrop-blur-3xl">
        <AlertDialogHeader className="items-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={animations.spring.snappy}
          >
            {getIcon()}
          </motion.div>
          <AlertDialogTitle className="mb-2 text-2xl font-black tracking-tight uppercase">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-medium text-foreground/60 italic">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requiredConfirmationText && (
          <div className="mt-6 space-y-3">
            <p className="text-center text-[10px] font-black tracking-widest text-foreground/40 uppercase">
              Type{" "}
              <span className="text-destructive">
                "{requiredConfirmationText}"
              </span>{" "}
              to confirm
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
                className={`h-12 w-full rounded-2xl border bg-white/5 px-4 text-center font-bold transition-all focus:ring-2 focus:outline-none ${
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
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2 transition-all hover:bg-white/10">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              className="border-primary/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="dont-show-again"
              className="cursor-pointer text-[10px] font-black tracking-widest text-foreground/40 uppercase transition-colors select-none hover:text-foreground/60"
            >
              {dontShowAgainLabel}
            </label>
          </div>
        )}

        <AlertDialogFooter className="mt-8 flex-col gap-3 sm:flex-col">
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
              className={`h-12 w-full rounded-2xl font-bold tracking-tight shadow-xl transition-all ${!isMatch ? "cursor-not-allowed opacity-50 hover:bg-destructive/80" : ""}`}
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
              className="h-12 w-full rounded-2xl border-white/10 bg-white/5 font-bold text-foreground/80 transition-all hover:bg-white/10"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
