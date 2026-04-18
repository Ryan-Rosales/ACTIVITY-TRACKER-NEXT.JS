import { endOfWeek, isWithinInterval, startOfWeek, subWeeks } from "date-fns";
import { Task, TaskStatus } from "@/lib/types";

export const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  ongoing: "Ongoing",
  completed: "Completed",
  archived: "Archived",
};

export const statusColorClass: Record<TaskStatus, string> = {
  pending: "border-amber-400",
  ongoing: "border-blue-400",
  completed: "border-emerald-400",
  archived: "border-violet-400",
};

export const priorityColorClass: Record<Task["priority"], string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  high: "bg-red-500/15 text-red-300 border-red-400/30",
};

export const getTaskCounts = (tasks: Task[]) => ({
  pending: tasks.filter((task) => task.status === "pending").length,
  ongoing: tasks.filter((task) => task.status === "ongoing").length,
  completed: tasks.filter((task) => task.status === "completed").length,
  archived: tasks.filter((task) => task.status === "archived").length,
});

export const getCompletionStats = (tasks: Task[]) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const thisWeek = tasks.filter((t) =>
    isWithinInterval(new Date(t.createdAt), { start: weekStart, end: weekEnd }),
  );
  const prevWeek = tasks.filter((t) =>
    isWithinInterval(new Date(t.createdAt), { start: prevStart, end: prevEnd }),
  );

  const completedThisWeek = thisWeek.filter((t) => t.status === "completed").length;
  const completedPrevWeek = prevWeek.filter((t) => t.status === "completed").length;

  const delta = completedPrevWeek
    ? ((completedThisWeek - completedPrevWeek) / completedPrevWeek) * 100
    : completedThisWeek > 0
      ? 100
      : 0;

  return {
    totalThisWeek: thisWeek.length,
    completedThisWeek,
    completionRate: thisWeek.length ? Math.round((completedThisWeek / thisWeek.length) * 100) : 0,
    delta,
  };
};
