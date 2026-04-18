"use client";

import { useMemo, useState } from "react";
import { Check, Paperclip, X } from "lucide-react";
import { Task } from "@/lib/types";
import { useThemeStore } from "@/lib/store/useThemeStore";

type TaskAttachmentToolbarProps = {
  tasks: Task[];
  selectedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  onClear: () => void;
};

export function TaskAttachmentToolbar({ tasks, selectedTaskIds, onToggleTask, onClear }: TaskAttachmentToolbarProps) {
  const [open, setOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  const attachableTasks = useMemo(
    () => tasks.filter((task) => task.status === "ongoing" || task.status === "pending"),
    [tasks],
  );

  const selectedTasks = useMemo(
    () => attachableTasks.filter((task) => selectedTaskIds.includes(task.id)),
    [attachableTasks, selectedTaskIds],
  );

  return (
    <div className={`border-t px-3 pt-2 ${isLight ? "border-slate-200" : "border-white/10"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((state) => !state)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
            isLight ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
          aria-label="Attach tasks"
          title="Attach pending or ongoing tasks"
        >
          <Paperclip className="size-3.5" />
          Attach tasks
          {selectedTaskIds.length ? (
            <span className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-violet-100">
              {selectedTaskIds.length}
            </span>
          ) : null}
        </button>

        {selectedTaskIds.length ? (
          <button
            type="button"
            onClick={onClear}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
              isLight ? "border-slate-300 bg-white text-slate-600 hover:bg-slate-50" : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            title="Clear attachments"
            aria-label="Clear attachments"
          >
            <X className="size-3" /> Clear
          </button>
        ) : null}

        {selectedTasks.slice(0, 3).map((task) => (
          <span key={task.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${isLight ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-cyan-300/25 bg-cyan-500/15 text-cyan-100"}`}>
            <span>{task.title}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                task.status === "ongoing"
                  ? isLight
                    ? "bg-amber-100 text-amber-700"
                    : "bg-amber-500/20 text-amber-200"
                  : isLight
                    ? "bg-sky-100 text-sky-700"
                    : "bg-sky-500/20 text-sky-200"
              }`}
            >
              {task.status}
            </span>
          </span>
        ))}

        {selectedTasks.length > 3 ? (
          <span className={`rounded-full border px-2 py-1 text-[11px] ${isLight ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-cyan-300/25 bg-cyan-500/15 text-cyan-100"}`}>
            +{selectedTasks.length - 3} more
          </span>
        ) : null}
      </div>

      {open ? (
        <div className={`mt-2 max-h-32 overflow-y-auto rounded-xl border p-2 ${isLight ? "border-slate-200 bg-white" : "border-white/15 bg-slate-950/90"}`}>
          {attachableTasks.length ? (
            <div className="space-y-1">
              {attachableTasks.map((task) => {
                const selected = selectedTaskIds.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                      selected
                          ? isLight
                            ? "border-violet-300 bg-violet-50 text-slate-900"
                            : "border-violet-300/45 bg-violet-500/20 text-white"
                          : isLight
                            ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{task.title}</span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          task.status === "ongoing"
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-sky-500/20 text-sky-200"
                        }`}
                      >
                        {task.status}
                      </span>
                    </span>
                    {selected ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No pending or ongoing tasks available.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
