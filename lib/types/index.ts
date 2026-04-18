export type TaskStatus = "pending" | "ongoing" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  archivedAt?: Date;
  subtasks?: Subtask[];
}

export type NotificationType =
  | "due_soon"
  | "due_today"
  | "overdue"
  | "ai_reminder"
  | "update"
  | "profile_saved"
  | "completion"
  | "summary";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: Date;
  read: boolean;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type AIAction =
  | { type: "CREATE_TASK"; task: Partial<Task> }
  | { type: "SUGGEST_SUBTASKS"; taskId: string; subtasks: string[] }
  | { type: "REMIND"; message: string };
