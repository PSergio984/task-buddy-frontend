import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function LogoutDialog({ open, onOpenChange, onConfirm }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border bg-card p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Are you sure you want to log out? You will need to sign in again to access your tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 mt-6 border-t border-border flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-8 font-semibold tracking-wide"
            >
              LOGOUT
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
