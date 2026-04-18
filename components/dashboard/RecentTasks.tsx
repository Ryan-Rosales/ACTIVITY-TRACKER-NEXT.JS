"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils/dateHelpers";
import { Badge } from "@/components/ui/Badge";
import { useThemeStore } from "@/lib/store/useThemeStore";

const toBadge = (status: Task["status"]) =>
  ({ pending: "amber", ongoing: "blue", completed: "green", archived: "purple" })[status] as
    | "amber"
    | "blue"
    | "green"
    | "purple";

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-xl ${isLight ? "border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "border-white/20 bg-white/10"}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>Recent Tasks</h3>
        <Link href="/tasks" className={`text-xs ${isLight ? "text-violet-700 hover:text-violet-800" : "text-violet-300 hover:text-violet-200"}`}>
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 5).map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
              isLight ? "border-slate-200 bg-slate-50/90" : "border-white/10 bg-black/10"
            }`}
          >
            <span className={`size-2 rounded-full ${isLight ? "bg-violet-500" : "bg-violet-400"}`} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{task.title}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{formatDate(task.createdAt)}</p>
            </div>
            <Badge label={task.status} color={toBadge(task.status)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
