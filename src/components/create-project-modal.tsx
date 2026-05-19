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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Layers } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects"
import { type Project, createIdempotencyKey } from "@/lib/api"
import {
  ColorIconPicker,
  PRESET_COLORS,
  PRESET_ICONS,
} from "./color-icon-picker"
import { animations } from "@/lib/animations"
import { CharacterCounter } from "./ui/character-counter"

interface CreateProjectModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly project?: Project
}

export function CreateProjectModal({
  open,
  onOpenChange,
  project,
}: Readonly<CreateProjectModalProps>) {
  const [name, setName] = useState(project?.name || "")
  const [color, setColor] = useState(project?.color || PRESET_COLORS[0])
  const [icon, setIcon] = useState(project?.icon || PRESET_ICONS[0])

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const [lastOpen, setLastOpen] = useState(open)

  // Reset state when modal opens
  if (open && !lastOpen) {
    setLastOpen(true)
    setName(project?.name || "")
    setColor(project?.color || PRESET_COLORS[0])
    setIcon(project?.icon || PRESET_ICONS[0])
  } else if (!open && lastOpen) {
    setLastOpen(false)
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      if (project) {
        await updateProject.mutateAsync({
          id: project.id,
          updates: { name: name.trim(), color, icon },
        })
      } else {
        await createProject.mutateAsync({
          name: name.trim(),
          color,
          icon,
          idempotencyKey: createIdempotencyKey(),
        })
      }
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to save project:", err)
    }
  }

  const ProjectIcon =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string; style?: React.CSSProperties }>
      >
    )[icon || "Layers"] || LucideIcons.Layers

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pointer-events-none overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={animations.spring.snappy}
          className="pointer-events-auto overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-sm dark:bg-zinc-900"
        >
          <div className="p-8 sm:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-3xl font-black tracking-tight text-foreground">
                  {project ? "Edit Project" : "New Project"}
                </DialogTitle>
              </div>
              <DialogDescription className="ml-13 text-sm font-medium tracking-wide text-muted-foreground">
                Organize your objectives into a cohesive mission.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <div className="ml-1 flex items-center justify-between">
                  <Label
                    htmlFor="projectName"
                    className="text-[10px] font-black tracking-[0.2em] text-foreground/40 uppercase"
                  >
                    Project Name
                  </Label>
                  <CharacterCounter current={name.length} limit={50} />
                </div>
                <Input
                  id="projectName"
                  placeholder="e.g., Strategic Expansion 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  className="h-16 rounded-[1.25rem] border-2 border-border/50 bg-muted/30 px-6 text-xl font-bold shadow-inner transition-all placeholder:text-muted-foreground/30 hover:border-border focus-visible:border-primary focus-visible:ring-primary/10 dark:bg-zinc-800/80"
                />
              </div>

              <div className="space-y-3">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-foreground/40 uppercase">
                  Visual Identity
                </Label>
                <div className="pl-1">
                  <ColorIconPicker
                    color={color}
                    icon={icon}
                    onSelect={(c, i) => {
                      setColor(c)
                      setIcon(i)
                    }}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-14 w-full justify-start gap-4 rounded-2xl border-border bg-muted/50 px-6 transition-all hover:bg-muted dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                          <ProjectIcon className="h-4 w-4" style={{ color }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Select Color & Icon
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      </Button>
                    }
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-4 border-t border-border/50 pt-6 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 rounded-2xl px-6 font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  Discard
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    loading={createProject.isPending || updateProject.isPending}
                    disabled={!name.trim()}
                    className="h-12 rounded-2xl bg-primary px-8 font-bold tracking-tight text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
                  >
                    <span>{project ? "Save Changes" : "Create Project"}</span>
                  </Button>
                </motion.div>
              </DialogFooter>
            </form>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
