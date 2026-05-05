import { motion } from "framer-motion"
import { TopNav } from "@/components/topnav"
import { Sidebar } from "@/components/sidebar"
import { AuditTrail } from "@/components/audit-trail"
import { useTasks } from "@/hooks/useApi"
import { useNavigate } from "react-router-dom"

export function AuditLogsPage() {
  const { tasks } = useTasks()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopNav onNewTask={() => navigate("/dashboard")} />
      
      <div className="flex flex-1">
        <Sidebar activeFilter="" onFilterChange={() => navigate("/dashboard")} tasks={tasks} />
        
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl space-y-8"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">Complete history of system activities</p>
            </div>

            <div className="rounded-xl bg-card shadow-sm overflow-hidden border border-border">
               <AuditTrail />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
