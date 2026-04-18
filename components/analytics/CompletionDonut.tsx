"use client";

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

export function CompletionDonut({ completed, remaining }: { completed: number; remaining: number }) {
  const total = completed + remaining;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">Weekly Completion</h3>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={[{ name: "completed", value: completed }, { name: "remaining", value: remaining }]} dataKey="value" innerRadius={60} outerRadius={82}>
              <Cell fill="#10B981" />
              <Cell fill="#3B82F6" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-100">{percentage}%</p>
            <p className="text-xs text-slate-300">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
