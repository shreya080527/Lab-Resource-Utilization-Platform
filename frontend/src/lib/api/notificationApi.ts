import { api, unwrap } from "./client";
import type { AppNotification } from "@/types";

export const notificationApi = {
  list: () =>
    api.get<AppNotification[]>("/api/notifications").then(unwrap),
  
  unread: () =>
    api.get<AppNotification[]>("/api/notifications/unread").then(unwrap),
  
  unreadCount: () =>
    api.get<{ count: number }>("/api/notifications/unread-count").then(unwrap),
  
  markAsRead: (id: number) =>
    api.put<{ message: string }>(`/api/notifications/${id}/read`).then(unwrap),
  
  markAllAsRead: () =>
    api.put<{ message: string }>("/api/notifications/read-all").then(unwrap),
};
