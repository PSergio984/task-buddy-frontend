import { Bell } from "lucide-react"
import { useNotifications, useMarkAllRead } from "@/hooks/useNotifications"
import { NotificationItem } from "./notification-item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications({ limit: 20 })
  const markAllRead = useMarkAllRead()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full transition-all hover:bg-muted/50 active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] animate-in items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background fade-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 overflow-hidden rounded-[2rem] border-primary/10 bg-background/98 p-0 shadow-2xl backdrop-blur-3xl"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <h4 className="text-sm font-bold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80"
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="custom-scrollbar max-h-[400px] overflow-x-hidden overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground/40">
                No notifications
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
