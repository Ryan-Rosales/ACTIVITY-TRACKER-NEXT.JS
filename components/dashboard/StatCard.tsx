"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCountUp } from "@/hooks/useCountUp";
import { useThemeStore } from "@/lib/store/useThemeStore";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  route: string;
  gradient: string;
}

export function StatCard({ icon: Icon, label, count, route, gradient }: StatCardProps) {
  const router = useRouter();
  const value = useCountUp(count, 700);
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  const lightSurfaceByRoute: Record<string, string> = {
    "/tasks/pending": "border-amber-300 bg-amber-50 shadow-[0_12px_34px_rgba(245,158,11,0.22)]",
    "/tasks/ongoing": "border-sky-300 bg-sky-50 shadow-[0_12px_34px_rgba(59,130,246,0.22)]",
    "/tasks/completed": "border-emerald-300 bg-emerald-50 shadow-[0_12px_34px_rgba(16,185,129,0.22)]",
    "/archive": "border-violet-300 bg-violet-50 shadow-[0_12px_34px_rgba(139,92,246,0.22)]",
  };

  const lightSurfaceClass = lightSurfaceByRoute[route] ?? "border-slate-300 bg-slate-50 shadow-[0_10px_30px_rgba(15,23,42,0.12)]";

  return (
    <motion.button
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(108,99,255,0.3)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(route)}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left backdrop-blur-xl transition-all ${
        isLight ? `${lightSurfaceClass} text-slate-900` : "border-white/20 bg-white/10 text-white"
      }`}
      type="button"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${isLight ? "opacity-36" : "opacity-25"}`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className={`text-sm ${isLight ? "text-slate-800" : "text-slate-300"}`}>{label}</p>
          <p className={`mt-1 text-2xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{value}</p>
        </div>
        <Icon className={`size-8 ${isLight ? "text-slate-900" : "text-white/90"}`} />
      </div>
      <div className="pointer-events-none absolute -inset-x-full bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)] group-hover:animate-shimmer" />
    </motion.button>
  );
}
