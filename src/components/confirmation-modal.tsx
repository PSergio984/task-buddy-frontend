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
}: ConfirmationModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "destructive"
      case "success":
        return "default" // success uses primary/default in current theme
      default:
        return "default"
    }
  }

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      case "success":
        return <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
      default:
        return null
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-8 max-w-[400px] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
        
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

        {showDontShowAgain && (
          <div className="mt-6 flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
            <Checkbox 
              id="dont-show-again" 
              checked={dontShowAgain} 
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-[10px] font-black uppercase tracking-widest text-foreground/40 cursor-pointer select-none hover:text-foreground/60 transition-colors"
            >
              Don't ask me again
            </label>
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => {
                e.preventDefault()
                onConfirm(dontShowAgain)
              }}
              loading={isLoading}
              variant={getVariantStyles() as "default" | "destructive"}
              className="w-full h-12 rounded-2xl font-bold tracking-tight shadow-xl transition-all"
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
            <Button 
              variant="ghost"
              className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-white/10 font-bold text-muted-foreground transition-all"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

