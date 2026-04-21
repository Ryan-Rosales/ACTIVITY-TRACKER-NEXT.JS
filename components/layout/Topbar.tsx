"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Bot, CheckCheck, List, Settings, Trash2, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/archive": "Archive",
  "/ai": "AI Assistant",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const unread = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const mode = useThemeStore((state) => state.mode);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const dropdownTransition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };
  const isLight = mode === "light";

  const title = pathname?.startsWith("/tasks/") ? "Tasks" : titles[pathname] ?? "Activity Tracker AI";

  useEffect(() => {
    if (!open && !notificationsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }

      if (open && profileRef.current && !profileRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNotificationsOpen(false);
      setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, open]);

  return (
    <header className="sticky top-0 z-[110] h-16 border-b border-white/10 bg-gray-950/55 px-4 backdrop-blur-2xl md:h-14">
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 80%, #60a5fa), transparent)" }}
      />
      <div className="flex h-full items-center gap-3">
        <div className="md:hidden">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(108,99,255,0.2)]"
          >
            Menu
          </button>
        </div>

        <div className="hidden md:block">
          <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Workspace</div>
        </div>

        <div>
          <h1 className="font-display text-lg font-semibold md:text-xl accent-text">
          {title}
          </h1>
          <p className="hidden text-xs text-slate-400 md:block">AI-powered activity orchestration</p>
        </div>
        <div className="flex-1" />

        <button
          type="button"
          onClick={() => router.push("/ai")}
          className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 md:inline-flex"
          style={{
            background: "linear-gradient(90deg, var(--accent), #3b82f6)",
            boxShadow: "0 10px 26px rgb(var(--accent-rgb) / 0.35)",
          }}
        >
          <Bot className="mr-1 size-3.5" /> AI Assistant
        </button>

        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((state) => !state)}
            className="relative rounded-xl border border-white/20 bg-white/10 p-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white animate-pulse">
                {unread}
              </span>
            ) : null}
          </button>

          <AnimatePresence>
            {notificationsOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={dropdownTransition}
                style={{ transformOrigin: "top right" }}
                className="absolute right-0 z-[220] mt-2 w-[22rem] overflow-hidden rounded-xl border border-white/20 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl"
              >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:bg-white/10"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-lg border border-red-300/30 bg-red-500/10 p-1.5 text-red-200 transition hover:bg-red-500/20"
                    title="Clear all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {notifications.slice(0, 6).length ? (
                  notifications.slice(0, 6).map((item) => (
                    <div key={item.id} className="mb-1 rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-100">{item.message}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        {!item.read ? (
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className="rounded-md border border-white/15 bg-white/10 p-1 text-slate-200 hover:bg-white/15"
                            title="Mark as read"
                          >
                            <CheckCheck className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-center text-xs text-slate-400">No notifications yet.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  router.push("/notifications");
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
              >
                <List className="size-3.5" /> View all notifications
              </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        <div ref={profileRef} className="relative">
          <button type="button" onClick={() => setOpen((v) => !v)}>
            <Avatar name={user?.name ?? "User"} src={user?.avatar} />
          </button>
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={dropdownTransition}
                style={{ transformOrigin: "top right" }}
                className={`absolute right-0 mt-2 w-44 rounded-xl border p-2 text-sm shadow-xl backdrop-blur-xl ${
                  isLight
                    ? "border-slate-300 bg-white/95 text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.22)]"
                    : "border-white/20 bg-slate-900/95 text-white"
                }`}
              >
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                  isLight ? "hover:bg-slate-100" : "hover:bg-white/10"
                }`}
              >
                <User className="size-4" /> Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                  isLight ? "hover:bg-slate-100" : "hover:bg-white/10"
                }`}
              >
                <Settings className="size-4" /> Settings
              </button>
              <div className={`my-1 h-px ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition ${
                  isLight ? "text-red-600 hover:bg-red-50" : "text-red-300 hover:bg-red-500/15"
                }`}
              >
                Logout
              </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
