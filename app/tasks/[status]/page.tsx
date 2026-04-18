"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { formatDate } from "@/lib/utils/dateHelpers";

const valid = ["pending", "ongoing", "completed"] as const;

export default function StatusTasksPage() {
  const params = useParams<{ status: string }>();
  const router = useRouter();
  const status = params.status;
  const tasks = useTaskStore((state) => state.tasks);

  const visibleTasks = tasks.filter((task) => task.status === status);

  useEffect(() => {
    if (!valid.includes(status as (typeof valid)[number])) {
      router.replace("/tasks");
    }
  }, [router, status]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
      <button
        type="button"
        onClick={() => router.push("/tasks")}
        className="text-sm text-violet-300 hover:text-violet-200"
      >
        ← Back to all tasks
      </button>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleTasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-white">{task.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{task.description}</p>
            <p className="mt-2 text-xs text-slate-300">Created: {formatDate(task.createdAt)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
