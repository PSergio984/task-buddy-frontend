import { motion } from "framer-motion"
import { useOutletContext } from "react-router-dom"
import type { Task } from "@/models/task.model"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { TasksHeader } from "./tasks/TasksHeader"
import { TaskList } from "./tasks/TaskList"
import { useTasksViewModel } from "@/viewmodels/useTasksViewModel"

interface LayoutContext {
  handleEditTask: (task: Task) => void
  onNewTask: () => void
}

export function TasksPage() {
  const { handleEditTask } = useOutletContext<LayoutContext>()
  const vm = useTasksViewModel()

  return (
    <>
      <ConfirmationModal
        open={!!vm.confirmData}
        onOpenChange={(open) => !open && vm.closeConfirmModal()}
        onConfirm={vm.handleConfirmAction}
        title={
          vm.confirmData?.type === "task"
            ? "Mission Accomplished?"
            : vm.confirmData?.type === "detach_tag"
              ? "Remove Tag?"
              : vm.confirmData?.type === "delete_subtask"
                ? "Delete Subtask?"
                : "Sub-objective Complete?"
        }
        description={
          vm.confirmData?.type === "detach_tag"
            ? `Are you sure you want to remove the tag "${vm.confirmData?.title}"?`
            : vm.confirmData?.type === "delete_subtask"
              ? `Are you sure you want to delete the subtask "${vm.confirmData?.title}"? This action cannot be undone.`
              : `Confirm completion of: "${vm.confirmData?.title}"`
        }
        confirmText={
          vm.confirmData?.type === "detach_tag"
            ? "Remove Tag"
            : vm.confirmData?.type === "delete_subtask"
              ? "Delete Subtask"
              : "Mark Finished"
        }
        variant={
          vm.confirmData?.type === "detach_tag" ||
          vm.confirmData?.type === "delete_subtask"
            ? "destructive"
            : "success"
        }
        showDontShowAgain={true}
        dontShowAgainLabel={
          vm.confirmData?.type === "detach_tag"
            ? "Don't ask again for tag removal"
            : vm.confirmData?.type === "delete_subtask"
              ? "Don't ask again for subtask deletion"
              : "Don't ask again for completion"
        }
        isLoading={vm.isCompleting}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col gap-10 bg-background/20 p-4 backdrop-blur-3xl md:p-8 lg:p-12"
      >
        <header className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-primary">
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
                >
                  {vm.activeSidebarFilter === "all"
                    ? "All Tasks"
                    : vm.activeProject?.name ||
                      vm.activeSidebarFilter.replace("project:", "").toUpperCase()}
                </Badge>
                {vm.activeTag && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-accent/10 px-4 py-1 text-[10px] font-black tracking-widest text-accent uppercase"
                  >
                    Focus: {vm.activeTag.name}
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
                Tasks
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-2xl">
              <button
                onClick={() => vm.setViewMode("grid")}
                className={`rounded-xl p-3 transition-all ${vm.viewMode === "grid" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-white/5 hover:text-foreground"}`}
              >
                <span className="sr-only">Grid View</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => vm.setViewMode("list")}
                className={`rounded-xl p-3 transition-all ${vm.viewMode === "list" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-white/5 hover:text-foreground"}`}
              >
                <span className="sr-only">List View</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <TasksHeader
            searchQuery={vm.searchQuery}
            setSearchQuery={vm.setSearchQuery}
            isFiltersExpanded={vm.isFiltersExpanded}
            setIsFiltersExpanded={vm.setIsFiltersExpanded}
            selectedPriorities={vm.selectedPriorities}
            togglePriority={vm.togglePriority}
            clearAllFilters={vm.clearAllFilters}
            sortBy={vm.sortBy}
            setSortBy={vm.setSortBy}
            sortLabels={vm.sortLabels}
          />
        </header>

        <Tabs
          value={vm.activeStatus}
          onValueChange={(val: string) =>
            vm.setActiveStatus(val as "all" | "pending" | "completed")
          }
          className="w-full space-y-8"
        >
          <div className="flex flex-col justify-between gap-6 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
            <TabsList className="h-auto gap-4 bg-transparent p-0">
              {(["all", "pending", "completed"] as const).map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-bold tracking-wider text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  <span className="capitalize">{status}</span>
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-black">
                    {status === "all"
                      ? vm.tasks.length
                      : vm.tasks.filter((t) =>
                          status === "completed" ? t.completed : !t.completed
                        ).length}
                  </span>
                  {vm.activeStatus === status && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-primary"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="hidden items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground/40 uppercase sm:flex">
              <span>Result Set:</span>
              <span className="text-foreground">
                {vm.sortedTasks.length} Units
              </span>
            </div>
          </div>

          {(["all", "pending", "completed"] as const).map((status) => (
            <TabsContent
              key={status}
              value={status}
              className="mt-0 outline-none"
            >
              <TaskList
                tasks={vm.sortedTasks}
                loading={vm.loadingTasks}
                viewMode={vm.viewMode}
                onToggleComplete={vm.handleToggleComplete}
                onEdit={handleEditTask}
                onToggleSubtask={vm.handleToggleSubtask}
                onDeleteSubtask={vm.handleDeleteSubtask}
                onDetachTag={vm.handleDetachTag}
              />
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </>
  )
}
