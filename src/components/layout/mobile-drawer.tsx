import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { useFilters } from "@/contexts/FilterContext"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"
import { PwaInstallButton } from "../pwa-install-button"
import { CreateProjectModal } from "@/components/create-project-modal"
import { CreateTagModal } from "@/components/create-tag-modal"
import { useSidebarActions } from "@/hooks/useSidebarActions"

interface MobileDrawerProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: Readonly<MobileDrawerProps>) {
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const { activeSidebarFilter, setActiveSidebarFilter, activeTagId, setActiveTagId } = useFilters()

  const {
    isCreateProjectModalOpen,
    isCreateTagModalOpen,
    openCreateProjectModal,
    openCreateTagModal,
    closeCreateProjectModal,
    closeCreateTagModal,
    editingProject,
    editingTag,
  } = useSidebarActions()

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
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Projects</h3>
              <button
                onClick={openCreateProjectModal}
                className="rounded-lg p-1 hover:bg-white/10 text-primary transition-all"
                aria-label="Add Project"
              >
                <LucideIcons.Plus className="h-4 w-4" />
              </button>
            </div>
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
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Tags</h3>
              <button
                onClick={openCreateTagModal}
                className="rounded-lg p-1 hover:bg-white/10 text-primary transition-all"
                aria-label="Add Tag"
              >
                <LucideIcons.Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTagClick(t.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all",
                    activeTagId === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-white/5 text-foreground/60"
                  )}
                  style={{ color: activeTagId === t.id ? undefined : t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* PWA Install */}
          <div className="pt-4 border-t border-white/5">
            <PwaInstallButton isCollapsed={false} />
          </div>
        </div>
      </SheetContent>

      <CreateProjectModal 
        key={isCreateProjectModalOpen ? `project-modal-${editingProject?.id ?? "new"}` : "project-modal-closed"}
        open={isCreateProjectModalOpen} 
        onOpenChange={(open) => !open && closeCreateProjectModal()}
        project={editingProject}
      />
      <CreateTagModal 
        key={isCreateTagModalOpen ? `tag-modal-${editingTag?.id ?? "new"}` : "tag-modal-closed"}
        open={isCreateTagModalOpen} 
        onOpenChange={(open) => !open && closeCreateTagModal()}
        tag={editingTag}
      />
    </Sheet>
  )
}
