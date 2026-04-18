"use client";

import { useRouter } from "next/navigation";
import { Bot, ChartNoAxesColumn, Plus, Bell } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { useThemeStore } from "@/lib/store/useThemeStore";

export function QuickActions({ onAddTask, notificationCount }: { onAddTask: () => void; notificationCount: number }) {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-xl ${isLight ? "border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "border-white/20 bg-white/10"}`}>
      <h3 className={`mb-3 text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>Quick Actions</h3>
      <div className="space-y-2">
        <GradientButton icon={<Plus className="size-4" />} className="w-full justify-start" onClick={onAddTask}>
          Add New Task
        </GradientButton>
        <GradientButton
          variant="secondary"
          icon={<Bot className="size-4" />}
          className="w-full justify-start"
          onClick={() => router.push("/ai")}
        >
          Open AI Assistant
        </GradientButton>
        <GradientButton
          variant="secondary"
          icon={<ChartNoAxesColumn className="size-4" />}
          className="w-full justify-start"
          onClick={() => router.push("/analytics")}
        >
          View Analytics
        </GradientButton>
        <GradientButton
          variant="secondary"
          icon={<Bell className="size-4" />}
          className="w-full justify-start"
          onClick={() => router.push("/notifications")}
        >
          Notifications ({notificationCount})
        </GradientButton>
      </div>
    </div>
  );
}
