import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"
import { CreateProjectModal } from "@/components/create-project-modal"
import { CreateTagModal } from "@/components/create-tag-modal"
import { useProjects, useReorderProjects, useDeleteProject } from "@/hooks/useProjects"
import { useTags, useDeleteTag, useReorderTags } from "@/hooks/useTags"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { GripHandle } from "./sidebar/grip-handle"
import { SortableSidebarItem } from "./sidebar/sortable-item"
import { SidebarItemActions } from "./sidebar/item-actions"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import type { Tag as TagType, Project as ProjectType } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CheckSquare2,
  LayoutDashboard,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Tag,
  ListChecks,
  Plus,
  Calendar,
  Inbox,
  CalendarRange,
  ChevronDown,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useState } from "react"

export interface SidebarProps {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

export function Sidebar({
  isCollapsed,
  onToggle,
}: Readonly<SidebarProps>) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const deleteTag = useDeleteTag()
  const deleteProject = useDeleteProject()
  const [editingTag, setEditingTag] = useState<TagType | undefined>()
  const [editingProject, setEditingProject] = useState<ProjectType | undefined>()
  const [deletingItem, setDeletingItem] = useState<{ type: "project" | "tag"; id: number; name: string } | null>(null)
  const { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId,
    setSelectedPriorities,
  } = useFilters()

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    
    try {
      if (deletingItem.type === "project") {
        await deleteProject.mutateAsync(deletingItem.id)
        if (activeSidebarFilter === `project:${deletingItem.id}`) {
          setActiveSidebarFilter("all")
        }
      } else {
        await deleteTag.mutateAsync(deletingItem.id)
        if (activeTagId === deletingItem.id) {
          setActiveTagId(null)
          setActiveSidebarFilter("all")
        }
      }
      toast({
        title: "Deleted",
        description: `${deletingItem.type === "project" ? "Project" : "Tag"} deleted successfully`,
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    } finally {
      setDeletingItem(null)
    }
  }
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const reorderProjects = useReorderProjects()
  const reorderTags = useReorderTags()

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false)
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false)
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const navLinks = [
    { id: "dashboard", path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", path: "/tasks", label: "Tasks", icon: ListChecks },
    { id: "history", path: "/audit-logs", label: "Activity", icon: Clock },
  ]

  const smartLinks = [
    { id: "inbox", label: "Inbox", icon: Inbox, filter: "inbox" },
    { id: "today", label: "Today", icon: Calendar, filter: "today" },
    { id: "upcoming", label: "Next 7 Days", icon: CalendarRange, filter: "upcoming" },
  ]

  const clearHubFilters = () => {
    setSelectedPriorities([])
  }

  const handleSidebarFilterClick = (filter: string) => {
    if (activeSidebarFilter === filter) {
      setActiveSidebarFilter("all")
    } else {
      setActiveSidebarFilter(filter)
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }

  const handleProjectClick = (projectId: number) => {
    const filterId = `project:${projectId}`
    if (activeSidebarFilter === filterId && activeTagId === null) {
      setActiveSidebarFilter("all")
    } else {
      setActiveSidebarFilter(filterId)
      setActiveTagId(null)
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }

  const handleTagClick = (tagId: number) => {
    if (activeTagId === tagId) {
      setActiveTagId(null)
    } else {
      setActiveTagId(tagId)
      setActiveSidebarFilter("all")
      clearHubFilters()
    }
    if (location.pathname !== "/tasks") navigate("/tasks")
  }

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id)
      const newIndex = projects.findIndex((p) => p.id === over.id)
      const newOrder = arrayMove(projects, oldIndex, newIndex)
      reorderProjects.mutate(newOrder.map((p) => p.id))
    }
  }

  const handleTagDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((t) => t.id === active.id)
      const newIndex = tags.findIndex((t) => t.id === over.id)
      const newOrder = arrayMove(tags, oldIndex, newIndex)
      reorderTags.mutate(newOrder.map((t) => t.id))
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 96 : 320 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden min-h-svh flex-col border-r border-white/5 bg-background/60 px-4 py-8 backdrop-blur-3xl md:flex shadow-[20px_0_50px_-20px_rgba(0,0,0,0.4)] group/sidebar z-50"
    >
      {/* Branding Section */}
      <div className={cn(
        "mb-12 flex items-center justify-between gap-4 px-2 relative min-h-[48px]",
        isCollapsed && "flex-col justify-center items-center gap-6"
      )}>
        <div className={cn("flex items-center gap-4 overflow-hidden", isCollapsed && "justify-center px-0")}>
          <motion.div 
            animate={{ 
              opacity: 1,
              scale: isCollapsed ? 0.9 : 1,
              x: 0
            }}
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-2xl shadow-primary/30"
          >
            <CheckSquare2 className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col whitespace-nowrap"
            >
              <h1 className="font-heading text-2xl font-black tracking-tighter text-foreground uppercase leading-none">
                Task Buddy
              </h1>
              <p className="text-[10px] font-black tracking-[0.4em] text-accent/80 uppercase mt-1">
                Elite Productivity
              </p>
            </motion.div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            "z-50 flex items-center justify-center rounded-xl border transition-all duration-500 cursor-pointer shadow-2xl backdrop-blur-xl",
            isCollapsed 
              ? "relative bg-primary text-primary-foreground border-none shadow-primary/40 mt-4 h-12 w-12" 
              : "absolute -right-4 top-2 h-10 w-10 bg-background/95 border-primary/20 text-primary hover:border-primary/50 hover:bg-primary/10 hover:shadow-primary/20"
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-5 w-5" />}
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar pr-1">
        {/* Smart Lists */}
        <div className="space-y-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4">
              <ListChecks className="h-3 w-3 text-accent/60" />
              <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
                Smart Lists
              </p>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {smartLinks.map(({ label, icon: Icon, id, filter }) => {
              const isActive = activeSidebarFilter === filter
              const content = (
                <button
                  key={id}
                  onClick={() => handleSidebarFilterClick(filter)}
                  className={cn(
                    "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-12 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary" : "text-foreground/50"
                    )}
                  />
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && isActive && (
                    <motion.div 
                      layoutId="smart-active-indicator"
                      className="absolute right-4 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" 
                    />
                  )}
                </button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={id} delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return content
            })}
          </nav>
        </div>

        {/* Workspaces */}
        <div className="space-y-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4">
              <LayoutDashboard className="h-3 w-3 text-accent/60" />
              <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
                Workspaces
              </p>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ path, label, icon: Icon, id }) => {
              const isActive = location.pathname === path
              const content = (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  className={cn(
                    "group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300",
                    isCollapsed
                      ? "mx-auto w-12 justify-center"
                      : "w-full justify-start gap-4",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary-rgb),0.4)]"
                      : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-foreground/50"
                    )}
                  />
                  {!isCollapsed && <span>{label}</span>}
                </button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={id} delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return content
            })}
          </nav>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-center justify-between px-4 group/header select-none",
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <button 
                onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                className="flex items-center gap-2 cursor-pointer flex-1 text-left"
              >
                <ChevronDown 
                  className={cn(
                    "h-3 w-3 text-accent/40 transition-transform duration-300",
                    isProjectsCollapsed && "-rotate-90"
                  )} 
                />
                <Layers className="h-3 w-3 text-accent/60" />
                <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
                  Projects
                </p>
              </button>
            )}
            {isCollapsed ? (
              <Layers className="h-4 w-4 text-foreground/20" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCreateProjectModalOpen(true)
                }}
                className="p-1 rounded-md hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {(!isProjectsCollapsed || isCollapsed) && (
              <motion.div
                initial={isCollapsed ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleProjectDragEnd}
                >
                  <SortableContext
                    items={projects.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {projects.length === 0 && !isCollapsed && (
                        <div className="px-4 py-6 rounded-2xl border border-dashed border-border/50 bg-white/5 text-center mx-4">
                          <p className="text-[10px] font-bold text-foreground/40 uppercase">No Projects</p>
                        </div>
                      )}
                      {projects.map((project) => {
                        const filterId = `project:${project.id}`
                        const isActive = activeSidebarFilter === filterId && activeTagId === null
                        const ProjectIcon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[project.icon || "Layers"] || LucideIcons.Layers
                        const content = (
                          <SortableSidebarItem
                            key={project.id}
                            id={project.id}
                            handle={!isCollapsed && <GripHandle className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                          >
                            <motion.div
                              role="button"
                              tabIndex={0}
                              onClick={() => handleProjectClick(project.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  handleProjectClick(project.id)
                                }
                              }}
                              whileHover={{ x: isCollapsed ? 0 : 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "group/item flex items-center rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-300 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary",
                                isCollapsed
                                  ? "mx-auto w-14 justify-center"
                                  : "w-full justify-between",
                                isActive
                                  ? "bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xl"
                                  : "text-foreground/50 hover:text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div 
                                  className={cn(
                                    "h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg",
                                    isActive ? "scale-110" : "opacity-40 group-hover:opacity-100 group-hover:scale-110"
                                  )}
                                  style={{ backgroundColor: project.color || "gray" }}
                                >
                                  <ProjectIcon className="h-3.5 w-3.5 text-white" />
                                </div>
                                {!isCollapsed && <span className="truncate max-w-[140px]">{project.name}</span>}
                              </div>
                              {!isCollapsed && (
                                <div className="flex items-center gap-1">
                                  {isActive && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow shadow-primary/50 mr-2" />
                                  )}
                                  <SidebarItemActions
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    onEdit={() => {
                                      setEditingProject(project)
                                      setIsCreateProjectModalOpen(true)
                                    }}
                                    onDelete={() => {
                                      setDeletingItem({ type: "project", id: project.id, name: project.name })
                                    }}
                                  />
                                </div>
                              )}
                            </motion.div>
                          </SortableSidebarItem>
                        )

                        if (isCollapsed) {
                          return (
                            <Tooltip key={project.id} delayDuration={0}>
                              <TooltipTrigger asChild>{content}</TooltipTrigger>
                              <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
                                {project.name}
                              </TooltipContent>
                            </Tooltip>
                          )
                        }
                        return content
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
          <div 
            className={cn(
              "flex items-center justify-between px-4 group/header select-none", 
              isCollapsed && "justify-center"
            )}
          >
            {!isCollapsed && (
              <button 
                onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
                className="flex items-center gap-2 cursor-pointer flex-1 text-left"
              >
                <ChevronDown 
                  className={cn(
                    "h-3 w-3 text-accent/40 transition-transform duration-300",
                    isTagsCollapsed && "-rotate-90"
                  )} 
                />
                <Tag className="h-3 w-3 text-accent/60" />
                <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">
                  Focus Tags
                </p>
              </button>
            )}
            {isCollapsed ? (
              <Tag className="h-4 w-4 text-foreground/20" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCreateTagModalOpen(true)
                }}
                className="p-1 rounded-md hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {(!isTagsCollapsed || isCollapsed) && (
              <motion.div
                initial={isCollapsed ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 px-2">
                  {tags.length === 0 && !isCollapsed && (
                    <div className="px-4 py-4 rounded-xl border border-dashed border-border/30 bg-white/5 text-center mx-2">
                      <p className="text-[10px] font-bold text-foreground/20 uppercase">No Tags</p>
                    </div>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleTagDragEnd}
                  >
                    <SortableContext
                      items={tags.map((t) => t.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className={cn("flex flex-wrap gap-2", isCollapsed && "flex-col items-center")}>
                        {tags.map((tag) => {
                          const isActive = activeTagId === tag.id
                          const TagIconComp = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[tag.icon || "Tag"] || LucideIcons.Tag

                          const content = (
                            <SortableSidebarItem
                              key={tag.id}
                              id={tag.id}
                              handle={!isCollapsed && <GripHandle className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                  "group/item flex items-center rounded-full transition-all shadow-sm outline-none",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                                    : "bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground",
                                  isCollapsed && "p-2"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleTagClick(tag.id)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full",
                                    !isCollapsed && "pr-1.5"
                                  )}
                                >
                                  <TagIconComp className="h-3.5 w-3.5" style={{ color: isActive ? "inherit" : tag.color || "gray" }} />
                                  <div 
                                    className="h-1 w-1 rounded-full shadow-[0_0_5px_currentColor]" 
                                    style={{ backgroundColor: tag.color || "gray", color: tag.color || "gray" }} 
                                  />
                                  {!isCollapsed && <span>{tag.name}</span>}
                                </button>

                                {!isCollapsed && (
                                  <SidebarItemActions
                                    className="opacity-0 group-hover:opacity-100 transition-opacity mr-3"
                                    onEdit={() => {
                                      setEditingTag(tag)
                                      setIsCreateTagModalOpen(true)
                                    }}
                                    onDelete={() => {
                                      setDeletingItem({ type: "tag", id: tag.id, name: tag.name })
                                    }}
                                  />
                                )}
                              </motion.div>
                            </SortableSidebarItem>
                          )

                          if (isCollapsed) {
                            return (
                              <Tooltip key={tag.id} delayDuration={0}>
                                <TooltipTrigger asChild>{content}</TooltipTrigger>
                                <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-2xl">
                                  {tag.name}
                                </TooltipContent>
                              </Tooltip>
                            )
                          }

                          return content
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <CreateProjectModal 
        key={isCreateProjectModalOpen ? `project-modal-${editingProject?.id ?? "new"}` : "project-modal-closed"}
        open={isCreateProjectModalOpen} 
        onOpenChange={(open) => {
          setIsCreateProjectModalOpen(open)
          if (!open) setEditingProject(undefined)
        }}
        project={editingProject}
      />
      <CreateTagModal
        key={isCreateTagModalOpen ? `tag-modal-${editingTag?.id ?? "new"}` : "tag-modal-closed"}
        open={isCreateTagModalOpen}
        onOpenChange={(open) => {
          setIsCreateTagModalOpen(open)
          if (!open) setEditingTag(undefined)
        }}
        tag={editingTag}
      />

      <DeleteConfirmationModal
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deletingItem?.type === "project" ? "Project" : "Tag"}`}
        description={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        isLoading={deleteProject.isPending || deleteTag.isPending}
      />
    </motion.aside>
  )
}
