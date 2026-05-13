import { Bell } from "lucide-react"
import { useNotifications, useMarkAllRead } from "@/hooks/useNotifications"
import { NotificationItem } from "./notification-item"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications({ limit: 20 })
  const markAllRead = useMarkAllRead()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-all active:scale-95">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in fade-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl rounded-[2rem] border-primary/10 backdrop-blur-3xl bg-background/98 overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b border-border/50">
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
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground/40">No notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
