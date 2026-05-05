import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCard } from "@/components/task-card"
import { AuditTrail } from "@/components/audit-trail"
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"
import { NewTaskModal } from "@/components/new-task-modal"

type TaskStatus = "all" | "pending" | "completed"

export function Dashboard() {
  const { tasks: allTasks, loading, error } = useTasks()
  const { createTask, loading: isCreating } = useCreateTask()
  const { updateTask } = useUpdateTask()
  const { deleteTask } = useDeleteTask()

  const [activeTab, setActiveTab] = useState<TaskStatus>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter tasks based on active tab
  const filteredTasks = allTasks.filter((task) => {
    if (activeTab !== "all" && task.status !== activeTab) {
      return false
    }
    return true
  })

  const handleToggleComplete = useCallback(
    async (id: string) => {
      const task = allTasks.find((t: Task) => t.id === id)
      if (!task) return

      try {
        await updateTask(id, {
          status: task.status === "completed" ? "pending" : "completed",
        })
      } catch (err) {
        console.error("Failed to update task:", err)
      }
    },
    [allTasks, updateTask]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id)
      } catch (err) {
        console.error("Failed to delete task:", err)
      }
    },
    [deleteTask]
  )

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createTask(taskData)
    } catch (err) {
      console.error("Failed to create task:", err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col gap-6 bg-[#F1F5F9] p-6"
    >
      {/* Primary: Audit Trail */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <AuditTrail />
      </motion.div>

      {/* Secondary: Task Management */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TaskStatus)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 border border-[#EDE9E6] bg-[#FFFFFF]">
            <TabsTrigger
              value="all"
              className="text-xs font-semibold tracking-widest data-[state=active]:bg-[#0F172A] data-[state=active]:text-white"
            >
              ALL
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="text-xs font-semibold tracking-widest data-[state=active]:bg-[#0F172A] data-[state=active]:text-white"
            >
              PENDING
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-xs font-semibold tracking-widest data-[state=active]:bg-[#0F172A] data-[state=active]:text-white"
            >
              COMPLETED
            </TabsTrigger>
          </TabsList>

          {(["all", "pending", "completed"] as const).map((status) => (
            <TabsContent
              key={status}
              value={status}
              className="mt-4 space-y-3"
            >
              {loading ? (
                <div className="flex h-40 items-center justify-center text-sm text-[#0F172A]/50">
                  Loading tasks...
                </div>
              ) : error ? (
                <div className="flex h-40 items-center justify-center text-sm text-red-500">
                  Failed to load tasks
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-[#0F172A]/50">
                  No tasks found
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task: Task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDelete}
                        onEdit={() => {}}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Modal */}
      <NewTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateTask}
        isLoading={isCreating}
      />
    </motion.div>
  )
}

