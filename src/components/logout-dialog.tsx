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
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: () => void
}

export function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
}: Readonly<LogoutDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-[425px]">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Are you sure you want to log out? You will need to sign in again
              to access your tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-destructive px-8 font-semibold tracking-wide text-destructive-foreground hover:bg-destructive/90"
            >
              LOGOUT
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
