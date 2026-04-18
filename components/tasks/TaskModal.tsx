"use client";

import { useEffect, useState } from "react";
import { CalendarClock, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Task } from "@/lib/types";
import { GradientButton } from "@/components/ui/GradientButton";
import { getDueDateState } from "@/lib/utils/dateHelpers";

type Draft = {
  title: string;
  description: string;
  priority: Task["priority"];
  category: string;
  dueDate: string;
  subtasks: string[];
};

const defaultDraft: Draft = {
  title: "",
  description: "",
  priority: "medium",
  category: "",
  dueDate: "",
  subtasks: [],
};

export function TaskModal({
  onClose,
  onSave,
  task,
}: {
  onClose: () => void;
  onSave: (draft: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  task?: Task | null;
}) {
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const dueState = getDueDateState(draft.dueDate ? new Date(draft.dueDate) : undefined);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (task) {
      setDraft({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        category: task.category ?? "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
        subtasks: task.subtasks?.map((item) => item.title) ?? [],
      });
    } else {
      setDraft(defaultDraft);
    }
  }, [task]);

  return (
    <div className="fixed inset-0 z-[260] grid place-items-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl border border-white/20 bg-slate-950/85 p-5 backdrop-blur-3xl"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">{task ? "Edit Task" : "Add New Task"}</h3>

        <div className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300 uppercase tracking-wide">Title</label>
            <input
              value={draft.title}
              onChange={(event) => setDraft((state) => ({ ...state, title: event.target.value }))}
              placeholder="Enter task title"
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300 uppercase tracking-wide">Description</label>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((state) => ({ ...state, description: event.target.value }))}
              placeholder="Add task details (optional)"
              className="h-24 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
            />
          </div>

          {/* Priority, Category, Date Group */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Priority Field */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-300 uppercase tracking-wide">Priority</label>
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((state) => ({ ...state, priority: event.target.value as Task["priority"] }))
                }
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Category Field */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-300 uppercase tracking-wide">Category</label>
              <input
                value={draft.category}
                onChange={(event) => setDraft((state) => ({ ...state, category: event.target.value }))}
                placeholder="e.g., Work, Personal"
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
              />
            </div>

            {/* Date Field */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-300 uppercase tracking-wide">Due Date</label>
              <input
                value={draft.dueDate}
                onChange={(event) => setDraft((state) => ({ ...state, dueDate: event.target.value }))}
                type="date"
                className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  dueState.status === "overdue"
                    ? "border-amber-300/40 bg-amber-500/15 text-amber-100"
                    : dueState.status === "dueToday"
                      ? "border-amber-300/40 bg-amber-500/15 text-amber-100"
                      : dueState.status === "dueSoon"
                        ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                        : "border-white/15 bg-white/5 text-slate-300"
                }`}
              >
                {dueState.status === "overdue" ? <TriangleAlert className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                {dueState.label}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-300">Subtasks</p>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              {draft.subtasks.length
                ? draft.subtasks.map((subtask) => <p key={subtask}>• {subtask}</p>)
                : "No subtasks yet"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white"
          >
            Cancel
          </button>
          <GradientButton
            type="button"
            onClick={() => {
              if (!draft.title.trim()) return;
              onSave({
                title: draft.title,
                description: draft.description || undefined,
                status: task?.status ?? "pending",
                priority: draft.priority,
                category: draft.category || undefined,
                dueDate: draft.dueDate ? new Date(draft.dueDate) : undefined,
                subtasks: draft.subtasks.map((title) => ({
                  id: crypto.randomUUID(),
                  title,
                  completed: false,
                })),
              });
              onClose();
            }}
          >
            Save Task
          </GradientButton>
        </div>
      </motion.div>
    </div>
  );
}
