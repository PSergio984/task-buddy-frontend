import type { Notification, NotificationType } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Trash2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMarkRead, useDeleteNotification } from "@/hooks/useNotifications"
import { Button } from "@/components/ui/button"

interface NotificationItemProps {
  readonly notification: Notification
}

const iconMap: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  TASK_DUE: { icon: Clock, color: "text-blue-500" },
  REMINDER_BEFORE: { icon: Clock, color: "text-blue-500" },
  REMINDER_DUE: { icon: AlertCircle, color: "text-amber-500" },
  REMINDER_OVERDUE: { icon: AlertTriangle, color: "text-red-500" },
  TASK_OVERDUE: { icon: AlertTriangle, color: "text-red-500" },
  SYSTEM: { icon: Info, color: "text-indigo-500" },
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { icon: Icon, color } = iconMap[notification.type] || iconMap.SYSTEM
  const markRead = useMarkRead()
  const deleteNotification = useDeleteNotification()

  return (
    <div
      className={cn(
        "group flex w-full gap-3 border-b border-border/50 p-4 text-left last:border-0",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-1 flex-shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              !notification.is_read && "text-foreground"
            )}
          >
            {notification.title}
          </p>
          <div className="flex items-center gap-1">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => markRead.mutate(notification.id)}
                title="Mark as read"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => deleteNotification.mutate(notification.id)}
              title="Delete notification"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            {!notification.is_read && (
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            )}
          </div>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  )
}
