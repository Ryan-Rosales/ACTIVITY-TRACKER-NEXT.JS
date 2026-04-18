import { ArrowRight, Archive, CheckCircle2, CircleDashed, PlayCircle, Plus } from "lucide-react";
import { useThemeStore } from "@/lib/store/useThemeStore";

const flow = [
  { icon: Plus, label: "Add", color: "from-violet-500 to-indigo-500" },
  { icon: CircleDashed, label: "Pending", color: "from-amber-500 to-orange-400" },
  { icon: PlayCircle, label: "Ongoing", color: "from-blue-500 to-cyan-400" },
  { icon: CheckCircle2, label: "Completed", color: "from-emerald-500 to-green-400" },
  { icon: Archive, label: "Archive", color: "from-purple-500 to-violet-400" },
] as const;

export function TaskFlowDiagram() {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-xl ${isLight ? "border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "border-white/20 bg-white/10"}`}>
      <h3 className={`mb-4 text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>Task Flow</h3>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {flow.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`rounded-full bg-gradient-to-r ${step.color} px-3 py-1.5 text-xs font-semibold text-white shadow-sm`}>
                <span className="inline-flex items-center gap-1">
                  <Icon className="size-3.5" /> {step.label}
                </span>
              </div>
              {index !== flow.length - 1 ? <ArrowRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-400"}`} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
