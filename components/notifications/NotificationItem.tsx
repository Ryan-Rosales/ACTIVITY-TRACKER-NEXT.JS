"use client";

import Link from "next/link";
import { Notification } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/dateHelpers";
import { useThemeStore } from "@/lib/store/useThemeStore";

const dotClass: Record<Notification["type"], string> = {
  due_soon: "bg-cyan-400",
  due_today: "bg-amber-400",
  overdue: "bg-red-400",
  ai_reminder: "bg-violet-400",
  update: "bg-amber-400",
  profile_saved: "bg-fuchsia-400",
  completion: "bg-emerald-400",
  summary: "bg-blue-400",
};

export function NotificationItem({
  notification,
  onRead,
  onDismiss,
  isProcessing = false,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  isProcessing?: boolean;
}) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <div
      className={`rounded-xl border p-3 ${
        notification.read
          ? isLight
            ? "border-slate-200 bg-white"
            : "border-white/10 bg-black/10"
          : isLight
            ? "border-violet-300/70 bg-violet-50"
            : "border-violet-400/40 bg-violet-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1 size-2 rounded-full ${dotClass[notification.type]}`} />
        <div className="flex-1">
          <p className={`text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{notification.message}</p>
          {notification.taskId ? (
            <Link href="/tasks" className={`text-xs ${isLight ? "text-violet-700 hover:text-violet-800" : "text-violet-300 hover:text-violet-200"}`}>
              Related task: {notification.taskTitle ?? notification.taskId}
            </Link>
          ) : null}
          <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{formatDateTime(notification.timestamp)}</p>
        </div>
        <div className="flex gap-2">
          {!notification.read ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onRead(notification.id)}
              className={`rounded px-2 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                isLight
                  ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              Read
            </button>
          ) : null}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onDismiss(notification.id)}
            className={`rounded px-2 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              isLight
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-red-500/20 text-red-200 hover:bg-red-500/30"
            }`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
