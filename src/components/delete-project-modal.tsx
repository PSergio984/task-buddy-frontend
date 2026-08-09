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
      <DialogContent className="pointer-events-none overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={animations.spring.snappy}
          className="pointer-events-auto overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl dark:bg-zinc-950"
        >
          <form
            onSubmit={handleConfirm}
            className="flex flex-col gap-6 p-8 sm:p-10"
          >
            <DialogHeader className="text-left">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-2xl font-black tracking-tight text-foreground uppercase">
                  Delete Project
                </DialogTitle>
              </div>
              <DialogDescription className="ml-13 text-sm font-medium text-muted-foreground">
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
                    className="border-zinc-150 flex flex-col items-center justify-center rounded-3xl border bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-black tracking-widest text-foreground/40 uppercase">
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
                    <p className="ml-1 text-[10px] font-black tracking-widest text-foreground/40 uppercase">
                      Choose how to handle the {taskCount} associated task
                      {taskCount === 1 ? "" : "s"}:
                    </p>

                    {/* Option B: Keep Tasks (Safe default) */}
                    <div
                      onClick={() => setDeleteTasks(false)}
                      className={`relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-3xl border p-5 transition-all duration-300 ${
                        !deleteTasks
                          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5 dark:bg-primary/10"
                          : "border-zinc-200 bg-transparent hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`mt-1 rounded-xl p-2 transition-colors ${!deleteTasks ? "bg-primary/20 text-primary" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900"}`}
                      >
                        <Inbox className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            Keep tasks and move to Inbox
                          </h4>
                          {!deleteTasks && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-black tracking-widest text-primary uppercase">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Tasks will become unassigned and remain safe in your
                          personal space.
                        </p>
                      </div>
                    </div>

                    {/* Option A: Delete Tasks */}
                    <div
                      onClick={() => setDeleteTasks(true)}
                      className={`relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-3xl border p-5 transition-all duration-300 ${
                        deleteTasks
                          ? "border-destructive/50 bg-destructive/5 shadow-lg shadow-destructive/5 dark:bg-destructive/10"
                          : "border-zinc-200 bg-transparent hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`mt-1 rounded-xl p-2 transition-colors ${deleteTasks ? "bg-destructive/20 text-destructive" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-900"}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-bold text-foreground">
                          Delete all {taskCount} task
                          {taskCount === 1 ? "" : "s"}
                        </h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          All tasks will be permanently removed. There is no way
                          to recover them.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-foreground">
                        No tasks associated
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        This project is empty. Deleting it will have no impact
                        on your other tasks.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation input name typing */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-black tracking-widest text-foreground/40 uppercase">
                  Type{" "}
                  <span className="font-black text-destructive">
                    "{projectName}"
                  </span>{" "}
                  to confirm deletion
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
                    className={`h-14 w-full rounded-2xl border-2 bg-zinc-50 px-6 text-center text-lg font-bold transition-all focus:outline-none dark:bg-zinc-900 ${
                      confirmationInput && !isMatch
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : isMatch
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-zinc-200 text-foreground hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    } shadow-inner`}
                  />
                </motion.div>
              </div>
            </div>

            <DialogFooter className="mt-4 flex-col gap-3 sm:flex-col">
              <Button
                type="submit"
                disabled={isConfirmDisabled || !isMatch}
                loading={isLoadingDelete}
                variant="destructive"
                className={`h-12 w-full rounded-2xl font-bold tracking-tight shadow-xl transition-all ${
                  !isMatch
                    ? "cursor-not-allowed opacity-50 hover:bg-destructive"
                    : ""
                }`}
              >
                Delete Project
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-12 w-full rounded-2xl border-zinc-200 bg-zinc-50 font-bold text-foreground/80 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
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
