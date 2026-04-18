"use client";

import { Archive, CheckCircle2, ChevronLeft, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Task } from "@/lib/types";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { formatDate, getDueDateState } from "@/lib/utils/dateHelpers";
import { priorityColorClass, statusColorClass } from "@/lib/utils/taskHelpers";

export type TaskConfirmationAction =
  | {
      type: "move";
      taskId: string;
      taskTitle: string;
      to: Task["status"];
    }
  | {
      type: "delete";
      taskId: string;
      taskTitle: string;
    }
  | {
      type: "archive";
      taskId: string;
      taskTitle: string;
    };

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onOpenNotes: (task: Task) => void;
  onRequestConfirmation: (action: TaskConfirmationAction) => void;
}

export function TaskCard({ task, onEdit, onOpenNotes, onRequestConfirmation }: TaskCardProps) {
  const dueState = getDueDateState(task.dueDate);
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onOpenNotes(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenNotes(task);
        }
      }}
      role="button"
      tabIndex={0}
      className={`group cursor-pointer rounded-xl border-l-4 ${statusColorClass[task.status]} border-t border-r border-b p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400 ${
        isLight ? "border-slate-200 bg-white text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border-white/10 bg-black/20 text-white"
      }`}
    >
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{task.title}</h4>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${priorityColorClass[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        {task.description ? <p className={`mt-2 line-clamp-3 text-xs group-hover:line-clamp-none ${isLight ? "text-slate-600" : "text-slate-300"}`}>{task.description}</p> : null}
        {task.category ? <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{task.category}</p> : null}
        {task.dueDate ? (
          <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            <span>Due {formatDate(task.dueDate)}</span>
            {dueState.status !== "none" && dueState.status !== "upcoming" ? (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  dueState.status === "overdue"
                    ? isLight
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-amber-300/40 bg-amber-500/15 text-amber-100"
                    : dueState.status === "dueToday"
                      ? isLight
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-amber-300/40 bg-amber-500/15 text-amber-100"
                      : isLight
                        ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                        : "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                }`}
              >
                {dueState.label}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className={`mt-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Created {formatDate(task.createdAt)}</p>

        {task.subtasks?.length ? (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                style={{
                  width: `${Math.round((task.subtasks.filter((subtask) => subtask.completed).length / task.subtasks.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {task.status === "ongoing" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestConfirmation({ type: "move", taskId: task.id, taskTitle: task.title, to: "pending" });
              }}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-200"
              title="Move back to Pending"
            >
              <ChevronLeft className="size-3.5" />
              Pending
            </button>
          ) : null}
          {task.status === "completed" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestConfirmation({ type: "move", taskId: task.id, taskTitle: task.title, to: "ongoing" });
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-1 text-[11px] font-medium text-blue-200"
              title="Move back to Ongoing"
            >
              <ChevronLeft className="size-3.5" />
              Ongoing
            </button>
          ) : null}
          {task.status === "pending" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestConfirmation({ type: "move", taskId: task.id, taskTitle: task.title, to: "ongoing" });
              }}
              className="rounded-md bg-blue-500/20 p-1 text-blue-200"
              title="Move to Ongoing"
              aria-label="Move to Ongoing"
            >
              <PlayCircle className="size-3.5" />
            </button>
          ) : null}
          {task.status === "ongoing" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestConfirmation({ type: "move", taskId: task.id, taskTitle: task.title, to: "completed" });
              }}
              className="rounded-md bg-emerald-500/20 p-1 text-emerald-200"
              title="Move to Completed"
              aria-label="Move to Completed"
            >
              <CheckCircle2 className="size-3.5" />
            </button>
          ) : null}
          {task.status === "completed" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestConfirmation({ type: "archive", taskId: task.id, taskTitle: task.title });
              }}
              className="rounded-md bg-violet-500/20 p-1 text-violet-200"
            >
              <Archive className="size-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
            className="rounded-md bg-white/10 p-1 text-slate-200"
            title="Edit Task"
            aria-label="Edit Task"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRequestConfirmation({ type: "delete", taskId: task.id, taskTitle: task.title });
            }}
            className="rounded-md bg-red-500/20 p-1 text-red-200"
            title="Delete Task"
            aria-label="Delete Task"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </motion.div>
  );
}
