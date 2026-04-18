"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { Notification } from "@/lib/types";

type ToastItem = {
  id: string;
  message: string;
  type: Notification["type"];
};

const TOAST_DURATION_MS = 5200;
const TOAST_STACK_LIMIT = 7;
const NEW_TOAST_BATCH_LIMIT = 5;
const FRESH_TOAST_WINDOW_MS = 15000;
const APP_NOTIFICATION_PUSHED_EVENT = "app:notification-pushed";

const iconForType: Record<Notification["type"], ReactElement> = {
  due_soon: <Info className="size-4 text-cyan-400" />,
  due_today: <TriangleAlert className="size-4 text-amber-400" />,
  overdue: <TriangleAlert className="size-4 text-amber-400" />,
  ai_reminder: <Info className="size-4 text-cyan-400" />,
  update: <CheckCircle2 className="size-4 text-emerald-400" />,
  profile_saved: <CheckCircle2 className="size-4 text-fuchsia-400" />,
  completion: <CheckCircle2 className="size-4 text-emerald-400" />,
  summary: <Info className="size-4 text-blue-400" />,
};

export function ToastCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const mode = useThemeStore((state) => state.mode);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasSeededBaseline = useRef(false);
  const suppressHydrationToastsUntil = useRef(0);

  useEffect(() => {
    if (!hasSeededBaseline.current) {
      // Seed from initial persisted state and briefly suppress bootstrap additions.
      notifications.forEach((item) => seen.current.add(item.id));
      hasSeededBaseline.current = true;
      suppressHydrationToastsUntil.current = Date.now() + 2500;
      return;
    }

    const newcomers = notifications
      .filter((item) => {
        if (seen.current.has(item.id)) return false;
        const timestamp = new Date(item.timestamp).getTime();
        return Date.now() - timestamp <= FRESH_TOAST_WINDOW_MS;
      })
      .slice(0, NEW_TOAST_BATCH_LIMIT)
      .map((item) => ({ id: item.id, message: item.message, type: item.type }));

    if (!newcomers.length) return;

    const isHydrating = Date.now() < suppressHydrationToastsUntil.current;
    newcomers.forEach((item) => seen.current.add(item.id));
    if (isHydrating) return;

    setToasts((state) => [...newcomers.reverse(), ...state].slice(0, TOAST_STACK_LIMIT));
  }, [notifications]);

  useEffect(() => {
    const idsInState = new Set(toasts.map((item) => item.id));

    for (const toast of toasts) {
      if (timers.current.has(toast.id)) continue;
      const timeout = setTimeout(() => {
        setToasts((state) => state.filter((item) => item.id !== toast.id));
        const existing = timers.current.get(toast.id);
        if (existing) {
          clearTimeout(existing);
          timers.current.delete(toast.id);
        }
      }, TOAST_DURATION_MS);
      timers.current.set(toast.id, timeout);
    }

    for (const [id, timeout] of timers.current.entries()) {
      if (idsInState.has(id)) continue;
      clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, [toasts]);

  useEffect(() => {
    return () => {
      for (const timeout of timers.current.values()) {
        clearTimeout(timeout);
      }
      timers.current.clear();
    };
  }, []);

  useEffect(() => {
    const onNotificationPushed = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string; message?: string; type?: Notification["type"] }>;
      const id = customEvent.detail?.id;
      const message = customEvent.detail?.message;
      const type = customEvent.detail?.type;
      if (!id || !message || !type) return;

      seen.current.add(id);
      setToasts((state) => {
        const next = [{ id, message, type }, ...state.filter((item) => item.id !== id)];
        return next.slice(0, TOAST_STACK_LIMIT);
      });
    };

    window.addEventListener(APP_NOTIFICATION_PUSHED_EVENT, onNotificationPushed as EventListener);
    return () => {
      window.removeEventListener(APP_NOTIFICATION_PUSHED_EVENT, onNotificationPushed as EventListener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[120] flex w-[min(92vw,34rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isDelete = toast.message.toLowerCase().includes("deleted");
          const isLight = mode === "light";
          const baseClass = isLight
            ? "text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
            : "text-white shadow-[0_14px_28px_rgba(2,6,23,0.35)]";
          const variantClass = isDelete
            ? isLight
              ? "border-red-300/70 bg-red-50"
              : "border-red-300/40 bg-red-950/85"
            : toast.type === "completion"
              ? isLight
                ? "border-emerald-300/70 bg-emerald-50"
                : "border-emerald-300/40 bg-emerald-950/80"
              : toast.type === "profile_saved"
                ? isLight
                  ? "border-fuchsia-300/75 bg-fuchsia-50"
                  : "border-fuchsia-300/45 bg-fuchsia-950/80"
              : toast.type === "due_today" || toast.type === "overdue"
                ? isLight
                  ? "border-amber-300/70 bg-amber-50"
                  : "border-amber-300/45 bg-amber-950/85"
                : toast.type === "due_soon"
                  ? isLight
                    ? "border-cyan-300/70 bg-cyan-50"
                    : "border-cyan-300/40 bg-cyan-950/85"
                  : toast.type === "summary"
                  ? isLight
                    ? "border-blue-300/70 bg-blue-50"
                    : "border-blue-300/35 bg-blue-950/85"
                  : isLight
                    ? "border-slate-300/80 bg-white"
                    : "border-white/20 bg-slate-950/88";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm backdrop-blur-xl ${baseClass} ${variantClass}`}
            >
              <div className="flex items-center gap-2">
                {isDelete ? <TriangleAlert className={`size-4 ${isLight ? "text-red-500" : "text-red-300"}`} /> : iconForType[toast.type]}
                <span className="line-clamp-2">{toast.message}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
