"use client";

import { addDays, isAfter } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Notification, Task } from "@/lib/types";
import { getDueDateState } from "@/lib/utils/dateHelpers";

interface NotificationSettings {
  overdueAlerts: boolean;
  aiReminders: boolean;
  weeklySummary: boolean;
}

const APP_NOTIFICATION_PUSHED_EVENT = "app:notification-pushed";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissNotification: (id: string) => void;
  pushNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  syncTaskNotifications: (tasks: Task[]) => void;
  setSettings: (settings: Partial<NotificationSettings>) => void;
}

const toDate = (value: Date | string | undefined) => (value ? new Date(value) : undefined);

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      settings: {
        overdueAlerts: true,
        aiReminders: true,
        weeklySummary: false,
      },
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((item) => !item.read).length,
        }),
      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          );
          return {
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
          };
        });

        void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAsRead", id }),
        });
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
          unreadCount: 0,
        }));

        void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAllAsRead" }),
        });
      },
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });

        void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clearAll" }),
        });
      },
      dismissNotification: (id) => {
        set((state) => {
          const notifications = state.notifications.filter((item) => item.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
          };
        });

        void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "dismiss", id }),
        });
      },
      pushNotification: (notification) => {
        const createdNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };

        set((state) => {
          const notifications = [createdNotification, ...state.notifications];
          return {
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
          };
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(APP_NOTIFICATION_PUSHED_EVENT, {
              detail: {
                id: createdNotification.id,
                message: createdNotification.message,
                type: createdNotification.type,
              },
            }),
          );
        }
      },
      syncTaskNotifications: (tasks) => {
        const now = new Date();
        const existingMessages = new Set(get().notifications.map((n) => n.message));
        const next: Notification[] = [];

        for (const task of tasks) {
          const dueDate = toDate(task.dueDate);
          const dueState = getDueDateState(dueDate);

          if (dueDate && task.status !== "completed" && task.status !== "archived" && get().settings.overdueAlerts) {
            if (dueState.status === "dueToday") {
              const message = `Task due today: ${task.title}`;
              if (!existingMessages.has(message)) {
                next.push({
                  id: crypto.randomUUID(),
                  type: "due_today",
                  message,
                  taskId: task.id,
                  taskTitle: task.title,
                  timestamp: now,
                  read: false,
                });
                existingMessages.add(message);
              }
            }

            if (dueState.status === "dueSoon") {
              const message = `Task due soon: ${task.title} is due in ${dueState.daysUntilDue} days.`;
              if (!existingMessages.has(message)) {
                next.push({
                  id: crypto.randomUUID(),
                  type: "due_soon",
                  message,
                  taskId: task.id,
                  taskTitle: task.title,
                  timestamp: now,
                  read: false,
                });
                existingMessages.add(message);
              }
            }

            if (dueState.status === "overdue") {
              const message = `Task overdue: ${task.title}`;
              if (!existingMessages.has(message)) {
                next.push({
                  id: crypto.randomUUID(),
                  type: "overdue",
                  message,
                  taskId: task.id,
                  taskTitle: task.title,
                  timestamp: now,
                  read: false,
                });
                existingMessages.add(message);
              }
            }
          }

          const idleDeadline = addDays(new Date(task.updatedAt), 2);
          if (task.status === "ongoing" && isAfter(now, idleDeadline) && get().settings.aiReminders) {
            const message = `AI reminder: ${task.title} has been ongoing for more than 2 days.`;
            if (!existingMessages.has(message)) {
              next.push({
                id: crypto.randomUUID(),
                type: "ai_reminder",
                message,
                taskId: task.id,
                taskTitle: task.title,
                timestamp: now,
                read: false,
              });
              existingMessages.add(message);
            }
          }
        }

        if (!next.length) return;

        set((state) => {
          const notifications = [...next, ...state.notifications].slice(0, 100);
          return {
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
          };
        });
      },
      setSettings: (settings) => {
        set((state) => ({ settings: { ...state.settings, ...settings } }));

        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overdueAlerts: settings.overdueAlerts,
            aiReminders: settings.aiReminders,
            weeklySummary: settings.weeklySummary,
          }),
        });
      },
    }),
    {
      name: "notification-store",
      merge: (persistedState, currentState) => {
        const state = persistedState as NotificationStore | undefined;
        if (!state?.notifications) return currentState;
        const notifications = state.notifications.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        return {
          ...currentState,
          ...state,
          notifications,
          unreadCount: notifications.filter((item) => !item.read).length,
        };
      },
    },
  ),
);
