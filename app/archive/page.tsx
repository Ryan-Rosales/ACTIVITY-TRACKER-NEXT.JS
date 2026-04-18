"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { formatDate } from "@/lib/utils/dateHelpers";

export default function ArchivePage() {
  const tasks = useTaskStore((state) => state.tasks);
  const moveTask = useTaskStore((state) => state.moveTask);
  const mode = useThemeStore((state) => state.mode);
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const archivedTasks = tasks.filter((task) => task.status === "archived");
    const filtered = archivedTasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));
    return filtered.reduce<Record<string, typeof filtered>>((acc, task) => {
      const key = format(new Date(task.updatedAt), "MMMM yyyy");
      acc[key] = [...(acc[key] ?? []), task];
      return acc;
    }, {});
  }, [search, tasks]);

  const months = Object.keys(grouped);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search archived tasks"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none md:w-80"
      />

      {months.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
          No archived tasks yet.
        </div>
      ) : (
        months.map((month) => (
          <section key={month} className="space-y-2">
            <h3 className="text-sm font-semibold text-violet-300">{month}</h3>
            {grouped[month]?.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <div>
                    <p className="text-sm text-slate-100">{task.title}</p>
                    <p className="text-xs text-slate-400">Completed: {formatDate(task.completedAt ?? task.updatedAt)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => moveTask(task.id, "pending")}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${
                    mode === "light"
                      ? "border-violet-200 bg-violet-100 text-violet-700"
                      : "border-violet-400/30 bg-violet-500/20 text-violet-200"
                  }`}
                >
                  <RotateCcw className="size-3" /> Restore
                </button>
              </div>
            ))}
          </section>
        ))
      )}
    </motion.div>
  );
}
