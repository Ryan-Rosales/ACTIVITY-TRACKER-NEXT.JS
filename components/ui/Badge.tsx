import { cn } from "@/lib/utils/cn";
import { useThemeStore } from "@/lib/store/useThemeStore";

type BadgeColor = "amber" | "blue" | "green" | "red" | "purple";

const colorMap: Record<BadgeColor, string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  blue: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  red: "bg-red-500/15 text-red-300 border-red-400/30",
  purple: "bg-violet-500/15 text-violet-300 border-violet-400/30",
};

export function Badge({ label, color }: { label: string; color: BadgeColor }) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  const lightColorMap: Record<BadgeColor, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", isLight ? lightColorMap[color] : colorMap[color])}>
      {label}
    </span>
  );
}
