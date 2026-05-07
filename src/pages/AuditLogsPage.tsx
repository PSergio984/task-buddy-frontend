import { motion } from "framer-motion"
import { TopNav } from "@/components/topnav"
import { Sidebar } from "@/components/sidebar"
import { AuditTrail } from "@/components/audit-trail"
import { useTasks } from "@/hooks/useApi"
import { useNavigate } from "react-router-dom"
import { History, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AuditLogsPage() {
  useTasks()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background selection:bg-accent/20">
      <TopNav onNewTask={() => navigate("/dashboard")} />
      
      <div className="flex flex-1">
        <Sidebar activeFilter="" onFilterChange={() => navigate("/dashboard")} />
        
        <main className="flex-1 p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-5xl space-y-10"
          >
            <header className="space-y-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <History className="h-5 w-5" />
                  </div>
                  <h1 className="font-heading text-4xl font-bold tracking-tight">Security Audit</h1>
                </div>
              </div>
              <p className="text-muted-foreground ml-14">
                Monitor and review all activities across your Task Buddy account.
              </p>
            </header>

            <div className="overflow-hidden rounded-[2rem] border bg-background/50 shadow-2xl shadow-primary/5 backdrop-blur-xl">
               <div className="p-8 h-[700px] overflow-y-auto">
                 <AuditTrail hideCard limit={20} />
               </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
