import { differenceInCalendarDays, format, formatDistanceToNowStrict, isBefore, isToday, parseISO, startOfDay } from "date-fns";

export type DueDateStatus = "none" | "upcoming" | "dueSoon" | "dueToday" | "overdue";

export type DueDateState = {
  status: DueDateStatus;
  daysUntilDue: number | null;
  label: string;
};

export const formatDate = (date?: Date | string) => {
  if (!date) return "-";
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "MMM d, yyyy");
};

export const formatDateTime = (date?: Date | string) => {
  if (!date) return "-";
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "MMM d, yyyy • h:mm a");
};

export const relativeTime = (date?: Date | string) => {
  if (!date) return "-";
  const value = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNowStrict(value, { addSuffix: true });
};

export const isOverdue = (dueDate?: Date | string) => {
  if (!dueDate) return false;
  const value = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return isBefore(value, new Date()) && !isToday(value);
};

export const getDueDateState = (dueDate?: Date | string): DueDateState => {
  if (!dueDate) {
    return {
      status: "none",
      daysUntilDue: null,
      label: "No due date set.",
    };
  }

  const value = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  const today = startOfDay(new Date());
  const dueDay = startOfDay(value);
  const daysUntilDue = differenceInCalendarDays(dueDay, today);

  if (isToday(value)) {
    return {
      status: "dueToday",
      daysUntilDue: 0,
      label: "Due today.",
    };
  }

  if (daysUntilDue < 0) {
    const overdueBy = Math.abs(daysUntilDue);
    return {
      status: "overdue",
      daysUntilDue,
      label: overdueBy === 1 ? "Overdue by 1 day." : `Overdue by ${overdueBy} days.`,
    };
  }

  if (daysUntilDue <= 3) {
    return {
      status: "dueSoon",
      daysUntilDue,
      label: daysUntilDue === 1 ? "Due in 1 day." : `Due in ${daysUntilDue} days.`,
    };
  }

  return {
    status: "upcoming",
    daysUntilDue,
    label: `Due in ${daysUntilDue} days.`,
  };
};
