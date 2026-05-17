import { motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import {
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { useSidebarActions } from "@/hooks/useSidebarActions"
import {
  LayoutDashboard,
  Clock,
  ListChecks,
  Inbox,
  Calendar,
  CalendarRange,
} from "lucide-react"
import { useState, useMemo } from "react"

import { SidebarBranding } from "./sidebar/branding"
import { SmartListsSection } from "./sidebar/smart-lists"
import { WorkspacesSection } from "./sidebar/workspaces"
import { ProjectsSection } from "./sidebar/projects-section"
import { TagsSection } from "./sidebar/tags-section"
import { CreateProjectModal } from "./create-project-modal"
import { CreateTagModal } from "./create-tag-modal"
import { DeleteProjectModal } from "./delete-project-modal"
import { useTasks } from "@/hooks/useTasks"

export interface SidebarProps {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

export function Sidebar({
  isCollapsed,
  onToggle,
}: Readonly<SidebarProps>) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()

  const {
    editingTag,
    editingProject,
    deletingItem,
    isCreateProjectModalOpen,
    isCreateTagModalOpen,
    handleSidebarFilterClick,
    handleProjectClick,
    handleTagClick,
    handleConfirmDelete,
    handleProjectDragEnd,
    handleTagDragEnd,
    openCreateProjectModal,
    openEditProjectModal,
    openCreateTagModal,
    openEditTagModal,
    openDeleteProjectModal,
    openDeleteTagModal,
    closeCreateProjectModal,
    closeCreateTagModal,
    closeDeleteModal,
    deleteProject,
    deleteTag,
    activeSidebarFilter,
    activeTagId,
  } = useSidebarActions()

  // Fetch task count for the project being deleted
  const { data: projectTasks = [], isLoading: isLoadingTasks } = useTasks(
    undefined, 
    deletingItem?.type === "project" ? deletingItem.id : undefined
  )

  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false)
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const navLinks = useMemo(() => [
    { id: "dashboard", path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", path: "/tasks", label: "Tasks", icon: ListChecks },
    { id: "history", path: "/audit-logs", label: "Activity", icon: Clock },
  ], [])

  const smartLinks = useMemo(() => [
    { id: "inbox", label: "Inbox", icon: Inbox, filter: "inbox" },
    { id: "today", label: "Today", icon: Calendar, filter: "today" },
    { id: "upcoming", label: "Next 7 Days", icon: CalendarRange, filter: "upcoming" },
  ], [])

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 96 : 320 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden min-h-svh flex-col border-r border-sidebar-border bg-sidebar/40 px-4 py-8 backdrop-blur-3xl md:flex shadow-[20px_0_50px_-20px_rgba(0,0,0,0.8)] group/sidebar z-50"
    >
      <SidebarBranding isCollapsed={isCollapsed} onToggle={onToggle} />

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto no-scrollbar pr-1">
        <SmartListsSection 
          isCollapsed={isCollapsed} 
          activeSidebarFilter={activeSidebarFilter} 
          onFilterClick={handleSidebarFilterClick}
          smartLinks={smartLinks}
        />

        <WorkspacesSection 
          isCollapsed={isCollapsed} 
          currentPath={location.pathname} 
          onNavigate={navigate}
          navLinks={navLinks}
        />

        <ProjectsSection 
          isCollapsed={isCollapsed}
          isProjectsCollapsed={isProjectsCollapsed}
          onToggleCollapse={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
          onAddProject={openCreateProjectModal}
          projects={projects}
          sensors={sensors}
          onDragEnd={(e) => handleProjectDragEnd(e, projects)}
          activeSidebarFilter={activeSidebarFilter}
          activeTagId={activeTagId}
          onProjectClick={handleProjectClick}
          onEditProject={openEditProjectModal}
          onDeleteProject={openDeleteProjectModal}
        />

        <TagsSection 
          isCollapsed={isCollapsed}
          isTagsCollapsed={isTagsCollapsed}
          onToggleCollapse={() => setIsTagsCollapsed(!isTagsCollapsed)}
          onAddTag={openCreateTagModal}
          tags={tags}
          sensors={sensors}
          onDragEnd={(e) => handleTagDragEnd(e, tags)}
          activeTagId={activeTagId}
          onTagClick={handleTagClick}
          onEditTag={openEditTagModal}
          onDeleteTag={openDeleteTagModal}
        />
      </div>

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

      <ConfirmationModal
        open={!!deletingItem && deletingItem.type === "tag"}
        onOpenChange={(open) => !open && closeDeleteModal()}
        onConfirm={(dontShowAgain) => handleConfirmDelete(dontShowAgain)}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${deletingItem?.name}"? This will not delete the tasks.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteTag.isPending}
        showDontShowAgain
        dontShowAgainLabel="Don't ask again for tag deletion"
      />

      <DeleteProjectModal
        open={!!deletingItem && deletingItem.type === "project"}
        onOpenChange={(open) => !open && closeDeleteModal()}
        onConfirm={handleConfirmDelete}
        projectName={deletingItem?.name ?? ""}
        taskCount={projectTasks.length}
        isLoadingCount={isLoadingTasks}
        isLoadingDelete={deleteProject.isPending}
      />
    </motion.aside>
  )
}
