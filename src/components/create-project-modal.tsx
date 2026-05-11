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
import { Layers, Palette } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useCreateProject } from "@/hooks/useProjects"
import { useToast } from "@/hooks/use-toast"
import { ColorIconPicker, PRESET_COLORS, PRESET_ICONS } from "@/components/color-icon-picker"

export interface CreateProjectModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function CreateProjectModal({
  open,
  onOpenChange,
}: Readonly<CreateProjectModalProps>) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState(PRESET_ICONS[0])
  const createProject = useCreateProject()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      await createProject.mutateAsync({
        name: name.trim(),
        color,
        icon,
      })
      setName("")
      setColor(PRESET_COLORS[0])
      setIcon(PRESET_ICONS[0])
      onOpenChange(false)
      toast({
        title: "Project Created",
        description: "Your new project is ready.",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to create project:", error)
      toast({
        title: "Creation Failed",
        description: "Could not create project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const SelectedIcon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[icon] || LucideIcons.Layers

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden border-none bg-transparent p-0 shadow-none pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="pointer-events-auto overflow-hidden border-none bg-white dark:bg-zinc-900 p-0 shadow-sm rounded-[2.5rem]"
        >
          <div className="p-8 sm:p-10">
            <DialogHeader className="mb-8 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-3xl font-black tracking-tight text-foreground">
                  New Project
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-muted-foreground tracking-wide ml-13">
                Create a dedicated environment for your tasks.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Project Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Marketing Campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-6 text-lg font-semibold focus-visible:ring-primary/20 placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  <Palette className="h-3 w-3" />
                  Appearance
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
                        className="h-14 w-full justify-start gap-4 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-6 hover:bg-muted dark:hover:bg-zinc-800 transition-all"
                      >
                        <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                           <SelectedIcon className="h-4 w-4" style={{ color }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Select Color & Icon</span>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        </div>
                      </Button>
                    }
                  />
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-border/50 gap-4 flex sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 px-6 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold"
                >
                  Discard
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={createProject.isPending || !name.trim()}
                    className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all font-bold tracking-tight"
                  >
                    {createProject.isPending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <span>Create Project</span>
                    )}
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
