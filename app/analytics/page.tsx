"use client";

import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { CompletionDonut } from "@/components/analytics/CompletionDonut";
import { WeeklyBarChart } from "@/components/analytics/WeeklyBarChart";
import { StatSummary } from "@/components/analytics/StatSummary";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { getCompletionStats } from "@/lib/utils/taskHelpers";

export default function AnalyticsPage() {
  const tasks = useTaskStore((state) => state.tasks);

  const stats = getCompletionStats(tasks);

  const week = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  }).map((day) => ({
    day: format(day, "EEE"),
    completed: tasks.filter(
      (task) =>
        task.status === "completed" &&
        task.completedAt &&
        format(new Date(task.completedAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
    ).length,
  }));

  const completed = tasks.filter((task) => task.status === "completed").length;
  const remaining = tasks.filter((task) => task.status !== "completed" && task.status !== "archived").length;

  const completionDurations = tasks
    .filter((task) => task.completedAt)
    .map((task) => (new Date(task.completedAt!).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60));
  const avgHours = completionDurations.length
    ? completionDurations.reduce((sum, value) => sum + value, 0) / completionDurations.length
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <StatSummary total={stats.totalThisWeek} delta={stats.delta} avgHours={avgHours} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CompletionDonut completed={completed} remaining={remaining} />
        <WeeklyBarChart data={week} />
      </div>
    </motion.div>
  );
}
