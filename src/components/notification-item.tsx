import type { Notification, NotificationType } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { Clock, AlertCircle, AlertTriangle, Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMarkRead } from "@/hooks/useNotifications"
import { useNavigate } from "react-router-dom"

interface NotificationItemProps {
  readonly notification: Notification
}

const iconMap: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  TASK_DUE: { icon: Clock, color: "text-blue-500" },
  REMINDER_DUE: { icon: AlertCircle, color: "text-amber-500" },
  REMINDER_OVERDUE: { icon: AlertTriangle, color: "text-red-500" },
  TASK_OVERDUE: { icon: AlertTriangle, color: "text-red-500" },
  SYSTEM: { icon: Info, color: "text-indigo-500" },
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { icon: Icon, color } = iconMap[notification.type] || iconMap.SYSTEM
  const markRead = useMarkRead()
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id)
    }
    if (notification.action_url) {
      // Navigate to the action URL if it exists
      navigate(notification.action_url)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full text-left gap-3 p-4 transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-1 flex-shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-semibold truncate", !notification.read && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </button>
  )
}
