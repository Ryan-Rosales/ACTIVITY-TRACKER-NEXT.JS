"use client";

const suggestions = [
  "Show my progress",
  "What's overdue?",
  "Give me a tip",
  "Break down my tasks",
];

export function AISuggestions({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
