"use client";

import { useThemeStore } from "@/lib/store/useThemeStore";

const suggestions = [
  "Show my progress",
  "What's overdue?",
  "Give me a tip",
  "Break down my tasks",
];

export function AISuggestions({ onPick }: { onPick: (value: string) => void }) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            isLight
              ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
