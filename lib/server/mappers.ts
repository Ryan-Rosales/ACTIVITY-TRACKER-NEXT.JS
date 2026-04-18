import { Notification, Task } from "@/lib/types";

export type TaskRow = {
  id: string;
  owner_email: string;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  category: string | null;
  due_date: string | null;
  completed_at: string | null;
  archived_at: string | null;
  subtasks: Task["subtasks"] | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  owner_email: string;
  type: Notification["type"];
  message: string;
  task_id: string | null;
  task_title: string | null;
  read: boolean;
  timestamp: string;
};

export type SettingsRow = {
  owner_email: string;
  display_name: string;
  email: string;
  avatar: string | null;
  theme_mode: "system" | "light" | "dark";
  sidebar_collapsed: boolean;
  accent: "violet" | "teal" | "sunset" | "emerald" | "rose";
  overdue_alerts: boolean;
  ai_reminders: boolean;
  weekly_summary: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export const mapTaskRow = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  status: row.status,
  priority: row.priority,
  category: row.category ?? undefined,
  dueDate: row.due_date ? new Date(row.due_date) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  subtasks: row.subtasks ?? undefined,
});

export const mapNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type,
  message: row.message,
  taskId: row.task_id ?? undefined,
  taskTitle: row.task_title ?? undefined,
  timestamp: new Date(row.timestamp),
  read: row.read,
});

export const mapSettingsRow = (row: SettingsRow) => ({
  ownerEmail: row.owner_email,
  displayName: row.display_name,
  email: row.email,
  avatar: row.avatar ?? undefined,
  themeMode: row.theme_mode,
  sidebarCollapsed: row.sidebar_collapsed,
  accent: row.accent,
  overdueAlerts: row.overdue_alerts,
  aiReminders: row.ai_reminders,
  weeklySummary: row.weekly_summary,
  twoFactorEnabled: row.two_factor_enabled,
});
