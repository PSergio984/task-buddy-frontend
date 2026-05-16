import { motion, AnimatePresence } from "framer-motion"
import { Layers, ChevronDown, Plus } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { 
  DndContext, 
  closestCenter, 
  type SensorDescriptor, 
  type SensorOptions,
  type DragEndEvent
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SortableSidebarItem } from "./sortable-item"
import { GripHandle } from "./grip-handle"
import { SidebarItemActions } from "./item-actions"
import type { Project } from "@/lib/api"

interface ProjectsSectionProps {
  readonly isCollapsed: boolean
  readonly isProjectsCollapsed: boolean
  readonly onToggleCollapse: () => void
  readonly onAddProject: () => void
  readonly projects: Project[]
  readonly sensors: SensorDescriptor<SensorOptions>[]
  readonly onDragEnd: (event: DragEndEvent) => void
  readonly activeSidebarFilter: string
  readonly activeTagId: number | null
  readonly onProjectClick: (id: number) => void
  readonly onEditProject: (project: Project) => void
  readonly onDeleteProject: (project: Project) => void
}

export function ProjectsSection({
  isCollapsed,
  isProjectsCollapsed,
  onToggleCollapse,
  onAddProject,
  projects,
  sensors,
  onDragEnd,
  activeSidebarFilter,
  activeTagId,
  onProjectClick,
  onEditProject,
  onDeleteProject,
}: ProjectsSectionProps) {
  return (
    <div className="space-y-4">
      <div className={cn("flex items-center justify-between px-4 group/header select-none", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <button 
            onClick={onToggleCollapse}
            className="flex items-center gap-2 cursor-pointer flex-1 text-left"
          >
            <ChevronDown className={cn("h-3 w-3 text-accent/40 transition-transform duration-300", isProjectsCollapsed && "-rotate-90")} />
            <Layers className="h-3 w-3 text-accent/60" />
            <p className="text-[10px] font-bold tracking-[0.3em] text-accent/80 uppercase">Projects</p>
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
              onAddProject()
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
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
                      <SortableSidebarItem key={project.id} id={project.id} handle={!isCollapsed && <GripHandle className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
                        <motion.div
                          role="button"
                          tabIndex={0}
                          onClick={() => onProjectClick(project.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onProjectClick(project.id)
                            }
                          }}
                          whileHover={{ x: isCollapsed ? 0 : 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "group/item flex items-center rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-300 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary",
                            isCollapsed ? "mx-auto w-14 justify-center" : "w-full justify-between",
                            isActive ? "bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xl" : "text-foreground/50 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className={cn("h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg", isActive ? "scale-110" : "opacity-40 group-hover:opacity-100 group-hover:scale-110")}
                              style={{ backgroundColor: project.color || "gray" }}
                            >
                              <ProjectIcon className="h-3.5 w-3.5 text-white" />
                            </div>
                            {!isCollapsed && <span className="truncate max-w-[140px]">{project.name}</span>}
                          </div>
                          {!isCollapsed && (
                            <div className="flex items-center gap-1">
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow shadow-primary/50 mr-2" />}
                              <SidebarItemActions
                                className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                                onEdit={() => onEditProject(project)}
                                onDelete={() => onDeleteProject(project)}
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
  )
}
