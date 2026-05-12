import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { useFilters } from "@/contexts/FilterContext"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const { activeSidebarFilter, setActiveSidebarFilter, activeTagId, setActiveTagId } = useFilters()

  const handleProjectClick = (id: number) => {
    setActiveSidebarFilter(`project:${id}`)
    setActiveTagId(null)
    onOpenChange(false)
  }

  const handleTagClick = (id: number) => {
    setActiveTagId(id)
    setActiveSidebarFilter("all")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] border-t border-white/10 bg-background/95 backdrop-blur-2xl px-6 pb-12">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-center text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Workspace</SheetTitle>
        </SheetHeader>

        <div className="space-y-10 overflow-y-auto no-scrollbar pb-20">
          {/* Projects */}
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-primary">Projects</h3>
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p) => {
                const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[p.icon || "Layers"] || LucideIcons.Layers
                const isActive = activeSidebarFilter === `project:${p.id}`
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProjectClick(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl p-4 transition-all border",
                      isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-transparent text-foreground/70"
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: p.color }} />
                    <span className="text-sm font-bold truncate">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-primary">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTagClick(t.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all",
                    activeTagId === t.id ? "bg-primary text-primary-white border-primary" : "bg-white/5 border-white/5 text-foreground/60"
                  )}
                  style={{ color: activeTagId === t.id ? undefined : t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
