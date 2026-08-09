import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { useFilters } from "@/contexts/FilterContext"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"
import { PwaInstallButton } from "../pwa-install-button"
import { CreateProjectModal } from "@/components/create-project-modal"
import { CreateTagModal } from "@/components/create-tag-modal"
import { useSidebarActions } from "@/hooks/useSidebarActions"
import { useNavigate, useLocation } from "react-router-dom"

interface MobileDrawerProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function MobileDrawer({
  open,
  onOpenChange,
}: Readonly<MobileDrawerProps>) {
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const { activeSidebarFilter, activeTagId } = useFilters()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    isCreateProjectModalOpen,
    isCreateTagModalOpen,
    openCreateProjectModal,
    openCreateTagModal,
    closeCreateProjectModal,
    closeCreateTagModal,
    editingProject,
    editingTag,
    handleSidebarFilterClick,
    handleProjectClick: baseHandleProjectClick,
    handleTagClick: baseHandleTagClick,
  } = useSidebarActions()

  const handleProjectClick = (id: number) => {
    baseHandleProjectClick(id)
    onOpenChange(false)
  }

  const handleTagClick = (id: number) => {
    baseHandleTagClick(id)
    onOpenChange(false)
  }

  const handleFilterClick = (filter: string) => {
    handleSidebarFilterClick(filter)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-[3rem] border-t border-white/10 bg-background/95 px-6 pb-12 backdrop-blur-2xl"
      >
        <SheetHeader className="mb-8">
          <SheetTitle className="text-center text-xs font-black tracking-[0.3em] text-muted-foreground uppercase">
            Workspace
          </SheetTitle>
        </SheetHeader>

        <div className="no-scrollbar space-y-10 overflow-y-auto pb-20">
          {/* Navigation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">
                Navigation
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  navigate("/dashboard")
                  onOpenChange(false)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-all",
                  location.pathname === "/dashboard"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-white/5 text-foreground/70"
                )}
              >
                <LucideIcons.LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold">Overview</span>
              </button>
              <button
                onClick={() => {
                  navigate("/audit-logs")
                  onOpenChange(false)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-all",
                  location.pathname === "/audit-logs"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-white/5 text-foreground/70"
                )}
              >
                <LucideIcons.Clock className="h-5 w-5 text-sky-400" />
                <span className="text-sm font-bold">Activity</span>
              </button>
            </div>
          </div>

          {/* Smart Lists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">
                Smart Lists
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleFilterClick("inbox")}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all",
                  location.pathname === "/tasks" &&
                    activeSidebarFilter === "inbox"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-white/5 text-foreground/70"
                )}
              >
                <LucideIcons.Inbox className="h-5 w-5 text-indigo-400" />
                <span className="text-xs font-bold">Inbox</span>
              </button>
              <button
                onClick={() => handleFilterClick("today")}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all",
                  location.pathname === "/tasks" &&
                    activeSidebarFilter === "today"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-white/5 text-foreground/70"
                )}
              >
                <LucideIcons.Calendar className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold">Today</span>
              </button>
              <button
                onClick={() => handleFilterClick("upcoming")}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all",
                  location.pathname === "/tasks" &&
                    activeSidebarFilter === "upcoming"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-transparent bg-white/5 text-foreground/70"
                )}
              >
                <LucideIcons.CalendarRange className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold">Upcoming</span>
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">
                Projects
              </h3>
              <button
                onClick={openCreateProjectModal}
                className="rounded-lg p-1 text-primary transition-all hover:bg-white/10"
                aria-label="Add Project"
              >
                <LucideIcons.Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p) => {
                const Icon =
                  (
                    LucideIcons as unknown as Record<
                      string,
                      LucideIcons.LucideIcon
                    >
                  )[p.icon || "Layers"] || LucideIcons.Layers
                const isActive = activeSidebarFilter === `project:${p.id}`
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProjectClick(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 transition-all",
                      isActive
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-transparent bg-white/5 text-foreground/70"
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: p.color }} />
                    <span className="truncate text-sm font-bold">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">
                Tags
              </h3>
              <button
                onClick={openCreateTagModal}
                className="rounded-lg p-1 text-primary transition-all hover:bg-white/10"
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
                    "rounded-full border px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all",
                    activeTagId === t.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/5 bg-white/5 text-foreground/60"
                  )}
                  style={{ color: activeTagId === t.id ? undefined : t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* PWA Install */}
          <div className="border-t border-white/5 pt-4">
            <PwaInstallButton isCollapsed={false} />
          </div>
        </div>
      </SheetContent>

      <CreateProjectModal
        key={
          isCreateProjectModalOpen
            ? `project-modal-${editingProject?.id ?? "new"}`
            : "project-modal-closed"
        }
        open={isCreateProjectModalOpen}
        onOpenChange={(open) => !open && closeCreateProjectModal()}
        project={editingProject}
      />
      <CreateTagModal
        key={
          isCreateTagModalOpen
            ? `tag-modal-${editingTag?.id ?? "new"}`
            : "tag-modal-closed"
        }
        open={isCreateTagModalOpen}
        onOpenChange={(open) => !open && closeCreateTagModal()}
        tag={editingTag}
      />
    </Sheet>
  )
}
