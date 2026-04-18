import { TrendingDown, TrendingUp } from "lucide-react";

export function StatSummary({ total, delta, avgHours }: { total: number; delta: number; avgHours: number }) {
  const up = delta >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <p className="text-xs text-slate-300">Total Tasks This Week</p>
        <p className="mt-1 text-2xl font-bold text-white">{total}</p>
      </div>
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <p className="text-xs text-slate-300">Change vs Last Week</p>
        <p className="mt-1 inline-flex items-center gap-1 text-2xl font-bold text-white">
          {up ? <TrendingUp className="size-5 text-emerald-400" /> : <TrendingDown className="size-5 text-red-400" />}
          {delta.toFixed(1)}%
        </p>
      </div>
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <p className="text-xs text-slate-300">Avg Completion Time</p>
        <p className="mt-1 text-2xl font-bold text-white">{avgHours.toFixed(1)}h</p>
      </div>
    </div>
  );
}
