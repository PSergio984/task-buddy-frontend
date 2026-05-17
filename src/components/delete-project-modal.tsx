import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Trash2, Inbox, Loader2, Sparkles } from "lucide-react"
import { animations } from "@/lib/animations"

interface DeleteProjectModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (deleteTasks: boolean) => Promise<void>
  readonly projectName: string
  readonly taskCount: number | null
  readonly isLoadingCount: boolean
  readonly isLoadingDelete: boolean
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  onConfirm,
  projectName,
  taskCount,
  isLoadingCount,
  isLoadingDelete,
}: Readonly<DeleteProjectModalProps>) {
  const [deleteTasks, setDeleteTasks] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState("")
  const [shake, setShake] = useState(false)

  const [lastOpen, setLastOpen] = useState(open)

  // Reset states when the modal is opened
  if (open && !lastOpen) {
    setLastOpen(true)
    setDeleteTasks(false)
    setConfirmationInput("")
    setShake(false)
  } else if (!open && lastOpen) {
    setLastOpen(false)
  }

  const isMatch = confirmationInput === projectName
  const isConfirmDisabled = isLoadingCount || isLoadingDelete

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMatch) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    await onConfirm(deleteTasks)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-none bg-transparent p-0 shadow-none pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={animations.spring.snappy}
          className="pointer-events-auto overflow-hidden border-none bg-white dark:bg-zinc-950 p-0 shadow-2xl rounded-[2.5rem]"
        >
          <form onSubmit={handleConfirm} className="p-8 sm:p-10 flex flex-col gap-6">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-2xl font-black tracking-tight text-foreground uppercase">
                  Delete Project
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-muted-foreground ml-13">
                This action is destructive and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {/* Task Count Loading / Selection Section */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isLoadingCount ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800"
                  >
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                      Analyzing associated tasks...
                    </p>
                  </motion.div>
                ) : taskCount !== null && taskCount > 0 ? (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">
                      Choose how to handle the {taskCount} associated task{taskCount === 1 ? "" : "s"}:
                    </p>

                    {/* Option B: Keep Tasks (Safe default) */}
                    <div
                      onClick={() => setDeleteTasks(false)}
                      className={`relative overflow-hidden cursor-pointer rounded-3xl border p-5 transition-all duration-300 flex items-start gap-4 ${
                        !deleteTasks
                          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5 dark:bg-primary/10"
                          : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className={`mt-1 p-2 rounded-xl transition-colors ${!deleteTasks ? "bg-primary/20 text-primary" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"}`}>
                        <Inbox className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">
                            Keep tasks and move to Inbox
                          </h4>
                          {!deleteTasks && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Tasks will become unassigned and remain safe in your personal space.
                        </p>
                      </div>
                    </div>

                    {/* Option A: Delete Tasks */}
                    <div
                      onClick={() => setDeleteTasks(true)}
                      className={`relative overflow-hidden cursor-pointer rounded-3xl border p-5 transition-all duration-300 flex items-start gap-4 ${
                        deleteTasks
                          ? "border-destructive/50 bg-destructive/5 shadow-lg shadow-destructive/5 dark:bg-destructive/10"
                          : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className={`mt-1 p-2 rounded-xl transition-colors ${deleteTasks ? "bg-destructive/20 text-destructive" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"}`}>
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-sm text-foreground">
                          Delete all {taskCount} task{taskCount === 1 ? "" : "s"}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          All tasks will be permanently removed. There is no way to recover them.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-sm text-foreground">
                        No tasks associated
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This project is empty. Deleting it will have no impact on your other tasks.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation input name typing */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">
                  Type <span className="text-destructive font-black">"{projectName}"</span> to confirm deletion
                </label>
                <motion.div
                  animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={`Type "${projectName}" here...`}
                    className={`w-full h-14 bg-zinc-50 dark:bg-zinc-900 border-2 rounded-2xl px-6 text-center font-bold text-lg focus:outline-none transition-all ${
                      confirmationInput && !isMatch
                        ? "border-destructive/30 text-destructive bg-destructive/5"
                        : isMatch
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-zinc-200 dark:border-zinc-800 text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
                    } shadow-inner`}
                  />
                </motion.div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-3 mt-4">
              <Button
                type="submit"
                disabled={isConfirmDisabled || !isMatch}
                loading={isLoadingDelete}
                variant="destructive"
                className={`w-full h-12 rounded-2xl font-bold tracking-tight shadow-xl transition-all ${
                  !isMatch ? "opacity-50 cursor-not-allowed hover:bg-destructive" : ""
                }`}
              >
                Delete Project
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 font-bold text-foreground/80 transition-all"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
