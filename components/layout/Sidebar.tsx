"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart2,
  Bell,
  CheckCircle,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
};

const items: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Archive, label: "Archive", href: "/archive" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
];

const taskChildren = [
  { icon: Clock, label: "Pending", href: "/tasks/pending" },
  { icon: Play, label: "Ongoing", href: "/tasks/ongoing" },
  { icon: CheckCircle, label: "Completed", href: "/tasks/completed" },
] as const;

export function Sidebar({
  mobile = false,
  onNavigate,
  onClose,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const mode = useThemeStore((state) => state.mode);
  const collapsed = useThemeStore((state) => state.sidebarCollapsed);
  const tasks = useTaskStore((state) => state.tasks);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLight = mode === "light";

  const taskCount = tasks.filter((task) => task.status !== "archived").length;

  return (
    <aside
      className={cn(
        "h-full backdrop-blur-2xl",
        isLight ? "border-slate-200/90 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)]" : "border-white/10 bg-gray-950/85",
        mobile
          ? "w-[min(88vw,20rem)] border-r shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          : "fixed left-0 top-0 z-40 border-r transition-all duration-300",
        mobile ? "rounded-r-3xl" : collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col p-3">
        <div className="mb-4 flex items-center gap-2 px-2 py-3">
          <div
            className={cn(
              "relative h-10 w-10 overflow-hidden border",
              collapsed && !mobile ? "rounded-lg p-1" : "rounded-2xl p-1.5",
              isLight
                ? "border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
                : "border-white/15 bg-slate-950/80 shadow-[0_8px_24px_rgba(59,130,246,0.28)]",
            )}
          >
            <Image src="/images/logo.png" alt="Activity Tracker logo" fill sizes="40px" className="object-contain p-0.5" priority />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className={cn("font-display text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>Activity Tracker AI</p>
              <p className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>Project Intelligence</p>
            </div>
          ) : null}
          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "ml-auto rounded-lg px-2 py-1 text-xs",
                isLight ? "border border-slate-200 bg-slate-100 text-slate-700" : "border border-white/10 bg-white/5 text-slate-200",
              )}
            >
              Close
            </button>
          ) : null}
        </div>

        <nav className="space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const dynamicBadge =
              item.href === "/tasks"
                ? String(taskCount)
                : item.href === "/notifications" && unreadCount
                  ? String(unreadCount)
                  : item.badge;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                      "group relative flex items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-sm transition-all duration-300",
                    active
                      ? isLight
                          ? "bg-slate-100/95 text-slate-950"
                          : "bg-white/10 text-white"
                      : isLight
                          ? "border-transparent text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100/95 hover:text-slate-950"
                        : "border-transparent text-slate-300 hover:-translate-y-0.5 hover:bg-white/5 hover:text-white",
                  )}
                  style={
                    active
                      ? isLight
                        ? {
                            borderLeftColor: "var(--accent)",
                              backgroundColor: "rgb(var(--accent-rgb) / 0.16)",
                              boxShadow: "0 8px 24px rgb(var(--accent-rgb) / 0.18)",
                          }
                        : {
                            borderLeftColor: "rgb(var(--accent-rgb) / 0.85)",
                            boxShadow: "0 0 24px rgb(var(--accent-rgb) / 0.35)",
                          }
                      : undefined
                  }
                >
                  <Icon className="size-4" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  {!collapsed && dynamicBadge ? (
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2 py-0.5 text-xs",
                        item.href === "/notifications"
                          ? isLight
                            ? "bg-red-100 text-red-700"
                            : "bg-red-500/20 text-red-200"
                          : isLight
                            ? "text-slate-900"
                            : "text-slate-100",
                      )}
                      style={
                        item.href === "/notifications"
                          ? undefined
                          : isLight
                            ? { backgroundColor: "rgb(var(--accent-rgb) / 0.22)" }
                            : { backgroundColor: "rgb(var(--accent-rgb) / 0.28)" }
                      }
                    >
                      {dynamicBadge}
                    </span>
                  ) : null}
                </Link>

                {item.href === "/tasks" && !collapsed && (active || pathname.startsWith("/tasks/")) ? (
                  <div className="mt-1 space-y-1 pl-9">
                    {taskChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all duration-300",
                            childActive
                              ? isLight
                                ? "bg-slate-200/90 text-slate-950"
                                : "bg-white/10 text-white"
                              : isLight
                                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                : "text-slate-400 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <ChildIcon className="size-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}
