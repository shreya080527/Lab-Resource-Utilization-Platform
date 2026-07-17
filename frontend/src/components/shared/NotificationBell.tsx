import * as React from "react";
import { Bell, Check, CheckCheck, X, Clock, CalendarCheck, CalendarX, AlertCircle, Microscope, Wrench } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { notificationApi } from "@/lib/api/notificationApi";
import { useAsync } from "@/hooks/use-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppNotification, NotificationType } from "@/types";

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  BOOKING_APPROVED: CalendarCheck,
  BOOKING_REJECTED: CalendarX,
  BOOKING_CANCELLED: CalendarX,
  BOOKING_REMINDER: Bell,
  WAITLIST_PROMOTED: Microscope,
  EQUIPMENT_AVAILABLE: Microscope,
  NEW_BOOKING_REQUEST: Microscope,
  MAINTENANCE_DUE: Wrench,
  CALIBRATION_DUE: Wrench,
  SYSTEM_ANNOUNCEMENT: AlertCircle,
};

const notificationColors: Record<NotificationType, string> = {
  BOOKING_APPROVED: "text-emerald-500 bg-emerald-500/10",
  BOOKING_REJECTED: "text-rose-500 bg-rose-500/10",
  BOOKING_CANCELLED: "text-zinc-500 bg-zinc-500/10",
  BOOKING_REMINDER: "text-amber-500 bg-amber-500/10",
  WAITLIST_PROMOTED: "text-violet-500 bg-violet-500/10",
  EQUIPMENT_AVAILABLE: "text-cyan-500 bg-cyan-500/10",
  NEW_BOOKING_REQUEST: "text-blue-500 bg-blue-500/10",
  MAINTENANCE_DUE: "text-orange-500 bg-orange-500/10",
  CALIBRATION_DUE: "text-orange-500 bg-orange-500/10",
  SYSTEM_ANNOUNCEMENT: "text-purple-500 bg-purple-500/10",
};

function formatTimeAgo(isoString: string): string {
  try {
    const date = parseISO(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, "MMM d");
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  
  const notificationsAsync = useAsync<AppNotification[]>(
    () => notificationApi.list(),
    [],
  );
  
  const unreadCountAsync = useAsync<{ count: number }>(
    () => notificationApi.unreadCount(),
    [],
  );

  const unreadCount = unreadCountAsync.data?.count ?? 0;
  const notifications = notificationsAsync.data ?? [];

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      notificationsAsync.refetch();
      unreadCountAsync.refetch();
    } catch (e) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      notificationsAsync.refetch();
      unreadCountAsync.refetch();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  React.useEffect(() => {
    if (open) {
      notificationsAsync.refetch();
      unreadCountAsync.refetch();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        
        {notificationsAsync.loading && !notifications.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted";
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      !notification.isRead && "bg-primary/5"
                    )}
                  >
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", colorClass)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium", !notification.isRead && "text-foreground")}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                              aria-label="Mark as read"
                            >
                              <Check className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
