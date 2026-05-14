import { useNotifications } from "@/hooks/useNotifications"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Global component that watches for new high-priority notifications 
 * and triggers toasts. It uses the polling logic within useNotifications.
 */
export function NotificationWatcher() {
  const { user } = useAuth()
  
  // Only activate the watcher if the user is logged in AND confirmed
  if (!user || user.email_confirmed === false) return null

  return <WatcherInner />
}

function WatcherInner() {
  // useNotifications hook has the side-effect of triggering toasts for new high-priority items
  useNotifications({ limit: 5 })
  
  return null
}
